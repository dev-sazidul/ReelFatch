from __future__ import annotations

import asyncio
import logging
import os
import re
import shutil
import tempfile
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any
from urllib.parse import SplitResult, urlunsplit

import yt_dlp
from yt_dlp.utils import DownloadError

from app.config import AppConfig
from app.errors import ApiError
from app.providers.base import ProviderLookup, VideoQuality

logger = logging.getLogger('YtDlpProvider')

SUPPORTED_HOSTS = [
    'facebook.com',
    'fb.watch',
    'youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    'tiktok.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'pinterest.com',
]


@dataclass
class YtDlpOpenedDownload:
    stream: AsyncIterator[bytes]
    content_type: str
    content_length: int | None
    filename: str


def _get_ffmpeg_path() -> str | None:
    try:
        import imageio_ffmpeg

        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass
    return shutil.which('ffmpeg')


def _get_js_runtimes() -> dict[str, Any] | None:
    node = shutil.which('node')
    if node:
        return {'node': {'path': node}}
    return None


def detect_platform_from_hostname(hostname: str) -> str:
    host = hostname.lower().strip('.')
    if host == 'fb.watch' or host == 'facebook.com' or host.endswith('.facebook.com'):
        return 'facebook'
    if host in ('youtu.be', 'youtube.com', 'youtube-nocookie.com') or host.endswith('.youtube.com'):
        return 'youtube'
    if host == 'tiktok.com' or host.endswith('.tiktok.com'):
        return 'tiktok'
    if host == 'instagram.com' or host.endswith('.instagram.com'):
        return 'instagram'
    if host in ('twitter.com', 'x.com') or host.endswith('.twitter.com') or host.endswith('.x.com'):
        return 'x'
    if host == 'reddit.com' or host.endswith('.reddit.com'):
        return 'reddit'
    if host == 'pinterest.com' or host.endswith('.pinterest.com') or host == 'pin.it' or host.endswith('.pin.it'):
        return 'pinterest'
    parts = host.split('.')
    if len(parts) >= 2:
        return parts[-2]
    return 'video'


def safe_attachment_filename(platform: str, video_id: str, title: str | None = None, ext: str = 'mp4') -> str:
    clean_ext = ext.lstrip('.') or 'mp4'
    if title:
        cleaned = re.sub(r'[^A-Za-z0-9._-]', '_', title)
        cleaned = re.sub(r'_+', '_', cleaned).strip('._-')
        if cleaned:
            return f'{cleaned[:50]}.{clean_ext}'
    safe_id = re.sub(r'[^A-Za-z0-9._-]', '_', video_id).strip('._-') or 'video'
    return f'{platform}-{safe_id}.{clean_ext}'


