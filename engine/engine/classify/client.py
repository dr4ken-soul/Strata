"""The model client, one diff per call, structured output only. The model is
given no chain data, performs no arithmetic, and no chain reads happen here."""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

from engine.classify.guard import guard
from engine.classify.schema import Classification
from engine.config import LOG

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-5"

SYSTEM_PROMPT = (
    "You classify one change between two published versions of a project's docs. "
    "Reply with JSON only, no prose, matching exactly this shape: "
    '{"classification":"cosmetic|material|rewrite","category":"supply|allocation|unlocks|locks|'
    'audit|ownership|fees|burns|null","value_as_written":"string or null",'
    '"unit":"string or null","quote":"exact sentence the claim appears in or null"}. '
    "Whitespace, navigation or wording changes are cosmetic. A change to a supply figure, "
    "an allocation percentage, a cliff length, an unlock rate, a lock claim, an audit claim, "
    "a burn claim, a fee or an ownership claim is material, with the value copied exactly as "
    "written and the exact quote. A substantial rewrite with many claims is a rewrite, the "
    "claims are extracted individually by the caller. Never invent a figure, copy values "
    "exactly from the text you are given."
)


async def classify_change(
    path: str, before: str, after: str, api_key: str | None = None
) -> Classification | None:
    """Sends one change to the model and returns a structured record, retried
    once on a guard failure, then returning None so the change is marked
    unresolved rather than guessed.
    @param path - the heading path of the changed section
    @param before - the before text
    @param after - the after text
    @param api_key - the Anthropic API key, defaults to the environment
    @returns the guarded classification, or None when unresolved
    """
    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        LOG.warning("classify failed for %s: no model client configured, change marked unresolved", path)
        return None
    user_text = f"SECTION: {path}\nBEFORE:\n{before}\n\nAFTER:\n{after}"
    payload: dict[str, Any] = {
        "model": MODEL,
        "max_tokens": 512,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_text}],
    }
    for attempt in (1, 2):
        response_json = await _call_model(key, payload, path)
        if response_json is None:
            continue
        classification = _parse(response_json, path)
        if classification is not None and guard(classification, before, after):
            return classification
        LOG.warning("classify attempt %d for %s failed the guard", attempt, path)
    LOG.warning("classify unresolved for %s after one retry, never guessed", path)
    return None


async def _call_model(key: str, payload: dict[str, Any], path: str) -> dict[str, Any] | None:
    """Performs one Anthropic messages call.
    @param key - the API key
    @param payload - the request body
    @param path - the section path, for error surfacing
    @returns the response JSON, or None on failure
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                ANTHROPIC_URL,
                headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
                json=payload,
            )
        except httpx.HTTPError as error:
            LOG.warning("classify failed for %s at model call: %s", path, error)
            return None
    if response.status_code != 200:
        LOG.warning("classify failed for %s at model call, status %d", path, response.status_code)
        return None
    body: dict[str, Any] = response.json()
    return body


def _parse(body: dict[str, Any], path: str) -> Classification | None:
    """Parses the model response into the schema, tolerating a fenced JSON.
    @param body - the Anthropic response body
    @param path - the section path, for error surfacing
    @returns the parsed classification, or None when unparseable
    """
    content = body.get("content")
    if not isinstance(content, list) or len(content) == 0:
        return None
    text = str(content[0].get("text", "") if isinstance(content[0], dict) else "")
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return Classification.model_validate(json.loads(text))
    except (json.JSONDecodeError, ValueError) as error:
        LOG.warning("classify failed for %s at parse: %s", path, error)
        return None
