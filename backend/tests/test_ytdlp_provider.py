from __future__ import annotations

import asyncio
import os
import tempfile
from unittest.mock import MagicMock, patch
from urllib.parse import urlsplit

import pytest

from app.config import AppConfig
from app.errors import ApiError
from app.providers.ytdlp_provider import (
    YtDlpVideoProvider,
    detect_platform_from_hostname,
    safe_attachment_filename,
)
from app.videos.service import VideosService
from tests.helpers import config, factory, run


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
    assert detect_platform_from_hostname('pinterest.com') == 'pinterest'
    assert detect_platform_from_hostname('pin.it') == 'pinterest'
    assert detect_platform_from_hostname('vimeo.com') == 'vimeo'
    assert detect_platform_from_hostname('singleword') == 'video'


def test_safe_attachment_filename():
    assert safe_attachment_filename('facebook', '123', 'My Cool Video! @2026', 'mp4') == 'My_Cool_Video_2026.mp4'
    assert safe_attachment_filename('youtube', 'abc_123', None, 'mp4') == 'youtube-abc_123.mp4'
    assert safe_attachment_filename('tiktok', '789', '   ', 'webm') == 'tiktok-789.webm'


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
            {'width': 1920, 'height': 1080},
            {'width': 1280, 'height': 720},
            {'width': 1920, 'height': 1080},  # duplicate check
        ],
    }

    with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', return_value=fake_info):
        lookup = run(provider.lookup(urlsplit('https://www.youtube.com/watch?v=test12345')))

    assert lookup.platform == 'youtube'
    assert lookup.video_id == 'test12345'
    assert lookup.title == 'Test Video Title'
    assert lookup.description == 'A description of the test video'
    assert lookup.thumbnail_url == 'https://example.com/thumb.jpg'
    assert lookup.duration_seconds == 120.5
    assert len(lookup.qualities) == 1
    assert lookup.qualities[0].id == 'source'
    assert lookup.qualities[0].file_size_bytes == 5_000_000
    assert lookup.qualities[0].format == 'mp4'
    assert lookup.reported_formats == [{'width': 1920, 'height': 1080}, {'width': 1280, 'height': 720}]


def test_ytdlp_lookup_handles_errors():
    from yt_dlp.utils import DownloadError

    app_cfg = config(enable_yt_dlp=True)
    provider = YtDlpVideoProvider(app_cfg)

    with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', side_effect=DownloadError('This video is private')):
        with pytest.raises(ApiError) as exc_info:
            run(provider.lookup(urlsplit('https://www.facebook.com/watch/?v=999')))
        assert exc_info.value.code == 'VIDEO_NOT_PERMITTED'

    with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', side_effect=DownloadError('Video unavailable: not found')):
        with pytest.raises(ApiError) as exc_info:
            run(provider.lookup(urlsplit('https://www.youtube.com/watch?v=999')))
        assert exc_info.value.code == 'VIDEO_NOT_FOUND'

    with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', side_effect=TimeoutError()):
        with pytest.raises(ApiError) as exc_info:
            run(provider.lookup(urlsplit('https://www.tiktok.com/@u/video/999')))
        assert exc_info.value.code == 'PROVIDER_TIMEOUT'


def test_ytdlp_download_and_stream_cleanup():
    app_cfg = config(enable_yt_dlp=True, max_download_bytes=10_000_000)
    provider = YtDlpVideoProvider(app_cfg)

    temp_dir = tempfile.gettempdir()
    sample_file = os.path.join(temp_dir, 'rf_testjob_sample.mp4')
    with open(sample_file, 'wb') as f:
        f.write(b'sample-video-bytes-for-download')

    try:
        with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', return_value={'id': 'sample'}), \
             patch('yt_dlp.YoutubeDL.YoutubeDL.prepare_filename', return_value=sample_file):
            opened = run(
                provider.download_video(
                    url='https://www.youtube.com/watch?v=sample',
                    job_id='testjob',
                    quality_id='source',
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
            chunks = []
            async for chunk in opened.stream:
                chunks.append(chunk)
            return b''.join(chunks)

        content = run(read_stream())
        assert content == b'sample-video-bytes-for-download'
        # File should have been cleaned up after stream completion
        assert not os.path.exists(sample_file)
    finally:
        if os.path.exists(sample_file):
            os.remove(sample_file)


def test_videos_service_full_ytdlp_flow():
    from app.providers.facebook.provider import FacebookVideoProvider

    app_cfg = config(enable_yt_dlp=True)
    fb = FacebookVideoProvider(app_cfg)
    service = VideosService(app_cfg, fb)

    fake_info = {
        'id': 'ytvideo123',
        'title': 'Test YT Stream',
        'ext': 'mp4',
        'duration': 60,
    }

    temp_dir = tempfile.gettempdir()
    sample_file = os.path.join(temp_dir, 'rf_servjob_ytvideo123.mp4')
    with open(sample_file, 'wb') as f:
        f.write(b'downloaded-bytes-123')

    try:
        with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', return_value=fake_info):
            lookup_res = run(service.lookup('https://www.youtube.com/watch?v=ytvideo123'))

        assert lookup_res['platform'] == 'youtube'
        lookup_id = lookup_res['lookupId']

        # create download
        download_res = run(service.create_download(lookup_id, 'source'))
        job_id = download_res['jobId']
        assert download_res['status'] == 'ready'

        # open download
        with patch('yt_dlp.YoutubeDL.YoutubeDL.extract_info', return_value=fake_info), \
             patch('yt_dlp.YoutubeDL.YoutubeDL.prepare_filename', return_value=sample_file):
            opened = run(service.open_download(job_id))

        assert opened.filename == 'Test_YT_Stream.mp4'
        assert opened.content_length == len(b'downloaded-bytes-123')

        async def consume():
            chunks = []
            async for chunk in opened.stream:
                chunks.append(chunk)
            return b''.join(chunks)

        data = run(consume())
        assert data == b'downloaded-bytes-123'
        assert not os.path.exists(sample_file)

        # Job status is now completed
        status = service.get_download(job_id)
        assert status['status'] == 'completed'
    finally:
        if os.path.exists(sample_file):
            os.remove(sample_file)
