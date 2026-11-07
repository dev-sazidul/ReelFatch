"""
Per-route, per-client request limit, matching the previous API's throttle:
each route has its own window of RATE_LIMIT_TTL_MS with RATE_LIMIT_LIMIT requests.
A client that goes over the limit is blocked for one window.
"""
from __future__ import annotations

import math
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Awaitable, Callable

from fastapi import HTTPException, Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

STATE_KEY = 'rate_limit_headers'


@dataclass
class _Bucket:
    hits: deque[float] = field(default_factory=deque)
    blocked_until: float = 0.0


@dataclass(frozen=True)
class ThrottleResult:
    blocked: bool
    limit: int
    remaining: int
    reset_seconds: int
    retry_after_seconds: int = 0


class Throttler:
    def __init__(self, ttl_ms: int, limit: int, clock: Callable[[], float] = lambda: time.monotonic() * 1000):
        self._ttl = ttl_ms
        self._limit = limit
        self._clock = clock
        self._buckets: dict[tuple[str, str], _Bucket] = {}
        self._calls = 0

    def hit(self, route: str, client: str) -> ThrottleResult:
        now = self._clock()
        self._calls += 1
        if self._calls % 1000 == 0:
            self._purge(now)
        bucket = self._buckets.setdefault((route, client), _Bucket())
        while bucket.hits and bucket.hits[0] <= now - self._ttl:
            bucket.hits.popleft()

        if bucket.blocked_until > now:
            return ThrottleResult(True, self._limit, 0, self._seconds(bucket.blocked_until - now), self._seconds(bucket.blocked_until - now))
        if bucket.blocked_until:
            bucket.blocked_until = 0.0
            bucket.hits.clear()

        bucket.hits.append(now)
        reset = self._seconds(bucket.hits[0] + self._ttl - now)
        if len(bucket.hits) > self._limit:
            bucket.blocked_until = now + self._ttl
            return ThrottleResult(True, self._limit, 0, reset, self._seconds(self._ttl))
        return ThrottleResult(False, self._limit, max(0, self._limit - len(bucket.hits)), reset)

    def _purge(self, now: float) -> None:
        stale = [key for key, bucket in self._buckets.items() if bucket.blocked_until <= now and (not bucket.hits or bucket.hits[-1] <= now - self._ttl)]
        for key in stale:
            del self._buckets[key]

    @staticmethod
    def _seconds(milliseconds: float) -> int:
        return max(0, math.ceil(milliseconds / 1000))


def throttle(route: str) -> Callable[[Request], Awaitable[None]]:
    async def dependency(request: Request) -> None:
        throttler: Throttler = request.app.state.throttler
        client = request.client.host if request.client else 'unknown'
        result = throttler.hit(route, client)
        if result.blocked:
            raise HTTPException(429, 'Too Many Requests', headers={'Retry-After': str(result.retry_after_seconds)})
        request.state.rate_limit_headers = {
            'X-RateLimit-Limit': str(result.limit),
            'X-RateLimit-Remaining': str(result.remaining),
            'X-RateLimit-Reset': str(result.reset_seconds),
        }

    return dependency


class RateLimitHeadersMiddleware:
    """Adds the rate-limit headers a route's throttle recorded, to success and error responses alike."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message['type'] == 'http.response.start':
                extra = scope.get('state', {}).get(STATE_KEY)
                if extra:
                    headers = list(message.get('headers', []))
                    headers.extend((name.lower().encode('latin-1'), value.encode('latin-1')) for name, value in extra.items())
                    message = {**message, 'headers': headers}
            await send(message)

        await self.app(scope, receive, send_with_headers)
