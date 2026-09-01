"""Ingest runner, `python -m engine.ingest <host>`."""

from __future__ import annotations

import asyncio
import sys

from engine.config import LOG, configure_logging
from engine.ingest.cdx import IngestError, fetch_capture, query_cdx


async def main() -> int:
    """Runs a full archive ingest against one host and prints the ordered
    capture set with a real coverage percentage.
    @returns the process exit code
    """
    configure_logging()
    if len(sys.argv) < 2:
        LOG.error("usage: python -m engine.ingest <host> [docs_path]")
        return 2
    host = sys.argv[1]
    docs_path = sys.argv[2] if len(sys.argv) > 2 else None
    try:
        rows = await query_cdx(host, docs_path)
    except IngestError as error:
        LOG.error("%s", error)
        return 1
    captures = []
    previous_hashes: dict[str, str] | None = None
    for row in rows:
        capture = await fetch_capture(host, row)
        changed = {
            path: digest
            for path, digest in capture.section_hashes.items()
            if previous_hashes is None or previous_hashes.get(path) != digest
        }
        if previous_hashes is not None and not changed:
            LOG.info("capture %s unchanged at section level, body kept from storage", capture.capture_id)
            continue
        previous_hashes = capture.section_hashes
        captures.append(capture)
    for capture in captures:
        LOG.info("capture %s %s sections=%d", capture.capture_id, capture.url, len(capture.section_hashes))
    coverage = compute_coverage([c.captured_at for c in captures])
    LOG.info("ordered captures for %s: %d, coverage %.1f%%", host, len(captures), coverage)
    return 0


def compute_coverage(captured_at: list[int], _unused: int = 0) -> float:
    """Computes coverage as the share of thirty day windows in the project's
    public lifetime holding at least one capture.
    @param captured_at - sorted capture timestamps in unix seconds
    @returns the coverage percentage
    """
    if len(captured_at) < 2:
        return 0.0
    ordered = sorted(captured_at)
    start, end = ordered[0], ordered[-1]
    window = 30 * 24 * 3600
    total = max(1, (end - start) // window + 1)
    covered = set()
    for ts in ordered:
        covered.add((ts - start) // window)
    return round(100.0 * len(covered) / total, 1)


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
