from __future__ import annotations

import socket
from unittest.mock import AsyncMock, patch

import pytest
from starlette.requests import Request

from app.errors import ApiError
from app.providers.facebook.provider import FacebookVideoProvider
from app.rate_limit import extract_client_ip
from app.security.url_safety import ensure_public_dns_host, is_global_ip, parse_public_http_url
from app.videos.service import VideosService
from app.videos.store import DownloadJobStore
from tests.helpers import config, run


@pytest.mark.no_dns_mock
def test_ssrf_blocks_alternative_ip_formats_and_private_dns():
    for bad in ('http://2130706433/', 'http://0x7f000001/', 'http://127.1/', 'http://0177.0.0.1/'):
        with pytest.raises(ApiError):
            parse_public_http_url(bad)

    assert is_global_ip('127.0.0.1') is False
    assert is_global_ip('169.254.169.254') is False
    assert is_global_ip('10.0.0.1') is False
    assert is_global_ip('172.17.0.2') is False
    assert is_global_ip('::1') is False
    assert is_global_ip('8.8.8.8') is True

    async def fake_private_dns(*_args, **_kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('169.254.169.254', 443))]

    with patch('asyncio.AbstractEventLoop.getaddrinfo', new=fake_private_dns):
        with pytest.raises(ApiError) as exc:
            run(ensure_public_dns_host('rebind.example.com', 443))
        assert exc.value.code == 'INVALID_URL'


def test_proxy_aware_rate_limit_ip_extraction():
    trusted = ('127.0.0.1', '172.16.0.0/12')

    # Trusted proxy with CF-Connecting-IP
    req_cf = Request({
        'type': 'http',
        'client': ('172.18.0.5', 12345),
        'headers': [(b'cf-connecting-ip', b'203.0.113.42')],
    })
    assert extract_client_ip(req_cf, trusted) == '203.0.113.42'

    # Trusted proxy with X-Forwarded-For chain
    req_xff = Request({
        'type': 'http',
        'client': ('127.0.0.1', 12345),
        'headers': [(b'x-forwarded-for', b'198.51.100.1, 172.18.0.2')],
    })
    assert extract_client_ip(req_xff, trusted) == '198.51.100.1'

    # Untrusted direct client spoofing CF-Connecting-IP -> ignored
    req_spoof = Request({
        'type': 'http',
        'client': ('198.51.100.99', 12345),
        'headers': [(b'cf-connecting-ip', b'1.1.1.1')],
    })
    assert extract_client_ip(req_spoof, trusted) == '198.51.100.99'


def test_download_job_store_purges_expired_and_bounds_size():
    now = 1000.0
    store = DownloadJobStore(clock=lambda: now, max_entries=3)
    j1 = store.create('a' * 32, 'source', ttl_ms=100)
    j2 = store.create('b' * 32, 'source', ttl_ms=500)
    assert store.get(j1.job_id) is not None

    now = 1200.0
    assert store.get(j1.job_id) is None
    assert j1.job_id not in store._jobs
    assert store.get(j2.job_id) is not None

    # Max entries bound
    for i in range(5):
        store.create(f'{i:032x}', 'source', ttl_ms=500)
    assert len(store._jobs) <= 3


def test_open_download_rejects_already_streaming_or_completed_job():
    cfg = config(enable_yt_dlp=True)
    service = VideosService(cfg, FacebookVideoProvider(cfg))
    lookup = run(
        service._lookups.save(  # type: ignore[arg-type]
            type('L', (), {'platform': 'youtube', 'video_id': 'v1', 'source_label': 'yt-dlp (Youtube)', 'qualities': [], 'reported_formats': [], 'title': 'T', 'description': None, 'thumbnail_url': None, 'webpage_url': 'https://www.youtube.com/watch?v=v1', 'duration_seconds': None})(),
            60_000,
        )
        if False
        else None
    ) if False else None

    job = service._jobs.create('a' * 32, 'source', 60_000)
    service._jobs.update(job.job_id, status='streaming')
    with pytest.raises(ApiError) as exc:
        run(service.open_download(job.job_id))
    assert exc.value.status_code == 409

    service._jobs.update(job.job_id, status='completed')
    with pytest.raises(ApiError) as exc2:
        run(service.open_download(job.job_id))
    assert exc2.value.status_code == 410
