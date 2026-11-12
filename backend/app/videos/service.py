from __future__ import annotations

import logging
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlunsplit

from app.config import AppConfig
from app.errors import ApiError
from app.http_client import ClientFactory, create_http_client
from app.providers.base import VideoProvider
from app.providers.facebook.provider import FacebookVideoProvider
from app.providers.registry import future_platform_providers, select_provider
from app.providers.ytdlp_provider import YtDlpVideoProvider
from app.security.media_stream import open_allowed_media
from app.security.url_safety import redact_url
from app.videos.store import DownloadJobStore, LookupStore, StoredLookup, to_public_lookup

logger = logging.getLogger('VideosService')
_RECORD_ID = re.compile(r'[a-f0-9]{32}')


@dataclass
class OpenedDownload:
    stream: AsyncIterator[bytes]
    content_type: str
    content_length: int | None
    filename: str


class VideosService:
    def __init__(
        self,
        config: AppConfig,
        facebook: FacebookVideoProvider,
        media_client_factory: ClientFactory = create_http_client,
        lookups: LookupStore | None = None,
        jobs: DownloadJobStore | None = None,
        ytdlp: YtDlpVideoProvider | None = None,
    ):
        self._config = config
        self._media_client_factory = media_client_factory
        self._lookups = lookups or LookupStore()
        self._jobs = jobs or DownloadJobStore()
        self._facebook_provider = facebook
        self._ytdlp_provider = ytdlp or (YtDlpVideoProvider(config) if config.enable_yt_dlp else None)

        providers: list[VideoProvider] = []
        if facebook.is_configured():
            providers.append(facebook)
        elif not config.enable_yt_dlp:
            providers.append(facebook)

        if self._ytdlp_provider is not None:
            providers.append(self._ytdlp_provider)

        providers.extend(future_platform_providers())
        self._providers = providers

    async def lookup(self, raw_url: str) -> dict[str, Any]:
        url, provider = select_provider(raw_url, self._providers)
        logger.info('lookup start platform=%s url=%s', provider.platform, redact_url(urlunsplit(url)))
        result = await provider.lookup(url)
        stored = self._lookups.save(result, self._config.lookup_ttl_ms)
        logger.info('lookup stored platform=%s qualities=%s', provider.platform, len(result.qualities))
        return to_public_lookup(stored)

    def get_lookup(self, lookup_id: str) -> dict[str, Any]:
        return to_public_lookup(self._require_lookup(lookup_id))

    async def create_download(self, lookup_id: str, quality_id: str) -> dict[str, Any]:
        record = self._require_lookup(lookup_id)
        quality = next((item for item in record.lookup.qualities if item.id == quality_id and item.available), None)
        if quality is None:
            raise ApiError(400, 'QUALITY_UNAVAILABLE', 'That quality is not available for this video.')
        if record.lookup.source_label == 'Facebook Graph API':
            if record.platform != 'facebook':
                raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.')
            await self._facebook().get_authorized_source(record.video_id)
        elif self._ytdlp_provider is None and record.platform != 'facebook':
            raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.')
        job = self._jobs.create(lookup_id, quality_id, self._config.lookup_ttl_ms)
        logger.info('download job ready id=%s', job.job_id)
        return {'jobId': job.job_id, 'status': job.status}

    def get_download(self, job_id: str) -> dict[str, Any]:
        job = self._jobs.get(job_id)
        if job is None:
            raise ApiError(404, 'JOB_NOT_FOUND', 'That download job does not exist or has expired.')
        data: dict[str, Any] = {'jobId': job.job_id, 'status': job.status}
        if job.error_code is not None:
            data['errorCode'] = job.error_code
        if job.error_message is not None:
            data['errorMessage'] = job.error_message
        return data

    async def open_download(self, job_id: str) -> OpenedDownload:
        job = self._jobs.get(job_id)
        if job is None:
            raise ApiError(404, 'JOB_NOT_FOUND', 'That download job does not exist or has expired.')
        record = self._require_lookup(job.lookup_id)
        if record.lookup.source_label == 'Facebook Graph API':
            if record.platform != 'facebook':
                raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.')
            try:
                source = await self._facebook().get_authorized_source(record.video_id)
                media = await open_allowed_media(
                    source.source_url,
                    timeout_ms=self._config.download_timeout_ms,
                    max_bytes=self._config.max_download_bytes,
                    client_factory=self._media_client_factory,
                )
            except Exception as error:
                api_error = error if isinstance(error, ApiError) else ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.')
                self._jobs.update(job.job_id, status='failed', error_code=api_error.code, error_message=api_error.message)
                raise api_error from None

            self._jobs.update(job.job_id, status='streaming')
            return OpenedDownload(
                stream=self._track(job.job_id, media.stream),
                content_type=media.content_type,
                content_length=media.content_length,
                filename=source.filename,
            )

        if self._ytdlp_provider is None:
            raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.')

        try:
            opened = await self._ytdlp_provider.download_video(
                url=record.lookup.webpage_url or f'https://www.{record.platform}.com/watch?v={record.video_id}',
                job_id=job.job_id,
                quality_id=job.quality_id,
                timeout_ms=self._config.download_timeout_ms,
                max_bytes=self._config.max_download_bytes,
                platform=record.platform,
                video_id=record.video_id,
                title=record.lookup.title,
            )
        except Exception as error:
            api_error = error if isinstance(error, ApiError) else ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.')
            self._jobs.update(job.job_id, status='failed', error_code=api_error.code, error_message=api_error.message)
            raise api_error from None

        self._jobs.update(job.job_id, status='streaming')
        return OpenedDownload(
            stream=self._track(job.job_id, opened.stream),
            content_type=opened.content_type,
            content_length=opened.content_length,
            filename=opened.filename,
        )

    async def _track(self, job_id: str, stream: AsyncIterator[bytes]) -> AsyncIterator[bytes]:
        try:
            async for chunk in stream:
                yield chunk
        except Exception as error:
            logger.warning('download failed id=%s type=%s', job_id, type(error).__name__)
            self._jobs.update(job_id, status='failed', error_code='VIDEO_NOT_AVAILABLE', error_message='The video file could not be transferred.')
            raise ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.') from None
        else:
            self._jobs.update(job_id, status='completed')
        finally:
            close = getattr(stream, 'aclose', None)
            if close is not None:
                await close()

    def _require_lookup(self, lookup_id: str) -> StoredLookup:
        if not _RECORD_ID.fullmatch(lookup_id):
            raise ApiError(400, 'INVALID_REQUEST', 'The lookup id is not valid.')
        record = self._lookups.get(lookup_id)
        if record is None:
            raise ApiError(404, 'LOOKUP_NOT_FOUND', 'That lookup does not exist or has expired. Check the link again.')
        return record

    def _facebook(self) -> FacebookVideoProvider:
        if isinstance(self._facebook_provider, FacebookVideoProvider):
            return self._facebook_provider
        facebook = next((provider for provider in self._providers if provider.platform == 'facebook'), None)
        if not isinstance(facebook, FacebookVideoProvider):
            raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'The Facebook provider is not registered.')
        return facebook
