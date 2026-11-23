from __future__ import annotations

import asyncio
import json
import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import urlsplit

import pytest

from app.errors import ApiError
from app.providers.ytdlp_provider import (
    YtDlpVideoProvider,
    build_format_selector,
    detect_platform_from_hostname,
    extract_qualities_from_info,
    map_ytdlp_error,
    safe_attachment_filename,
)
from app.videos.service import VideosService
from tests.helpers import config, run


def test_detect_platform_from_hostname():
    assert detect_platform_from_hostname('www.facebook.com') == 'facebook'
    assert detect_platform_from_hostname('fb.watch') == 'facebook'
    assert detect_platform_from_hostname('m.facebook.com') == 'facebook'
    assert detect_platform_from_hostname('youtube.com') == 'youtube'
    assert detect_platform_from_hostname('youtu.be') == 'youtube'
    assert detect_platform_from_hostname('www.tiktok.com') == 'tiktok'
    assert detect_platform_from_hostname('instagram.com') == 'instagram'
    assert detect_platform_from_hostname('x.com') == 'x'
    assert detect_platform_from_hostname('twitter.com') == 'x'
    assert detect_platform_from_hostname('reddit.com') == 'reddit'
    assert detect_platform_from_hostname('redd.it') == 'reddit'
    assert detect_platform_from_hostname('pinterest.com') == 'pinterest'
    assert detect_platform_from_hostname('pin.it') == 'pinterest'
    assert detect_platform_from_hostname('vimeo.com') == 'vimeo'
    assert detect_platform_from_hostname('singleword') == 'video'


def test_safe_attachment_filename():
    assert safe_attachment_filename('facebook', '123', 'My Cool Video! @2026', 'mp4') == 'My_Cool_Video_2026.mp4'
    assert safe_attachment_filename('youtube', 'abc_123', None, 'mp4') == 'youtube-abc_123.mp4'
    assert safe_attachment_filename('tiktok', '789', '   ', 'webm') == 'tiktok-789.webm'


def test_extract_qualities_discovers_unique_heights_and_falls_back_to_source():
    info = {
        'id': 'vid1',
        'ext': 'mp4',
        'formats': [
            {'vcodec': 'none', 'acodec': 'mp4a'},
            {'width': 1920, 'height': 1080, 'vcodec': 'avc1', 'filesize': 12_000_000},
            {'width': 1920, 'height': 1080, 'vcodec': 'vp9', 'filesize': 9_000_000},
            {'width': 1280, 'height': 720, 'vcodec': 'avc1', 'filesize': 6_000_000},
            {'width': 640, 'height': 360, 'vcodec': 'avc1', 'filesize': 2_500_000},
        ],
    }
    qualities, reported = extract_qualities_from_info(info)
    assert [q.id for q in qualities] == ['1080p', '720p', '360p']
    assert [q.label for q in qualities] == ['1080p HD', '720p HD', '360p']
    assert qualities[0].file_size_bytes == 12_000_000
    assert reported == [
        {'width': 1920, 'height': 1080},
        {'width': 1280, 'height': 720},
        {'width': 640, 'height': 360},
    ]

    fallback_q, _ = extract_qualities_from_info({'id': 'fb1', 'ext': 'mp4', 'formats': []})
    assert len(fallback_q) == 1
    assert fallback_q[0].id == 'source'


def test_build_format_selector_and_error_mapping():
    assert 'height<=720' in build_format_selector('720p')
    assert 'bestvideo[ext=mp4]' in build_format_selector('source')

    assert map_ytdlp_error('Sign in to confirm you are not a bot; use --cookies').status_code == 403
    assert map_ytdlp_error('This video is unavailable').status_code == 404
    assert map_ytdlp_error('HTTP Error 429: Too Many Requests').status_code == 503
    assert map_ytdlp_error('Some generic extraction error').status_code == 422


def test_ytdlp_lookup_parses_metadata():
    app_cfg = config(enable_yt_dlp=True)
    provider = YtDlpVideoProvider(app_cfg)

    fake_info = {
        'id': 'test12345',
        'title': 'Test Video Title',
        'description': 'A description of the test video',
        'thumbnail': 'https://example.com/thumb.jpg',
        'duration': 120.5,
        'ext': 'mp4',
        'filesize': 5_000_000,
        'formats': [
            {'width': 1920, 'height': 1080, 'vcodec': 'avc1', 'filesize': 5_000_000},
            {'width': 1280, 'height': 720, 'vcodec': 'avc1', 'filesize': 2_500_000},
            {'width': 1920, 'height': 1080, 'vcodec': 'vp9', 'filesize': 4_000_000},
        ],
    }

    with patch.object(provider, '_run_subprocess', new=AsyncMock(return_value=(json.dumps(fake_info).encode(), b''))):
        lookup = run(provider.lookup(urlsplit('https://www.youtube.com/watch?v=test12345')))

    assert lookup.platform == 'youtube'
    assert lookup.video_id == 'test12345'
    assert lookup.title == 'Test Video Title'
    assert lookup.thumbnail_url == 'https://example.com/thumb.jpg'
    assert lookup.duration_seconds == 120.5
    assert [q.id for q in lookup.qualities] == ['1080p', '720p']
    assert lookup.reported_formats == [{'width': 1920, 'height': 1080}, {'width': 1280, 'height': 720}]


