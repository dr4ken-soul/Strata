"""The pipeline, orchestrating ingest, diff, classify, verify and attest for
one target. This is the one place the stages meet."""

from __future__ import annotations

import asyncio
import uuid

from web3 import AsyncWeb3

from engine.classify.client import classify_change
from engine.config import LOG, Settings, configure_logging
from engine.diff.changeset import build_change_set
from engine.ingest.cdx import fetch_capture, query_cdx
from engine.ingest.__main__ import compute_coverage
from engine.store import get_body
from engine.types import Capture, ClaimRecord, LedgerRun, Verification
from engine.verify.base_client import make_client
from engine.verify.dispatcher import verify_claim

CATEGORY_ORDER = [
    "supply", "allocation", "unlocks", "locks", "audit", "ownership", "fees", "burns",
]


async def run_pipeline(
    host: str,
    docs_path: str | None,
    name: str,
    role: str,
    why: str,
    subject: str | None,
    settings: Settings,
) -> LedgerRun:
    """Runs the full pipeline against one target and returns the stored run.
    Every claim is extracted from a material change by the model, guarded, and
    every claim with an onchain equivalent is verified in code against Base.
    @param host - the project's primary host
    @param docs_path - optional docs subpath
    @param name - the display name of the project
    @param role - the fixture role, control, schedule, rewrite or vanished
    @param why - the one line why this run exists
    @param subject - the subject token address, or None
    @param settings - the runtime settings
    @returns the completed or partial ledger run
    """
    configure_logging()
    run_id = uuid.uuid4().hex[:12]
    LOG.info("run %s starting for %s", run_id, host)

    rows = await query_cdx(host, docs_path)
    captures: list[Capture] = []
    previous_hashes: dict[str, str] | None = None
    for row in rows:
        capture = await fetch_capture(host, row)
        if previous_hashes is not None and capture.section_hashes == previous_hashes:
            continue
        previous_hashes = capture.section_hashes
        captures.append(capture)
    captures.sort(key=lambda capture: capture.captured_at)

    bodies = {capture.body_key: get_body(capture.body_key) or {} for capture in captures}
    claims: list[ClaimRecord] = []
    for previous, current in zip(captures, captures[1:]):
        for change in build_change_set(previous, current, bodies):
            classification = await classify_change(change.path, change.before, change.after)
            if classification is None:
                LOG.warning("change %s at %s left unresolved", change.to_capture, change.path)
                continue
            if classification.classification == "cosmetic":
                continue
            quote = classification.quote or change.after[:280]
            previous_claim = claims[-1] if claims else None
            claims.append(
                ClaimRecord(
                    claim_id=f"{run_id}-{len(claims)}",
                    category=classification.category or "supply",
                    value_as_written=classification.value_as_written or change.after[:80],
                    unit=classification.unit,
                    quote=quote,
                    capture_id=current.capture_id,
                    captured_at=current.captured_at,
                    supersedes=previous_claim.claim_id if previous_claim else None,
                )
            )

    w3 = make_client(settings)
    verifications: list[Verification] = []
    for claim in claims:
        verifications.append(await verify_claim(claim, subject, w3))

    block = await w3.eth.block_number
    coverage = compute_coverage([capture.captured_at for capture in captures])
    broken = sum(1 for verification in verifications if verification.verdict == "broken")
    status: str = "complete" if coverage >= 50.0 else "partial"
    LOG.info("run %s complete for %s, %d claims, %d broken", run_id, host, len(claims), broken)

    return LedgerRun(
        slug=slugify(name),
        subject=subject,
        host=host,
        name=name,
        role=role,
        why=why,
        window_start=captures[0].captured_at if captures else 0,
        window_end=captures[-1].captured_at if captures else 0,
        coverage_percent=coverage,
        capture_count=len(captures),
        material_change_count=len(claims),
        broken_count=broken,
        last_block=block,
        status=status,  # type: ignore[arg-type]
        claims=claims,
        verifications=verifications,
    )


def slugify(name: str) -> str:
    """Builds the url slug for a project name.
    @param name - the display name
    @returns the slug
    """
    return "".join(ch if ch.isalnum() else "-" for ch in name.lower()).strip("-")
