"""Shared types for the engine, mirroring the frontend data structures."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

ClaimCategory = Literal[
    "supply", "allocation", "unlocks", "locks",
    "audit", "ownership", "fees", "burns",
]
Verdict = Literal["held", "broken", "unverifiable"]
RunStatus = Literal[
    "queued", "ingesting", "diffing", "classifying",
    "verifying", "complete", "partial", "failed",
]


class Capture(BaseModel):
    """One published version of a page, archive or repository sourced."""

    capture_id: str
    source: Literal["archive", "repository"]
    source_ref: str
    captured_at: int
    url: str
    section_hashes: dict[str, str] = Field(default_factory=dict)
    body_key: str


class ClaimRecord(BaseModel):
    """One structured claim extracted from a material change."""

    claim_id: str
    category: ClaimCategory
    value_as_written: str
    unit: Optional[str] = None
    quote: str
    capture_id: str
    captured_at: int
    supersedes: Optional[str] = None


class Verification(BaseModel):
    """The result of one fixed verification routine against Base."""

    claim_id: str
    contract: Optional[str] = None
    method: str
    returned_value: str
    block_number: int
    verdict: Verdict
    reason: Optional[str] = None
    attestation_uid: Optional[str] = None


class LedgerRun(BaseModel):
    """The full stored run backing one ledger."""

    slug: str
    subject: Optional[str] = None
    host: str
    name: str
    role: str
    why: str
    window_start: int
    window_end: int
    coverage_percent: float
    capture_count: int
    material_change_count: int
    broken_count: int
    last_block: int
    status: RunStatus
    claims: list[ClaimRecord] = Field(default_factory=list)
    verifications: list[Verification] = Field(default_factory=list)
