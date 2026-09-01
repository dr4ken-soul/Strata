"""Server sent events stream for one run, emitting stage progress and counts
while a run executes."""

from __future__ import annotations

import asyncio

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from engine.api.app import _RUNS

STREAM_INTERVAL_SECONDS = 2.0


async def run_stream(slug: str) -> StreamingResponse:
    """Streams server sent events for one run until it completes, partial or
    fails. Capped at one open connection per client by the deployment layer.
    @param slug - the run slug
    @returns the SSE streaming response
    @raises HTTPException 404 when no such run is known
    """
    if slug not in _RUNS:
        raise HTTPException(status_code=404, detail=f"no stored run for {slug}")

    async def generator():
        """Yields stage progress and counts until the run stops.
        @yields the SSE frames
        """
        while True:
            run = _RUNS.get(slug)
            if run is None:
                break
            yield (
                f"event: progress\ndata: slug={slug} status={run['status']} "
                f"captures={run['captureCount']} material={run['materialChangeCount']}\n\n"
            )
            if run["status"] in ("complete", "partial", "failed"):
                break
            await asyncio.sleep(STREAM_INTERVAL_SECONDS)

    return StreamingResponse(generator(), media_type="text/event-stream")
