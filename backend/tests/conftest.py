from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _mock_public_dns(monkeypatch: pytest.MonkeyPatch, request: pytest.FixtureRequest) -> None:
    """Allow offline unit tests to run without real DNS unless explicitly testing DNS SSRF."""
    if 'no_dns_mock' in request.keywords:
        return

    async def _allow_dns(_hostname: str, _port: int = 443) -> None:
        return None

    monkeypatch.setattr('app.videos.service.ensure_public_dns_host', _allow_dns)
