"""
Request body parsing and validation.

Mirrors the previous API: a JSON object body, unknown properties rejected, and
400 INVALID_REQUEST with readable messages when a field is missing or malformed.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, Request

MAX_BODY_BYTES = 100 * 1024
_LOOKUP_ID = re.compile(r'[a-f0-9]{32}')


def _reject_constant(name: str) -> Any:
    raise ValueError(f'Invalid JSON constant {name}')


async def read_json_body(request: Request) -> dict[str, Any]:
    raw = bytearray()
    async for chunk in request.stream():
        if len(raw) + len(chunk) > MAX_BODY_BYTES:
            raise HTTPException(413, 'request entity too large')
        raw.extend(chunk)
    mime = request.headers.get('content-type', '').split(';')[0].strip().lower()
    if mime != 'application/json' or not raw.strip():
        return {}
    try:
        body = json.loads(raw, parse_constant=_reject_constant)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(400, 'The request body is not valid JSON.') from None
    if not isinstance(body, dict):
        raise HTTPException(400, 'The request body must be a JSON object.')
    return body


def _unknown_properties(body: dict[str, Any], allowed: set[str]) -> list[str]:
    return [f'property {key} should not exist' for key in body if key not in allowed]


def _fail(messages: list[str]) -> None:
    if messages:
        raise HTTPException(400, ' '.join(messages))


@dataclass(frozen=True)
class LookupRequest:
    url: str


@dataclass(frozen=True)
class DownloadRequest:
    lookup_id: str
    quality_id: str


def validate_lookup(body: dict[str, Any]) -> LookupRequest:
    messages = _unknown_properties(body, {'url'})
    url = body.get('url')
    if not (isinstance(url, str) and len(url) <= 2000):
        messages.append('url must be shorter than or equal to 2000 characters')
    if not (isinstance(url, str) and len(url) >= 1):
        messages.append('url must be longer than or equal to 1 characters')
    if not isinstance(url, str):
        messages.append('url must be a string')
    _fail(messages)
    return LookupRequest(url=url)  # type: ignore[arg-type]


def validate_download(body: dict[str, Any]) -> DownloadRequest:
    messages = _unknown_properties(body, {'lookupId', 'qualityId'})
    lookup_id = body.get('lookupId')
    if not (isinstance(lookup_id, str) and _LOOKUP_ID.fullmatch(lookup_id)):
        messages.append('lookupId must match /^[a-f0-9]{32}$/ regular expression')
    if not isinstance(lookup_id, str):
        messages.append('lookupId must be a string')
    quality_id = body.get('qualityId')
    if quality_id != 'source':
        messages.append('qualityId must be one of the following values: source')
    if not isinstance(quality_id, str):
        messages.append('qualityId must be a string')
    _fail(messages)
    return DownloadRequest(lookup_id=lookup_id, quality_id=quality_id)  # type: ignore[arg-type]
