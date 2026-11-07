from __future__ import annotations

from urllib.parse import SplitResult

from app.errors import ApiError
from app.providers.base import ProviderLookup, VideoProvider, host_matches
from app.security.url_safety import parse_public_http_url, url_host


def select_provider(raw_url: str, providers: list[VideoProvider]) -> tuple[SplitResult, VideoProvider]:
    url = parse_public_http_url(raw_url)
    hostname = url_host(url)
    for candidate in providers:
        if any(host_matches(hostname, domain) for domain in candidate.hosts):
            return url, candidate
    raise ApiError(400, 'UNSUPPORTED_LINK', 'That link is not on a supported video platform.')


YOUTUBE = 'YouTube is not connected. The official YouTube Data API can return metadata for videos the caller may view, but it does not provide video file downloads. No download was attempted.'
TIKTOK = 'TikTok is not connected. No official TikTok API for downloading arbitrary public videos is configured. No download was attempted.'
INSTAGRAM = 'Instagram is not connected. No official Instagram API for downloading arbitrary Reels is configured. No download was attempted.'


class UnavailableProvider:
    """A registered platform with no authorized download API. Lookup always fails."""

    def __init__(self, platform: str, hosts: list[str], message: str):
        self.platform = platform
        self.hosts = hosts
        self.unavailable_message = message

    def is_configured(self) -> bool:
        return False

    async def lookup(self, page_url: SplitResult) -> ProviderLookup:
        raise ApiError(503, 'PROVIDER_NOT_CONFIGURED', self.unavailable_message)


def future_platform_providers() -> list[VideoProvider]:
    return [
        UnavailableProvider('youtube', ['youtube.com', 'youtu.be', 'youtube-nocookie.com'], YOUTUBE),
        UnavailableProvider('tiktok', ['tiktok.com'], TIKTOK),
        UnavailableProvider('instagram', ['instagram.com'], INSTAGRAM),
    ]
