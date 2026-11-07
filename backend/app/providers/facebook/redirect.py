from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Literal
from urllib.parse import SplitResult, urljoin, urlunsplit

import httpx

from app.providers.facebook.url import FacebookLinkType, classify_facebook_target
from app.security.url_safety import split_url

MAX_HOPS = 4


@dataclass(frozen=True)
class FacebookResolution:
    status: Literal['resolved', 'unresolved', 'login_required', 'rate_limited', 'unavailable']
    video_id: str | None = None
    via: Literal['url', 'redirect'] | None = None
    link_type: FacebookLinkType | None = None


def _facebook_host(hostname: str) -> bool:
    host = hostname.lower()
    host = host[:-1] if host.endswith('.') else host
    bare = host[4:] if host.startswith('www.') else host
    return bare == 'facebook.com' or bare.endswith('.facebook.com') or bare == 'fb.watch' or bare.endswith('.fb.watch') or bare == 'fb.me'


def _is_login_url(url: SplitResult) -> bool:
    path = url.path.lower()
    return path == '/login' or path.startswith('/login/') or 'login.php' in path or path.startswith('/checkpoint')


def _safe_redirect_url(url: SplitResult) -> bool:
    return (url.scheme.lower() == 'https' and not url.username and not url.password
            and url.port in (None, 443) and _facebook_host(url.hostname or ''))


def _id_from_url(url: SplitResult) -> str | None:
    target = classify_facebook_target(url)
    return target.video_id if target.kind == 'video' else None


async def resolve_facebook_video_id(start: SplitResult, client: httpx.AsyncClient, timeout_ms: int) -> FacebookResolution:
    """
    Reads a numeric video id from the URL or from a public HTTPS redirect.
    Uses HEAD, so no response body is read. The client must not keep or send cookies.
    """
    direct = _id_from_url(start)
    if direct:
        return FacebookResolution('resolved', video_id=direct, via='url')

    initial = classify_facebook_target(start)
    link_type: FacebookLinkType = initial.link_type if initial.kind == 'unresolved' and initial.link_type else 'other'
    if link_type == 'other':
        return FacebookResolution('unresolved', link_type=link_type)
    if not _safe_redirect_url(start):
        return FacebookResolution('unavailable')

    current = urlunsplit(start)
    for _hop in range(MAX_HOPS):
        try:
            async with asyncio.timeout(timeout_ms / 1000):
                request = client.build_request(
                    'HEAD',
                    current,
                    headers={'accept': 'text/html', 'user-agent': 'ReelFetch/1.0'},
                )
                response = await client.send(request, stream=True, follow_redirects=False)
        except Exception:
            return FacebookResolution('unavailable')
        await response.aclose()

        if response.status_code == 429:
            return FacebookResolution('rate_limited')
        if response.status_code < 300 or response.status_code >= 400:
            return FacebookResolution('unresolved', link_type=link_type)

        location = response.headers.get('location')
        if not location:
            return FacebookResolution('unavailable')
        try:
            next_raw = urljoin(current, location)
        except ValueError:
            return FacebookResolution('unavailable')
        next_url = split_url(next_raw)
        if next_url is None:
            return FacebookResolution('unavailable')
        if not _safe_redirect_url(next_url):
            return FacebookResolution('unavailable')
        if _is_login_url(next_url):
            return FacebookResolution('login_required')
        video_id = _id_from_url(next_url)
        if video_id:
            return FacebookResolution('resolved', video_id=video_id, via='redirect')
        current = next_raw

    return FacebookResolution('unresolved', link_type=link_type)
