"""The shared web3 contract reader for verification routines."""

from __future__ import annotations

from typing import Any

from web3 import AsyncWeb3

from engine.config import LOG, Settings


def make_client(settings: Settings) -> AsyncWeb3:
    """Builds the async web3 client bound to Base mainnet.
    @param settings - the runtime settings
    @returns the configured AsyncWeb3 client
    """
    return AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.rpc_url))


ERC20_ABI: list[dict[str, Any]] = [
    {
        "name": "totalSupply",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
    },
    {
        "name": "owner",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "address"}],
    },
    {
        "name": "balanceOf",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
    },
]

BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"


async def read_total_supply(w3: AsyncWeb3, token: str) -> tuple[int, int]:
    """Reads totalSupply on the token contract with the block number.
    @param w3 - the web3 client
    @param token - the token contract address
    @returns the total supply and the block number
    @raises VerificationError when the call fails
    """
    contract = w3.eth.contract(address=w3.to_checksum_address(token), abi=ERC20_ABI)
    block = await w3.eth.block_number
    try:
        supply = await contract.functions.totalSupply().call(block_identifier=block)
    except Exception as error:  # web3 raises broad provider errors
        LOG.error("verify failed for %s at totalSupply: %s", token, error)
        raise VerificationError(f"verify failed for {token} at totalSupply") from error
    return int(supply), int(block)


async def read_burned(w3: AsyncWeb3, token: str) -> tuple[int, int]:
    """Reads the token balance at the burn address with the block number.
    @param w3 - the web3 client
    @param token - the token contract address
    @returns the burned balance and the block number
    """
    contract = w3.eth.contract(address=w3.to_checksum_address(token), abi=ERC20_ABI)
    block = await w3.eth.block_number
    burned = await contract.functions.balanceOf(w3.to_checksum_address(BURN_ADDRESS)).call(
        block_identifier=block
    )
    return int(burned), int(block)


async def read_owner(w3: AsyncWeb3, token: str) -> tuple[str | None, int]:
    """Reads owner on the contract where it exposes one.
    @param w3 - the web3 client
    @param token - the token contract address
    @returns the owner address or None when the method is absent, and the block
    """
    contract = w3.eth.contract(address=w3.to_checksum_address(token), abi=ERC20_ABI)
    block = await w3.eth.block_number
    try:
        owner = await contract.functions.owner().call(block_identifier=block)
        return str(owner), int(block)
    except Exception:
        return None, int(block)


class VerificationError(RuntimeError):
    """Raised when a verification routine fails, carrying the target."""
