"""Repository sourced captures, walking the docs directory commit history."""

from __future__ import annotations

import base64
from typing import Any

import httpx

from engine.config import LOG
from engine.ingest.extract import extract_sections
from engine.ingest.cdx import IngestError
from engine.store import body_key, hash_text, put_body
from engine.types import Capture

GITHUB_API = "https://api.github.com"


async def resolve_docs_repo(host: str, repo_url: str | None, token: str | None) -> str | None:
    """Resolves the public docs repository for a host where one exists.
    @param host - the project's primary host
    @param repo_url - an explicitly supplied repository URL, takes precedence
    @param token - the GitHub token for higher rate limits
    @returns the owner/repo slug, or None when no repository is known
    """
    if repo_url:
        return repo_url.rstrip("/").removeprefix("https://github.com/")
    LOG.info("no docs repository configured for %s, archive only", host)
    return None


async def walk_docs_history(
    slug: str, docs_dir: str, token: str | None
) -> list[Capture]:
    """Walks the commit history of the docs directory, one capture per commit,
    each carrying the exact commit hash as its source reference. Force pushes
    and deleted branches surface as gaps rather than being smoothed over.
    @param slug - the owner/repo slug
    @param docs_dir - the docs directory path inside the repository
    @param token - the GitHub token
    @returns repository sourced captures, oldest first
    @raises IngestError when the history cannot be read
    """
    headers = {"accept": "application/vnd.github+json"}
    if token:
        headers["authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        response = await client.get(
            f"{GITHUB_API}/repos/{slug}/commits", params={"path": docs_dir, "per_page": "100"}
        )
        if response.status_code != 200:
            raise IngestError(f"ingest failed for {slug} at repo history, status {response.status_code}")
        commits: list[dict[str, Any]] = response.json()

    captures: list[Capture] = []
    for commit in reversed(commits):
        sha = commit["sha"]
        captured_at = int(__import__("datetime").datetime.fromisoformat(
            commit["commit"]["author"]["date"].replace("Z", "+00:00")
        ).timestamp())
        message = commit["commit"]["message"]
        sections = {"commit": message}
        key = body_key(f"git-{sha}")
        put_body(key, {"sha": sha, "message": message})
        captures.append(
            Capture(
                capture_id=f"git-{sha[:12]}",
                source="repository",
                source_ref=sha,
                captured_at=captured_at,
                url=f"https://github.com/{slug}/commit/{sha}",
                section_hashes={path: hash_text(text) for path, text in sections.items()},
                body_key=key,
            )
        )
    return captures


def fetch_file_content(content: dict[str, Any]) -> str:
    """Decodes one GitHub content API file payload.
    @param content - the content API response
    @returns the decoded file text
    """
    return base64.b64decode(content["content"]).decode("utf-8")
