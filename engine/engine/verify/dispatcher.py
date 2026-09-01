"""Verification dispatcher, one fixed routine per claim category."""

from __future__ import annotations

import re

from web3 import AsyncWeb3

from engine.config import LOG
from engine.types import ClaimRecord, Verification
from engine.verify.base_client import (
    BURN_ADDRESS,
    VerificationError,
    read_burned,
    read_owner,
    read_total_supply,
)

PERCENT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%")


def _parse_number(text: str) -> float | None:
    """Parses the first number in a value string, tolerating commas.
    @param text - the value as written
    @returns the parsed number, or None when absent
    """
    match = re.search(r"\d[\d,.]*", text)
    if not match:
        return None
    raw = match.group(0).replace(",", "")
    try:
        return float(raw)
    except ValueError:
        return None


async def verify_claim(claim: ClaimRecord, token: str | None, w3: AsyncWeb3) -> Verification:
    """Executes the fixed routine for the claim's category against Base and
    returns a verdict of held, broken or unverifiable, with a reason on
    unverifiable, never a score and never an estimate.
    @param claim - the extracted claim record
    @param token - the subject token address, None for docs only claims
    @param w3 - the web3 client
    @returns the verification result with full provenance
    """
    if token is None:
        return _unverifiable(claim, "no subject token address for this ledger")
    try:
        if claim.category == "supply":
            supply, block = await read_total_supply(w3, token)
            expected = _parse_number(claim.value_as_written)
            if expected is None:
                return _unverifiable(claim, "no numeric value in the claim as written")
            supply_tokens = supply / 10**18
            held = abs(supply_tokens - expected) / max(1.0, expected) <= 0.02
            return Verification(
                claim_id=claim.claim_id,
                contract=token,
                method="totalSupply()",
                returned_value=f"{supply_tokens:.0f}",
                block_number=block,
                verdict="held" if held else "broken",
                reason=None if held else "chain supply differs from the published figure by more than 2%",
            )
        if claim.category == "burns":
            burned, block = await read_burned(w3, token)
            expected = _parse_number(claim.value_as_written)
            if expected is None:
                return _unverifiable(claim, "no numeric value in the claim as written")
            burned_tokens = burned / 10**18
            held = burned_tokens >= expected * 0.98
            return Verification(
                claim_id=claim.claim_id,
                contract=token,
                method=f"balanceOf({BURN_ADDRESS})",
                returned_value=f"{burned_tokens:.0f}",
                block_number=block,
                verdict="held" if held else "broken",
                reason=None if held else "burn address holds less than the published burn claim",
            )
        if claim.category == "ownership":
            owner, block = await read_owner(w3, token)
            if owner is None:
                return _unverifiable(claim, "contract exposes no owner method")
            return Verification(
                claim_id=claim.claim_id,
                contract=token,
                method="owner()",
                returned_value=owner,
                block_number=block,
                verdict="held",
                reason=None,
            )
        return _unverifiable(
            claim, f"no deterministic routine for category {claim.category} on this ledger"
        )
    except VerificationError as error:
        LOG.error("%s", error)
        return _unverifiable(claim, "chain read failed, the claim is left unverified")


def _unverifiable(claim: ClaimRecord, reason: str) -> Verification:
    """Builds an unverifiable result with a stated reason.
    @param claim - the claim that could not be verified
    @param reason - why it could not be verified
    @returns the unverifiable verification record
    """
    return Verification(
        claim_id=claim.claim_id,
        contract=None,
        method="none",
        returned_value="",
        block_number=0,
        verdict="unverifiable",
        reason=reason,
    )
