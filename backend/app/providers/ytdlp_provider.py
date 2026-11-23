from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import shutil
import sys
import tempfile
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any
from urllib.parse import SplitResult, urlunsplit

from app.config import AppConfig
from app.errors import ApiError
from app.providers.base import ProviderLookup, VideoQuality
from app.security.url_safety import is_safe_thumbnail_url

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
    'redd.it',
    'pinterest.com',
    'pin.it',
]

STANDARD_HEIGHTS = (2160, 1440, 1080, 720, 480, 360, 240, 144)


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


def _get_js_runtimes() -> str | None:
    node = shutil.which('node')
    if node:
        return f'node:{node}'
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
    if host == 'reddit.com' or host.endswith('.reddit.com') or host == 'redd.it' or host.endswith('.redd.it'):
        return 'reddit'
    if host == 'pinterest.com' or host.endswith('.pinterest.com') or host == 'pin.it' or host.endswith('.pin.it'):
        return 'pinterest'
    parts = host.split('.')
    if len(parts) >= 2:
        return parts[-2]
    return 'video'


def safe_attachment_filename(platform: str, video_id: str, title: str | None = None, ext: str = 'mp4') -> str:
    clean_ext = re.sub(r'[^A-Za-z0-9]', '', ext) or 'mp4'
    if title:
        cleaned = re.sub(r'[^A-Za-z0-9._-]', '_', title)
        cleaned = re.sub(r'_+', '_', cleaned).strip('._-')
        if cleaned:
            return f'{cleaned[:50]}.{clean_ext}'
    safe_id = re.sub(r'[^A-Za-z0-9._-]', '_', video_id).strip('._-') or 'video'
    return f'{platform}-{safe_id}.{clean_ext}'


def extract_qualities_from_info(info: dict[str, Any]) -> tuple[list[VideoQuality], list[dict[str, Any]]]:
    formats = info.get('formats') or []
    reported_formats: list[dict[str, Any]] = []
    height_sizes: dict[int, int | None] = {}

    for fmt in formats:
        if not isinstance(fmt, dict):
            continue
        vcodec = fmt.get('vcodec')
        if vcodec == 'none':
            continue
        w, h = fmt.get('width'), fmt.get('height')
        if isinstance(w, int) and isinstance(h, int) and w > 0 and h > 0:
            dim = {'width': w, 'height': h}
            if dim not in reported_formats:
                reported_formats.append(dim)
            size = fmt.get('filesize') or fmt.get('filesize_approx')
            size_int = int(size) if isinstance(size, (int, float)) and size > 0 else None
            # Prefer standard bucket or exact height
            bucket = next((std for std in STANDARD_HEIGHTS if abs(h - std) <= 20), h)
            prev = height_sizes.get(bucket)
            if bucket not in height_sizes or (size_int is not None and (prev is None or size_int > prev)):
                height_sizes[bucket] = size_int

    qualities: list[VideoQuality] = []
    for height in sorted(height_sizes.keys(), reverse=True):
        label = f'{height}p HD' if height >= 720 else f'{height}p'
        qualities.append(
            VideoQuality(
                id=f'{height}p',
                label=label,
                available=True,
                file_size_bytes=height_sizes[height],
                format='mp4',
            )
        )

    if not qualities:
        ext = info.get('ext') or 'mp4'
        filesize = info.get('filesize') or info.get('filesize_approx')
        filesize_val = int(filesize) if isinstance(filesize, (int, float)) and filesize > 0 else None
        qualities.append(
            VideoQuality(
                id='source',
                label='Original / Best available',
                available=True,
                file_size_bytes=filesize_val,
                format=ext,
            )
        )

    return qualities, reported_formats


def build_format_selector(quality_id: str) -> str:
    match = re.fullmatch(r'(\d{3,4})p', quality_id)
    if match:
        h = int(match.group(1))
        return (
            f'bestvideo[height<={h}][ext=mp4]+bestaudio[ext=m4a]/'
            f'bestvideo[height<={h}]+bestaudio/'
            f'best[height<={h}][ext=mp4]/best[height<={h}]/best'
        )
    return 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'


def map_ytdlp_error(stderr_text: str) -> ApiError:
    msg = stderr_text.lower()
    if 'larger than' in msg or 'max-filesize' in msg or 'max_filesize' in msg:
        return ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.')
    if 'login' in msg or 'cookies' in msg or 'authentication' in msg or 'private' in msg or 'age' in msg:
        return ApiError(403, 'LOGIN_REQUIRED', 'This video requires login or is private/restricted on the source platform.')
    if 'restricted' in msg or 'permission' in msg:
        return ApiError(403, 'VIDEO_NOT_PERMITTED', 'This video is restricted and cannot be accessed.')
    if 'unavailable' in msg or 'not found' in msg or 'does not exist' in msg or 'no video' in msg or 'no video formats' in msg:
        return ApiError(404, 'VIDEO_NOT_FOUND', 'This video was not found, has been removed, or contains no downloadable video.')
    if '429' in msg or 'too many requests' in msg or 'rate limit' in msg:
        return ApiError(503, 'PROVIDER_UNAVAILABLE', 'The source platform is temporarily limiting requests. Please try again later.')
    return ApiError(422, 'VIDEO_NOT_AVAILABLE', 'The video details could not be retrieved from this link.')