def test_ytdlp_lookup_rejects_unsafe_thumbnail_and_kills_on_timeout():
    app_cfg = config(enable_yt_dlp=True, request_timeout_ms=50)
    provider = YtDlpVideoProvider(app_cfg)

    fake_info = {'id': 't1', 'thumbnail': 'http://127.0.0.1/evil.jpg', 'formats': []}
    with patch.object(provider, '_run_subprocess', new=AsyncMock(return_value=(json.dumps(fake_info).encode(), b''))):
        lookup = run(provider.lookup(urlsplit('https://www.youtube.com/watch?v=t1')))
    assert lookup.thumbnail_url is None

    proc = MagicMock()
    proc.kill = MagicMock()
    proc.wait = AsyncMock(return_value=-9)

    async def slow_comm():
        await asyncio.sleep(1.0)
        return b'', b''

    proc.communicate = slow_comm

    with patch('asyncio.create_subprocess_exec', new=AsyncMock(return_value=proc)):
        with pytest.raises(ApiError) as exc_info:
            run(provider.lookup(urlsplit('https://www.youtube.com/watch?v=slow')))
        assert exc_info.value.code == 'PROVIDER_TIMEOUT'
        assert exc_info.value.status_code == 504
        proc.kill.assert_called_once()


def test_ytdlp_download_and_stream_cleanup():
    app_cfg = config(enable_yt_dlp=True, max_download_bytes=10_000_000)
    provider = YtDlpVideoProvider(app_cfg)

    temp_dir = tempfile.gettempdir()
    sample_file = os.path.join(temp_dir, 'rf_testjob_sample.mp4')
    with open(sample_file, 'wb') as f:
        f.write(b'sample-video-bytes-for-download')

    try:
        with patch.object(provider, '_run_subprocess', new=AsyncMock(return_value=(b'', b''))):
            opened = run(
                provider.download_video(
                    url='https://www.youtube.com/watch?v=sample',
                    job_id='testjob',
                    quality_id='720p',
                    timeout_ms=5000,
                    max_bytes=10_000_000,
                    platform='youtube',
                    video_id='sample',
                    title='Sample Video',
                )
            )

        assert opened.content_type == 'video/mp4'
        assert opened.content_length == len(b'sample-video-bytes-for-download')
        assert opened.filename == 'Sample_Video.mp4'

        async def read_stream():
            return b''.join([chunk async for chunk in opened.stream])

        assert run(read_stream()) == b'sample-video-bytes-for-download'
        assert not os.path.exists(sample_file)
    finally:
        if os.path.exists(sample_file):
            os.remove(sample_file)


def test_videos_service_full_ytdlp_flow():
    from app.providers.facebook.provider import FacebookVideoProvider

    app_cfg = config(enable_yt_dlp=True)
    fb = FacebookVideoProvider(app_cfg)
    service = VideosService(app_cfg, fb)

    fake_info = {'id': 'ytvideo123', 'title': 'Test YT Stream', 'ext': 'mp4', 'duration': 60, 'formats': []}
    temp_dir = tempfile.gettempdir()
    sample_file = os.path.join(temp_dir, 'rf_placeholder.mp4')

    try:
        with patch.object(service._ytdlp_provider, '_run_subprocess', new=AsyncMock(return_value=(json.dumps(fake_info).encode(), b''))):
            lookup_res = run(service.lookup('https://www.youtube.com/watch?v=ytvideo123'))

        assert lookup_res['platform'] == 'youtube'
        lookup_id = lookup_res['lookupId']
        download_res = run(service.create_download(lookup_id, 'source'))
        job_id = download_res['jobId']

        sample_file = os.path.join(temp_dir, f'rf_{job_id}_ytvideo123.mp4')
        with open(sample_file, 'wb') as f:
            f.write(b'downloaded-bytes-123')

        with patch.object(service._ytdlp_provider, '_run_subprocess', new=AsyncMock(return_value=(b'', b''))):
            opened = run(service.open_download(job_id))

        assert opened.filename == 'Test_YT_Stream.mp4'

        async def consume():
            return b''.join([chunk async for chunk in opened.stream])

        assert run(consume()) == b'downloaded-bytes-123'
        assert not os.path.exists(sample_file)
        assert service.get_download(job_id)['status'] == 'completed'
    finally:
        if os.path.exists(sample_file):
            os.remove(sample_file)
