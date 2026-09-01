"""The change set, one change per section, byte identical on identical inputs."""

from __future__ import annotations

from pydantic import BaseModel

from engine.diff.sections import section_pairs
from engine.diff.tokens import token_changes
from engine.types import Capture


class Change(BaseModel):
    """One section level change between two consecutive captures."""

    path: str
    before: str
    after: str
    position: int
    from_capture: str
    to_capture: str
    captured_at: int


def build_change_set(
    previous: Capture, current: Capture, bodies: dict[str, dict]
) -> list[Change]:
    """Produces the change set between two captures in code, with no model
    involved. Sections are matched by heading path, then compared at token
    level, and one change is emitted per section.
    @param previous - the older capture
    @param current - the newer capture
    @param bodies - loaded capture bodies keyed by body_key
    @returns the ordered change list, deterministic for identical inputs
    """
    changes: list[Change] = []
    for index, (path, before, after) in enumerate(section_pairs(previous, current, bodies)):
        if token_changes(before, after):
            changes.append(
                Change(
                    path=path,
                    before=before,
                    after=after,
                    position=index,
                    from_capture=previous.capture_id,
                    to_capture=current.capture_id,
                    captured_at=current.captured_at,
                )
            )
    return changes
