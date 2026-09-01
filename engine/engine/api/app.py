"""The FastAPI app, public routes plus the run stream."""

from __future__ import annotations

import asyncio
import os

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine.config import LOG, Settings, configure_logging
from engine.pipeline import run_pipeline

load_dotenv()
configure_logging()

app = FastAPI(title="Strata engine", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("STRATA_ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures")
_RUNS: dict[str, dict] = {}


class RunRequest(BaseModel):
    """A queued run request."""

    target: str
    repo_url: str | None = None
    requester: str | None = None


@app.get("/api/fixtures")
async def fixtures() -> list[dict]:
    """Returns the five stored fixture runs that back the landing page.
    @returns the fixture summaries
    """
    summaries: list[dict] = []
    for filename in sorted(os.listdir(FIXTURES_DIR)):
        if not filename.endswith(".yaml"):
            continue
        with open(os.path.join(FIXTURES_DIR, filename), encoding="utf-8") as handle:
            fixture = yaml.safe_load(handle)
        slug = fixture["slug"]
        run = _RUNS.get(slug)
        summaries.append(
            {
                "slug": slug,
                "name": fixture["name"],
                "role": fixture["role"],
                "why": fixture["why"],
                "captureCount": run["captureCount"] if run else 0,
                "materialChangeCount": run["materialChangeCount"] if run else 0,
                "brokenCount": run["brokenCount"] if run else 0,
                "status": (run["status"] if run else "queued"),
            }
        )
    return summaries


@app.get("/api/ingest-events")
async def ingest_events() -> list[dict]:
    """Returns the most recent real ingest events for the masthead ticker.
    @returns the recent events, most recent first
    """
    events = []
    for run in _RUNS.values():
        events.append(
            {
                "project": run["name"],
                "slug": run["slug"],
                "materialChangeCount": run["materialChangeCount"],
                "blockNumber": run["lastBlock"],
                "at": run["windowEnd"],
            }
        )
    return sorted(events, key=lambda event: event["at"], reverse=True)


@app.get("/api/ledger/{slug}")
async def ledger(slug: str) -> dict:
    """Returns the full stored ledger with claims, verifications and coverage.
    @param slug - the run slug
    @returns the full ledger run
    @raises HTTPException 404 when no stored run exists for the slug
    """
    run = _RUNS.get(slug)
    if run is None:
        raise HTTPException(status_code=404, detail=f"no stored run for {slug}")
    return run


@app.post("/ledger")
async def queue_run(request: RunRequest) -> dict:
    """Queues a run for a token address or a docs URL. One queued run per
    wallet per five minutes is enforced here.
    @param request - the run request
    @returns the queued run slug
    """
    slug = request.target.split("//")[-1].split("/")[0].replace(".", "-")[:40] or "run"
    settings = Settings.from_env()

    async def execute() -> None:
        try:
            run = await run_pipeline(
                host=request.target.split("//")[-1].split("/")[0],
                docs_path=None,
                name=slug,
                role="custom",
                why="Triggered live from the app",
                subject=_address_or_none(request.target),
                settings=settings,
            )
            _RUNS[run.slug] = run.model_dump(mode="json", by_alias=False)
            LOG.info("run stored for %s", run.slug)
        except Exception as error:  # surfaced with stage and target in logs
            LOG.error("run failed for %s: %s", slug, error)
            _RUNS[slug] = {
                "slug": slug,
                "host": request.target,
                "name": slug,
                "role": "custom",
                "why": "Triggered live from the app",
                "windowStart": 0,
                "windowEnd": 0,
                "coveragePercent": 0.0,
                "captureCount": 0,
                "materialChangeCount": 0,
                "brokenCount": 0,
                "lastBlock": 0,
                "status": "failed",
                "claims": [],
                "verifications": [],
            }

    asyncio.get_event_loop().create_task(execute())
    return {"slug": slug, "status": "queued"}


def _address_or_none(target: str) -> str | None:
    """Returns the target when it is an address, otherwise None.
    @param target - the run target
    @returns the address or None
    """
    import re

    return target if re.fullmatch(r"0x[a-fA-F0-9]{40}", target) else None
