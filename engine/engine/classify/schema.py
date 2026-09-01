"""The structured output schema for classification."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

Category = Literal[
    "supply", "allocation", "unlocks", "locks",
    "audit", "ownership", "fees", "burns",
]


class Classification(BaseModel):
    """One model response, cosmetic or material with an extracted claim."""

    classification: Literal["cosmetic", "material", "rewrite"]
    category: Optional[Category] = None
    value_as_written: Optional[str] = None
    unit: Optional[str] = None
    quote: Optional[str] = None
