"""The figure guard. Any returned figure absent from the input text fails the
response, it is retried once, then the change is marked unresolved, never
guessed."""

from __future__ import annotations

import re

from engine.classify.schema import Classification
from engine.config import LOG

FIGURE_RE = re.compile(r"\d[\d,.%]*")


def figures_in(text: str) -> set[str]:
    """Extracts every figure appearing in a text.
    @param text - the input text
    @returns the set of figure strings
    """
    return set(FIGURE_RE.findall(text))


def guard(classification: Classification, before: str, after: str) -> bool:
    """Checks a model response against the text it was handed. The value and
    the quote must be present in the input, and every figure in the value must
    appear in the input text.
    @param classification - the model's response
    @param before - the before text of the diff
    @param after - the after text of the diff
    @returns True when the response is grounded in its input
    """
    if classification.classification == "cosmetic":
        return True
    if classification.classification == "material":
        if classification.value_as_written is None or classification.quote is None:
            LOG.warning("material response missing value or quote, rejected by guard")
            return False
        allowed = figures_in(before) | figures_in(after)
        if not figures_in(classification.value_as_written) <= allowed:
            LOG.warning("figure absent from input text, rejected by guard")
            return False
        combined = before + "\n" + after
        if classification.quote.strip() not in combined:
            LOG.warning("quote not present in input text, rejected by guard")
            return False
        return True
    return True
