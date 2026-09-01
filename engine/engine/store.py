"""Object storage for capture bodies, backed by the local filesystem in
development and by Supabase storage when configured. Bodies are keyed by
capture id so a re run with unchanged section hashes fetches almost nothing."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

STORAGE_DIR = Path(os.environ.get("STRATA_STORAGE_DIR", ".strata-storage"))


def body_key(capture_id: str) -> str:
    """Builds the storage key for one capture body.
    @param capture_id - the wayback capture id or commit hash
    @returns the storage key
    """
    return f"bodies/{capture_id}.json"


def put_body(key: str, payload: dict) -> str:
    """Stores a capture body and returns its content hash.
    @param key - the storage key
    @param payload - the capture body as a dict
    @returns the sha256 hex digest of the serialised body
    """
    path = STORAGE_DIR / key
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(payload, sort_keys=True).encode("utf-8")
    path.write_bytes(raw)
    return hashlib.sha256(raw).hexdigest()


def get_body(key: str) -> dict | None:
    """Reads a capture body by key.
    @param key - the storage key
    @returns the body dict, or None when absent
    """
    path = STORAGE_DIR / key
    if not path.exists():
        return None
    return json.loads(path.read_bytes())


def hash_text(text: str) -> str:
    """Hashes extracted text deterministically.
    @param text - the section text
    @returns the sha256 hex digest
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