class YtDlpVideoProvider:
    platform = 'ytdlp'
    universal = True
    hosts = SUPPORTED_HOSTS
    unavailable_message = 'yt-dlp video downloader is not available.'

    def __init__(self, config: AppConfig):
        self._config = config

    def is_configured(self) -> bool:
        return True

    def _build_ydl_opts(self, extra: dict[str, Any] | None = None) -> dict[str, Any]:
        opts: dict[str, Any] = {
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
        }
        ffmpeg_exe = _get_ffmpeg_path()
        if ffmpeg_exe:
            opts['ffmpeg_location'] = ffmpeg_exe
        js_runtimes = _get_js_runtimes()
        if js_runtimes:
            opts['js_runtimes'] = js_runtimes
        if extra:
            opts.update(extra)
        return opts

    async def lookup(self, page_url: SplitResult) -> ProviderLookup:
        url_str = urlunsplit(page_url)
        platform = detect_platform_from_hostname(page_url.hostname or '')
        opts = self._build_ydl_opts({'extract_flat': False})

        def _extract() -> dict[str, Any]:
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(url_str, download=False)  # type: ignore[no-any-return]

        try:
            async with asyncio.timeout(self._config.request_timeout_ms / 1000):
                info = await asyncio.to_thread(_extract)
        except TimeoutError:
            raise ApiError(504, 'PROVIDER_TIMEOUT', 'The video provider timed out.') from None
        except DownloadError as exc:
            msg = str(exc).lower()
            if 'login' in msg or 'private' in msg or 'restricted' in msg or 'permission' in msg:
                raise ApiError(403, 'LOGIN_REQUIRED' if 'login' in msg else 'VIDEO_NOT_PERMITTED', 'This video is private or restricted.') from None
            if 'unavailable' in msg or 'not found' in msg or 'does not exist' in msg:
                raise ApiError(404, 'VIDEO_NOT_FOUND', 'This video was not found or is unavailable.') from None
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video details could not be retrieved.') from None
        except Exception as exc:
            if isinstance(exc, ApiError):
                raise
            logger.warning('yt-dlp lookup failed type=%s', type(exc).__name__)
            raise ApiError(502, 'PROVIDER_ERROR', 'The video provider returned an unexpected error.') from None

        video_id = str(info.get('id') or 'video')
        title = (info.get('title') or '')[:180] or None
        description = (info.get('description') or '')[:500] or None
        thumbnail_url = info.get('thumbnail')
        duration_seconds = info.get('duration')
        if isinstance(duration_seconds, (int, float)) and duration_seconds > 0:
            duration_val: float | None = float(duration_seconds)
        else:
            duration_val = None

        ext = info.get('ext') or 'mp4'
        filesize = info.get('filesize') or info.get('filesize_approx')
        if isinstance(filesize, (int, float)) and filesize > 0:
            filesize_val: int | None = int(filesize)
        else:
            filesize_val = None

        reported_formats: list[dict[str, Any]] = []
        for fmt in info.get('formats') or []:
            if not isinstance(fmt, dict):
                continue
            w, h = fmt.get('width'), fmt.get('height')
            if isinstance(w, int) and isinstance(h, int) and w > 0 and h > 0:
                dim = {'width': w, 'height': h}
                if dim not in reported_formats:
                    reported_formats.append(dim)

        qualities = [
            VideoQuality(
                id='source',
                label='Original file',
                available=True,
                file_size_bytes=filesize_val,
                format=ext,
            )
        ]

        return ProviderLookup(
            platform=platform,
            video_id=video_id,
            source_label=f'yt-dlp ({platform.capitalize()})',
            qualities=qualities,
            reported_formats=reported_formats,
            title=title,
            description=description,
            thumbnail_url=thumbnail_url,
            webpage_url=url_str,
            duration_seconds=duration_val,
        )

    async def download_video(
        self,
        url: str,
        job_id: str,
        quality_id: str,
        timeout_ms: int,
        max_bytes: int,
        platform: str = 'video',
        video_id: str = 'video',
        title: str | None = None,
    ) -> YtDlpOpenedDownload:
        temp_dir = tempfile.gettempdir()
        out_template = os.path.join(temp_dir, f'rf_{job_id}_%(id)s.%(ext)s')

        # Best video+audio in mp4 container, fallback to best progressive mp4 or best
        format_spec = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        opts = self._build_ydl_opts({
            'format': format_spec,
            'outtmpl': out_template,
            'max_filesize': max_bytes,
        })

        def _download() -> tuple[dict[str, Any], str]:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                prepared = ydl.prepare_filename(info)
                return info, prepared

        try:
            async with asyncio.timeout(timeout_ms / 1000):
                info, prepared = await asyncio.to_thread(_download)
        except TimeoutError:
            self._cleanup_pattern(temp_dir, job_id)
            raise ApiError(504, 'PROVIDER_TIMEOUT', 'The video file host did not respond before the timeout.') from None
        except DownloadError as exc:
            self._cleanup_pattern(temp_dir, job_id)
            msg = str(exc).lower()
            if 'larger than' in msg or 'max_filesize' in msg:
                raise ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.') from None
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.') from None
        except Exception as exc:
            self._cleanup_pattern(temp_dir, job_id)
            if isinstance(exc, ApiError):
                raise
            logger.warning('yt-dlp download failed type=%s', type(exc).__name__)
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.') from None

        # Find actual downloaded file on disk
        actual_path = self._find_downloaded_file(prepared, temp_dir, job_id)
        if not actual_path or not os.path.isfile(actual_path):
            self._cleanup_pattern(temp_dir, job_id)
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be found after download.')

        file_size = os.path.getsize(actual_path)
        if file_size > max_bytes:
            self._cleanup_file(actual_path)
            raise ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.')

        _root, ext = os.path.splitext(actual_path)
        clean_ext = ext.lstrip('.').lower() or 'mp4'
        content_type = 'video/mp4' if clean_ext == 'mp4' else f'video/{clean_ext}'
        filename = safe_attachment_filename(platform, video_id, title, clean_ext)

        return YtDlpOpenedDownload(
            stream=self._stream_and_cleanup(actual_path),
            content_type=content_type,
            content_length=file_size,
            filename=filename,
        )

    def _find_downloaded_file(self, prepared: str, temp_dir: str, job_id: str) -> str | None:
        if os.path.isfile(prepared):
            return prepared
        base, _ = os.path.splitext(prepared)
        for ext in ('.mp4', '.mkv', '.webm', '.m4a'):
            candidate = base + ext
            if os.path.isfile(candidate):
                return candidate
        # Fallback: check temp directory for rf_{job_id}_*
        prefix = f'rf_{job_id}_'
        try:
            for item in os.listdir(temp_dir):
                if item.startswith(prefix) and not item.endswith('.part'):
                    candidate = os.path.join(temp_dir, item)
                    if os.path.isfile(candidate):
                        return candidate
        except OSError:
            pass
        return None

    def _cleanup_pattern(self, temp_dir: str, job_id: str) -> None:
        prefix = f'rf_{job_id}_'
        try:
            for item in os.listdir(temp_dir):
                if item.startswith(prefix):
                    self._cleanup_file(os.path.join(temp_dir, item))
        except OSError:
            pass

    @staticmethod
    def _cleanup_file(path: str) -> None:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            pass

    async def _stream_and_cleanup(self, filepath: str, chunk_size: int = 64 * 1024) -> AsyncIterator[bytes]:
        try:
            with open(filepath, 'rb') as f:
                while True:
                    chunk = await asyncio.to_thread(f.read, chunk_size)
                    if not chunk:
                        break
                    yield chunk
        finally:
            self._cleanup_file(filepath)
