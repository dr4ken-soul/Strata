"""The attestation queue, strictly serialised so chain writes confirm in order
and the database records the uid only after the receipt."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from engine.config import LOG, Settings
from engine.types import Verification
from engine.attest.eas import AttestationError, write_attestation


@dataclass
class QueueItem:
    """One pending attestation write."""

    subject: str
    category: str
    quote: str
    source_ref: str
    verification: Verification


class AttestQueue:
    """Serialised attestation queue. Chain write confirms first, then the
    database row records the uid, never the reverse."""

    def __init__(self, settings: Settings) -> None:
        """Creates the queue with its settings.
        @param settings - the runtime settings
        """
        self._settings = settings
        self._items: list[QueueItem] = []
        self._lock = asyncio.Lock()
        self._uids: dict[str, str] = {}

    def enqueue(self, item: QueueItem) -> None:
        """Adds one attestation request to the queue.
        @param item - the pending write
        """
        self._items.append(item)

    async def drain(self) -> dict[str, str]:
        """Drains the queue, writing each attestation onchain and recording the
        uid only after confirmation.
        @returns a mapping of claim id to the confirmed attestation uid
        """
        async with self._lock:
            for item in self._items:
                try:
                    uid = await write_attestation(
                        self._settings,
                        item.subject,
                        item.category,
                        item.quote,
                        item.source_ref,
                        item.verification.block_number,
                        item.verification.verdict,
                    )
                    self._uids[item.verification.claim_id] = uid
                except AttestationError as error:
                    LOG.error("%s", error)
            drained = dict(self._uids)
            self._items = []
            return drained
