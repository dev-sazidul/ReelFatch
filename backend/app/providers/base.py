from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol
from urllib.parse import SplitResult


@dataclass
class VideoQuality:
    id: str
    label: str
    available: bool
    file_size_bytes: int | None = None
    format: str | None = None

    def to_json(self) -> dict[str, Any]:
        data: dict[str, Any] = {'id': self.id, 'label': self.label, 'available': self.available}
        if self.file_size_bytes is not None:
            data['fileSizeBytes'] = self.file_size_bytes
        if self.format is not None:
            data['format'] = self.format
        return data


@dataclass
class ProviderLookup:
    platform: str
    video_id: str
    source_label: str
    qualities: list[VideoQuality] = field(default_factory=list)
    reported_formats: list[dict[str, Any]] = field(default_factory=list)
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    webpage_url: str | None = None
    duration_seconds: float | None = None


class VideoProvider(Protocol):
    platform: str
    hosts: list[str]
    unavailable_message: str

    def is_configured(self) -> bool: ...

    async def lookup(self, page_url: SplitResult) -> ProviderLookup: ...


def host_matches(hostname: str, domain: str) -> bool:
    host = hostname.lower()
    host = host[:-1] if host.endswith('.') else host
    return host == domain or host.endswith(f'.{domain}')
