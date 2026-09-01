"""Section matching across captures."""

from __future__ import annotations

from engine.types import Capture


def section_pairs(
    previous: Capture, current: Capture, bodies: dict[str, dict]
) -> list[tuple[str, str, str]]:
    """Matches sections between two captures by heading path.
    @param previous - the older capture
    @param current - the newer capture
    @param bodies - loaded capture bodies keyed by body_key
    @returns triples of heading path, previous text, current text
    """
    prev_sections: dict[str, str] = bodies.get(previous.body_key, {}).get("sections", {})
    curr_sections: dict[str, str] = bodies.get(current.body_key, {}).get("sections", {})
    pairs: list[tuple[str, str, str]] = []
    for path in curr_sections:
        if path in prev_sections and prev_sections[path] != curr_sections[path]:
            pairs.append((path, prev_sections[path], curr_sections[path]))
    for path, text in prev_sections.items():
        if path not in curr_sections:
            pairs.append((path, text, ""))
    return pairs
