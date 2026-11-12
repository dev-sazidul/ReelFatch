from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable, TypeVar
from urllib.parse import urlsplit

import httpx

from app.config import AppConfig

T = TypeVar('T')
Handler = Callable[[httpx.Request], httpx.Response]

BASE_CONFIG = AppConfig(
    port=3000,
    cors_origins=('http://localhost:5173',),
    graph_api_version='v26.0',
    request_timeout_ms=1000,
    download_timeout_ms=1000,
    max_download_bytes=1000,
    rate_limit_ttl_ms=60_000,
    rate_limit_limit=10,
    lookup_ttl_ms=60_000,
    enable_yt_dlp=False,
)


def config(**changes: Any) -> AppConfig:
    from dataclasses import replace

    return replace(BASE_CONFIG, **changes)


def factory(handler: Handler) -> Callable[[], httpx.AsyncClient]:
    def create() -> httpx.AsyncClient:
        return httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)

    return create


def client(handler: Handler) -> httpx.AsyncClient:
    return factory(handler)()


def run(coroutine: Awaitable[T]) -> T:
    return asyncio.run(coroutine)  # type: ignore[arg-type]


def url(raw: str):
    return urlsplit(raw)
