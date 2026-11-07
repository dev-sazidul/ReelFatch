from __future__ import annotations

from http.cookiejar import CookieJar, DefaultCookiePolicy
from typing import Callable

import httpx

ClientFactory = Callable[[], httpx.AsyncClient]


def _cookie_free_jar() -> CookieJar:
    # An empty allow-list makes the jar refuse every cookie, so none are stored or sent.
    return CookieJar(policy=DefaultCookiePolicy(allowed_domains=[]))


def create_http_client() -> httpx.AsyncClient:
    """
    Outbound client for Facebook and its CDN.
    - Never stores or sends cookies.
    - Ignores proxy, netrc, and other environment settings so no stored credential is attached.
    - Does not follow redirects; callers check each hop themselves.
    - Has no per-read timeout; callers apply a total deadline.
    """
    return httpx.AsyncClient(
        cookies=_cookie_free_jar(),
        follow_redirects=False,
        trust_env=False,
        timeout=httpx.Timeout(None),
    )
