from __future__ import annotations

import asyncio
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from urllib.parse import urljoin

import httpx

from app.errors import ApiError
from app.http_client import ClientFactory, create_http_client
from app.security.url_safety import is_allowed_media_url

_DECIMAL = re.compile(r'[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?')


@dataclass
class OpenedMedia:
    stream: AsyncIterator[bytes]
    content_type: str
    content_length: int | None = None


def _content_length(header: str | None) -> float | None:
    if not header:
        return None
    text = header.strip()
    if text == '':
        return 0.0
    return float(text) if _DECIMAL.fullmatch(text) else float('nan')


async def open_allowed_media(
    source_url: str,
    *,
    timeout_ms: int,
    max_bytes: int,
    client_factory: ClientFactory = create_http_client,
) -> OpenedMedia:
    loop = asyncio.get_running_loop()
    deadline = loop.time() + timeout_ms / 1000
    client = client_factory()
    response: httpx.Response | None = None
    try:
        current = source_url
        for _hop in range(3):
            if not is_allowed_media_url(current):
                raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The file address from Facebook is not on an allowed media host.')
            try:
                async with asyncio.timeout_at(deadline):
                    candidate = await client.send(client.build_request('GET', current), stream=True, follow_redirects=False)
            except TimeoutError:
                raise ApiError(504, 'PROVIDER_TIMEOUT', 'The video file host did not respond before the timeout.') from None
            except Exception:
                raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host could not be reached.') from None
            if 300 <= candidate.status_code < 400:
                location = candidate.headers.get('location')
                await candidate.aclose()
                if not location:
                    raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host sent an incomplete redirect.')
                current = urljoin(current, location)
                continue
            response = candidate
            break

        if response is None:
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host redirected too many times.')
        if not response.is_success or response.status_code in (204, 205):
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', f'The video file host returned HTTP {response.status_code}.')

        content_type = (response.headers.get('content-type') or '').split(';')[0].strip().lower()
        if not content_type.startswith('video/') and content_type != 'application/octet-stream':
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host did not return a video file.')

        length = _content_length(response.headers.get('content-length'))
        if length is not None and (length != length or length in (float('inf'), float('-inf')) or length > max_bytes):
            raise ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.')
    except BaseException:
        if response is not None:
            await response.aclose()
        await client.aclose()
        raise

    return OpenedMedia(
        stream=_capped_stream(response, client, deadline, max_bytes),
        content_type=content_type,
        content_length=int(length) if length is not None and float(length).is_integer() else None,
    )


async def _capped_stream(response: httpx.Response, client: httpx.AsyncClient, deadline: float, max_bytes: int) -> AsyncIterator[bytes]:
    """Yields the file, enforcing the total download deadline and the byte cap. Reads only as fast as the caller consumes."""
    seen = 0
    chunks = response.aiter_bytes().__aiter__()
    try:
        while True:
            try:
                async with asyncio.timeout_at(deadline):
                    chunk = await chunks.__anext__()
            except StopAsyncIteration:
                break
            seen += len(chunk)
            if seen > max_bytes:
                raise ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.')
            yield chunk
    finally:
        await response.aclose()
        await client.aclose()
