"""Verification against Base. Fixed routines per claim category, executed in
code. Every result records the contract address, the method, the returned
value and the block number at which it was read. A claim with no onchain
equivalent is recorded as unverifiable with a reason, never scored."""

from __future__ import annotations