def cleanup_stale_temp_files(temp_dir: str | None = None) -> int:
    target = temp_dir or tempfile.gettempdir()
    removed = 0
    try:
        for item in os.listdir(target):
            if item.startswith('rf_'):
                path = os.path.join(target, item)
                if os.path.isfile(path):
                    try:
                        os.remove(path)
                        removed += 1
                    except OSError:
                        pass
    except OSError:
        pass
    return removed


class YtDlpVideoProvider:
    platform = 'ytdlp'
    universal = False
    hosts = SUPPORTED_HOSTS
    unavailable_message = 'yt-dlp video downloader is not available.'

    def __init__(self, config: AppConfig):
        self._config = config
        self._download_semaphore = asyncio.Semaphore(max(1, config.max_concurrent_downloads))

    def is_configured(self) -> bool:
        return True

    def _base_args(self) -> list[str]:
        args = [
            sys.executable,
            '-m',
            'yt_dlp',
            '--quiet',
            '--no-warnings',
            '--no-playlist',
        ]
        ffmpeg_exe = _get_ffmpeg_path()
        if ffmpeg_exe:
            args.extend(['--ffmpeg-location', ffmpeg_exe])
        js_runtime = _get_js_runtimes()
        if js_runtime:
            args.extend(['--js-runtimes', js_runtime])
        return args

    async def _run_subprocess(self, args: list[str], timeout_seconds: float) -> tuple[bytes, bytes]:
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            async with asyncio.timeout(timeout_seconds):
                stdout, stderr = await proc.communicate()
        except TimeoutError:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            await proc.wait()
            raise
        if proc.returncode != 0:
            raise map_ytdlp_error(stderr.decode('utf-8', errors='replace'))
        return stdout, stderr

    async def lookup(self, page_url: SplitResult) -> ProviderLookup:
        url_str = urlunsplit(page_url)
        platform = detect_platform_from_hostname(page_url.hostname or '')
        args = [*self._base_args(), '--dump-single-json', url_str]

        try:
            stdout, _ = await self._run_subprocess(args, self._config.request_timeout_ms / 1000)
            info = json.loads(stdout.decode('utf-8', errors='replace'))
        except TimeoutError:
            raise ApiError(504, 'PROVIDER_TIMEOUT', 'The video provider timed out.') from None
        except ApiError:
            raise
        except Exception as exc:
            logger.warning('yt-dlp lookup failed type=%s', type(exc).__name__)
            raise ApiError(503, 'PROVIDER_ERROR', 'The video provider returned an unexpected error.') from None

        if not isinstance(info, dict):
            raise ApiError(422, 'VIDEO_NOT_AVAILABLE', 'The video details could not be retrieved from this link.')

        video_id = str(info.get('id') or 'video')
        title = (info.get('title') or '')[:180] or None
        description = (info.get('description') or '')[:500] or None
        raw_thumb = info.get('thumbnail')
        thumbnail_url = raw_thumb if is_safe_thumbnail_url(raw_thumb) else None
        duration_seconds = info.get('duration')
        duration_val = float(duration_seconds) if isinstance(duration_seconds, (int, float)) and duration_seconds > 0 else None

        qualities, reported_formats = extract_qualities_from_info(info)

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
        format_spec = build_format_selector(quality_id)
        args = [
            *self._base_args(),
            '--format',
            format_spec,
            '--merge-output-format',
            'mp4',
            '--max-filesize',
            str(max_bytes),
            '--output',
            out_template,
            url,
        ]

        async with self._download_semaphore:
            try:
                await self._run_subprocess(args, timeout_ms / 1000)
            except TimeoutError:
                self._cleanup_pattern(temp_dir, job_id)
                raise ApiError(504, 'PROVIDER_TIMEOUT', 'The video file host did not respond before the timeout.') from None
            except ApiError:
                self._cleanup_pattern(temp_dir, job_id)
                raise
            except Exception as exc:
                self._cleanup_pattern(temp_dir, job_id)
                logger.warning('yt-dlp download failed type=%s', type(exc).__name__)
                raise ApiError(503, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.') from None

            actual_path = self._find_downloaded_file('', temp_dir, job_id)
            if not actual_path or not os.path.isfile(actual_path):
                self._cleanup_pattern(temp_dir, job_id)
                raise ApiError(422, 'VIDEO_NOT_AVAILABLE', 'The video file could not be found after download.')

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
        if prepared and os.path.isfile(prepared):
            return prepared
        prefix = f'rf_{job_id}_'
        try:
            for item in os.listdir(temp_dir):
                if item.startswith(prefix) and not item.endswith('.part') and not item.endswith('.ytdl'):
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
