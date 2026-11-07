from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Callable
from urllib.parse import SplitResult

import httpx

from app.config import AppConfig, facebook_access_token
from app.errors import ApiError
from app.http_client import ClientFactory, create_http_client
from app.providers.base import ProviderLookup, VideoQuality
from app.providers.facebook.graph_client import FacebookGraphClient
from app.providers.facebook.redirect import resolve_facebook_video_id
from app.providers.facebook.url import unresolved_link_message
from app.security.url_safety import is_allowed_media_url

NOT_CONFIGURED = 'No media provider is configured. Set FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_USER_ACCESS_TOKEN only for a video that token is allowed to read. No download link was created.'


@dataclass(frozen=True)
class AuthorizedSource:
    source_url: str
    filename: str


def _is_finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


class FacebookVideoProvider:
    platform = 'facebook'
    hosts = ['facebook.com', 'fb.watch']
    unavailable_message = NOT_CONFIGURED

    def __init__(self, config: AppConfig, client_factory: ClientFactory = create_http_client):
        self._config = config
        self._client_factory: Callable[[], httpx.AsyncClient] = client_factory

    def is_configured(self) -> bool:
        return len(facebook_access_token(self._config)) > 0

    async def lookup(self, page_url: SplitResult) -> ProviderLookup:
        async with self._client_factory() as client:
            resolved = await resolve_facebook_video_id(page_url, client, self._config.request_timeout_ms)
            if resolved.status == 'login_required':
                raise ApiError(403, 'LOGIN_REQUIRED', 'Facebook asked for a login. ReelFetch does not use cookies or a Facebook session, so this video was not opened.')
            if resolved.status == 'rate_limited':
                raise ApiError(429, 'PROVIDER_RATE_LIMITED', 'Facebook rate-limited the link check. Wait and try again.')
            if resolved.status == 'unavailable':
                raise ApiError(502, 'PROVIDER_ERROR', 'The Facebook link could not be resolved through a public redirect.')
            if resolved.status == 'unresolved':
                raise ApiError(422, 'LINK_ID_UNAVAILABLE', unresolved_link_message(resolved.link_type or 'other'))
            video_id = resolved.video_id or ''
            if not self.is_configured():
                raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', f'The link resolved to Facebook video {video_id}. {NOT_CONFIGURED}')
            video = await self._read_video(client, video_id)

        lookup = self._to_lookup(video_id, video)
        if not any(item.available for item in lookup.qualities):
            raise ApiError(404, 'VIDEO_NOT_AVAILABLE', f'Facebook video {video_id} was identified, but no downloadable file URL was returned.')
        return lookup

    async def get_authorized_source(self, video_id: str) -> AuthorizedSource:
        self._assert_configured()
        async with self._client_factory() as client:
            video = await self._read_video(client, video_id)
        source = video.get('source')
        source_url = source if isinstance(source, str) else ''
        if not source_url or not is_allowed_media_url(source_url):
            raise ApiError(404, 'VIDEO_NOT_AVAILABLE', 'Facebook did not return an allowed downloadable file for this video. The token may not be permitted to read it, or the video may be private or restricted.')
        return AuthorizedSource(source_url=source_url, filename=f'facebook-{video_id}.mp4')

    def _assert_configured(self) -> None:
        if not self.is_configured():
            raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', NOT_CONFIGURED)

    async def _read_video(self, client: httpx.AsyncClient, video_id: str) -> dict[str, Any]:
        graph = FacebookGraphClient(
            self._config.graph_api_version,
            facebook_access_token(self._config),
            self._config.request_timeout_ms,
            client,
        )
        return await graph.get_video(video_id)

    def _to_lookup(self, video_id: str, video: dict[str, Any]) -> ProviderLookup:
        source = video.get('source')
        source_url = source if isinstance(source, str) else ''
        source_allowed = bool(source_url) and is_allowed_media_url(source_url)
        picture = video.get('picture')
        thumbnail = picture if isinstance(picture, str) and is_allowed_media_url(picture) else None
        name = video.get('name')
        description = video.get('description')
        formats = video.get('format')
        reported: list[dict[str, Any]] = []
        for item in formats if isinstance(formats, list) else []:
            if not isinstance(item, dict):
                continue
            width, height = item.get('width'), item.get('height')
            if _is_finite_number(width) or _is_finite_number(height):
                reported.append({key: value for key, value in (('width', width), ('height', height)) if value is not None})
        return ProviderLookup(
            platform='facebook',
            video_id=video_id,
            title=(name[:180] or None) if isinstance(name, str) else None,
            description=(description[:500] or None) if isinstance(description, str) else None,
            thumbnail_url=thumbnail,
            source_label='Facebook Graph API',
            qualities=[VideoQuality(id='source', label='Original file', available=True, format='mp4')] if source_allowed else [],
            reported_formats=reported,
        )
