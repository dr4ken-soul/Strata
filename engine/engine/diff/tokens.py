"""Token level comparison inside one section."""

from __future__ import annotations

import re

TOKEN_RE = re.compile(r"\S+")


def tokenize(text: str) -> list[str]:
    """Splits text into tokens on whitespace, deterministically.
    @param text - the section text
    @returns the token list
    """
    return TOKEN_RE.findall(text)


def token_changes(before: str, after: str) -> list[str]:
    """Returns the tokens removed and added between two texts, as unified
    minus and plus strings, order preserving.
    @param before - the older text
    @param after - the newer text
    @returns the removed then added token lines
    """
    before_tokens = tokenize(before)
    after_tokens = tokenize(after)
    removed = [token for token in before_tokens if token not in after_tokens]
    added = [token for token in after_tokens if token not in before_tokens]
    lines = []
    if removed:
        lines.append("removed: " + " ".join(removed))
    if added:
        lines.append("added: " + " ".join(added))
    return lines
