"""EAS attestation writer for verified and broken promises."""

from __future__ import annotations

import hashlib

from web3 import AsyncWeb3

from engine.config import LOG, Settings
from engine.types import Verification

STRATA_SCHEMA = (
    "address subject,string category,bytes32 sourceHash,string sourceRef,"
    "uint64 verifiedAtBlock,uint8 verdict"
)

VERDICT_IDS = {"held": 0, "broken": 1, "unverifiable": 2}


def source_hash(quote: str) -> bytes:
    """Hashes the source quote so the attestation stays cheap while remaining
    tamper evident.
    @param quote - the published quote
    @returns the sha256 digest of the quote
    """
    return hashlib.sha256(quote.encode("utf-8")).digest()


def encode_data(
    subject: str, category: str, digest: bytes, source_ref: str, block: int, verdict: str
) -> str:
    """Encodes the Strata schema payload with ABI standard encoding.
    @param subject - the subject token address, or the zero address
    @param category - the claim category
    @param digest - the source hash
    @param source_ref - archive capture id or commit hash
    @param block - the verification block
    @param verdict - held, broken or unverifiable
    @returns the hex encoded attestation data
    """
    from eth_abi import encode as abi_encode

    data = abi_encode(
        ["address", "string", "bytes32", "string", "uint64", "uint8"],
        [
            AsyncWeb3.to_checksum_address(subject) if subject else "0x" + "00" * 20,
            category,
            digest,
            source_ref,
            block,
            VERDICT_IDS.get(verdict, 2),
        ],
    )
    return "0x" + data.hex()


EAS_ABI_COMMIT = [
    {
        "name": "attest",
        "type": "function",
        "stateMutability": "payable",
        "inputs": [
            {
                "name": "schemaData",
                "type": "tuple",
                "components": [
                    {"name": "schema", "type": "bytes32"},
                    {"name": "recipient", "type": "address"},
                    {"name": "expirationTime", "type": "uint64"},
                    {"name": "revocable", "type": "bool"},
                    {"name": "refUID", "type": "bytes32"},
                    {"name": "data", "type": "bytes"},
                    {"name": "value", "type": "uint256"},
                ],
            }
        ],
        "outputs": [{"name": "", "type": "bytes32"}],
    }
]


async def write_attestation(
    settings: Settings, subject: str, category: str, quote: str,
    source_ref: str, block: int, verdict: str,
) -> str:
    """Writes one attestation through EAS on Base from the engine hot wallet and
    waits for the receipt before returning the uid. The caller records the uid
    only after this confirms.
    @param settings - the runtime settings carrying the hot wallet key
    @param subject - the subject token address, or the zero address
    @param category - the claim category
    @param quote - the published quote
    @param source_ref - archive capture id or commit hash
    @param block - the verification block
    @param verdict - held, broken or unverifiable
    @returns the attestation uid
    @raises AttestationError when the wallet, schema or write is unavailable
    """
    if not settings.engine_private_key:
        raise AttestationError("attest failed: no engine hot wallet configured")
    if not settings.eas_address or not settings.eas_schema_uid:
        raise AttestationError("attest failed: EAS address or schema uid not configured")

    account = AsyncWeb3().eth.account.from_key(settings.engine_private_key)
    w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.rpc_url))
    eas = w3.eth.contract(address=w3.to_checksum_address(settings.eas_address), abi=EAS_ABI_COMMIT)
    schema_data = (
        bytes.fromhex(settings.eas_schema_uid.removeprefix("0x")),
        "0x" + "00" * 20,
        0,
        False,
        b"\x00" * 32,
        bytes.fromhex(
            encode_data(subject, category, source_hash(quote), source_ref, block, verdict)
            .removeprefix("0x")
        ),
        0,
    )
    tx = await eas.functions.attest(schema_data).build_transaction(
        {
            "from": account.address,
            "nonce": await w3.eth.get_transaction_count(account.address),
            "gas": 400_000,
            "maxFeePerGas": await w3.eth.gas_price,
            "maxPriorityFeePerGas": w3.to_wei(0.001, "gwei"),
            "chainId": 8453,
        }
    )
    signed = account.sign_transaction(tx)
    tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.get("status") != 1:
        LOG.error("attest failed for %s at %s, reverted", category, source_ref)
        raise AttestationError("attest failed: reverted onchain")
    LOG.info("attest confirmed for %s at %s, tx %s", category, source_ref, tx_hash.hex())
    return tx_hash.hex()


class AttestationError(RuntimeError):
    """Raised when attestation writing fails, before any database write."""
