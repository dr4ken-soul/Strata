"""Wayback CDX queries and capture fetching."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from engine.config import LOG
from engine.ingest.extract import extract_sections
from engine.store import body_key, hash_text, put_body
from engine.types import Capture

CDX_URL = "https://web.archive.org/cdx/search/cdx"


async def query_cdx(host: str, docs_path: str | None) -> list[dict[str, str]]:
    """Queries the Wayback CDX index for every capture of the target host.
    @param host - the project's primary host, without scheme
    @param docs_path - optional docs subpath to filter on
    @returns the raw CDX rows, oldest first
    @raises IngestError when the CDX index is unreachable
    """
    params: dict[str, str] = {
        "url": f"{host}/{docs_path}*" if docs_path else f"{host}/*",
        "output": "json",
        "fl": "timestamp,original,statuscode,digest",
        "filter": "statuscode:200",
        "collapse": "digest",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(CDX_URL, params=params)
        if response.status_code != 200:
            raise IngestError(f"ingest failed for {host} at cdx, status {response.status_code}")
        rows = response.json()
    if len(rows) < 2:
        return []
    header = rows[0]
    return [dict(zip(header, row)) for row in rows[1:]]


async def fetch_capture(host: str, row: dict[str, str]) -> Capture:
    """Fetches one full capture, extracts and hashes its sections, and stores
    the body. The body fetch is the expensive step, the hash map is what a re
    run actually needs.
    @param host - the project's primary host
    @param row - one CDX row
    @returns the capture with its section hash map
    """
    timestamp = row["timestamp"]
    original = row["original"]
    url = f"https://web.archive.org/web/{timestamp}/{original}"
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise IngestError(
                f"ingest failed for {host} at capture {timestamp}, status {response.status_code}"
            )
        html = response.text
    sections = extract_sections(html)
    section_hashes = {path: hash_text(text) for path, text in sections.items()}
    capture_id = f"wb-{timestamp}"
    key = body_key(capture_id)
    put_body(key, {"url": url, "sections": sections})
    return Capture(
        capture_id=capture_id,
        source="archive",
        source_ref=capture_id,
        captured_at=_ts_to_epoch(timestamp),
        url=url,
        section_hashes=section_hashes,
        body_key=key,
    )


def _ts_to_epoch(timestamp: str) -> int:
    """Converts a wayback 14 digit timestamp to unix seconds.
    @param timestamp - YYYYmmddHHMMSS
    @returns unix seconds
    """
    import datetime

    dt = datetime.datetime(
        int(timestamp[0:4]), int(timestamp[4:6]), int(timestamp[6:8]),
        int(timestamp[8:10]), int(timestamp[10:12]), int(timestamp[12:14]),
        tzinfo=datetime.timezone.utc,
    )
    return int(dt.timestamp())


class IngestError(RuntimeError):
    """Raised when any ingest stage fails, carrying the stage and the target."""
