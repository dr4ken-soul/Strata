"""Ingest, reconstructs every published version of a target's pages.

Two sources run in parallel, the Wayback CDX index and the public docs
repository history, each section hashed so only a section that genuinely
changed is ever fetched in full.
"""

from __future__ import annotations
