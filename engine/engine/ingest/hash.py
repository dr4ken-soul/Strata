"""Section hashing helpers."""

from __future__ import annotations

from engine.store import hash_text


def changed_sections(
    previous: dict[str, str] | None, current: dict[str, str]
) -> dict[str, str]:
    """Returns the sections whose hash differs from the previous capture.
    @param previous - the previous capture's hash map, or None for the first
    @param current - the current capture's hash map
    @returns the subset of current hashes that changed
    """
    if previous is None:
        return current
    return {
        path: digest
        for path, digest in current.items()
        if previous.get(path) != digest
    }
