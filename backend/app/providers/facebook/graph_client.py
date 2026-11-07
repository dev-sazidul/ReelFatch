from __future__ import annotations

import asyncio
import json
import re
from typing import Any
from urllib.parse import urlencode

import httpx

from app.errors import ApiError, redact_sensitive

GRAPH_FIELDS = 'id,name,description,picture,source,format'
_VIDEO_ID = re.compile(r'[0-9]{5,20}')
_REDIRECT_STATUSES = {301, 302, 303, 307, 308}


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _js_text(value: Any) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def map_graph_failure(status: int, error: dict[str, Any] | None, secrets: list[str]) -> ApiError:
    error = error if isinstance(error, dict) else {}
    graph_code = error.get('code')
    message = error.get('message')
    safe_message = redact_sensitive(message if isinstance(message, str) else 'Facebook rejected the request.', secrets)
    code = graph_code if _is_number(graph_code) else None

    if code == 190 or status == 401:
        return ApiError(401, 'PROVIDER_UNAUTHORIZED', 'The Facebook access token was rejected. Check the token, its permissions, and that it has not expired.')
    if code in (4, 17, 32, 613) or status == 429:
        return ApiError(429, 'PROVIDER_RATE_LIMITED', 'Facebook rate-limited the request. Wait and try again.')
    if code in (10, 200, 273):
        return ApiError(403, 'VIDEO_NOT_PERMITTED', 'Facebook did not permit access to this video. The token must belong to a person or Page allowed to read it.')
    if code in (100, 803) or status == 404:
        return ApiError(404, 'VIDEO_NOT_FOUND', 'Facebook could not find a video for that id. The link may not be a video, or the id may be wrong.')
    suffix = f' (code {_js_text(graph_code)})' if graph_code else ''
    return ApiError(502, 'PROVIDER_ERROR', f'Facebook returned HTTP {status}{suffix}. {safe_message}'[:300])


def _reject_constant(name: str) -> Any:
    raise ValueError(f'Invalid JSON constant {name}')


class FacebookGraphClient:
    def __init__(self, version: str, token: str, timeout_ms: int, client: httpx.AsyncClient):
        self._version = version
        self._token = token
        self._timeout_ms = timeout_ms
        self._client = client

    async def get_video(self, video_id: str) -> dict[str, Any]:
        if not _VIDEO_ID.fullmatch(video_id):
            raise ApiError(400, 'INVALID_URL', 'The video id is not numeric.')
        endpoint = f'https://graph.facebook.com/{self._version}/{video_id}?{urlencode({"fields": GRAPH_FIELDS})}'
        loop = asyncio.get_running_loop()
        deadline = loop.time() + self._timeout_ms / 1000

        try:
            async with asyncio.timeout_at(deadline):
                request = self._client.build_request(
                    'GET',
                    endpoint,
                    headers={'authorization': f'Bearer {self._token}', 'accept': 'application/json'},
                )
                response = await self._client.send(request, stream=True, follow_redirects=False)
        except TimeoutError:
            raise ApiError(504, 'PROVIDER_TIMEOUT', 'The Facebook Graph API did not respond before the timeout.') from None
        except Exception:
            raise ApiError(502, 'PROVIDER_ERROR', 'The Facebook Graph API could not be reached.') from None

        try:
            if response.status_code in _REDIRECT_STATUSES:
                raise ApiError(502, 'PROVIDER_ERROR', 'The Facebook Graph API could not be reached.')
            try:
                async with asyncio.timeout_at(deadline):
                    raw = await response.aread()
                body = json.loads(raw, parse_constant=_reject_constant)
            except Exception:
                raise ApiError(502, 'PROVIDER_ERROR', f'Facebook returned HTTP {response.status_code} with an unreadable response.') from None
        finally:
            await response.aclose()

        if not isinstance(body, dict):
            body = {}
        if not response.is_success or body.get('error'):
            raise map_graph_failure(response.status_code, body.get('error'), [self._token])
        return body
