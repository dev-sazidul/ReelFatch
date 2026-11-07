from __future__ import annotations

import secrets
import time
from dataclasses import dataclass, replace
from typing import Any, Callable, Literal

from app.providers.base import ProviderLookup

Clock = Callable[[], float]


def _now_ms() -> float:
    return time.monotonic() * 1000


@dataclass
class StoredLookup:
    lookup: ProviderLookup
    lookup_id: str
    expires_at: float

    @property
    def platform(self) -> str:
        return self.lookup.platform

    @property
    def video_id(self) -> str:
        return self.lookup.video_id


JobStatus = Literal['ready', 'streaming', 'completed', 'failed']


@dataclass
class DownloadJob:
    job_id: str
    lookup_id: str
    quality_id: str
    status: JobStatus
    created_at: float
    expires_at: float
    error_code: str | None = None
    error_message: str | None = None


class LookupStore:
    """
    In-process lookup records. A shared store (for example Redis) can replace this class
    when more than one API process must see the same lookups; callers keep using this interface.
    """

    def __init__(self, clock: Clock = _now_ms):
        self._records: dict[str, StoredLookup] = {}
        self._clock = clock

    def save(self, lookup: ProviderLookup, ttl_ms: int) -> StoredLookup:
        record = StoredLookup(lookup=lookup, lookup_id=secrets.token_hex(16), expires_at=self._clock() + ttl_ms)
        self._records[record.lookup_id] = record
        return record

    def get(self, lookup_id: str) -> StoredLookup | None:
        self._purge()
        record = self._records.get(lookup_id)
        if record is None or record.expires_at <= self._clock():
            return None
        return record

    def _purge(self) -> None:
        now = self._clock()
        for lookup_id in [key for key, record in self._records.items() if record.expires_at <= now]:
            del self._records[lookup_id]


class DownloadJobStore:
    """In-process download jobs. A queue (for example Redis + a worker) can replace this class later."""

    def __init__(self, clock: Clock = _now_ms):
        self._jobs: dict[str, DownloadJob] = {}
        self._clock = clock

    def create(self, lookup_id: str, quality_id: str, ttl_ms: int) -> DownloadJob:
        now = self._clock()
        job = DownloadJob(
            job_id=secrets.token_hex(16),
            lookup_id=lookup_id,
            quality_id=quality_id,
            status='ready',
            created_at=now,
            expires_at=now + ttl_ms,
        )
        self._jobs[job.job_id] = job
        return job

    def get(self, job_id: str) -> DownloadJob | None:
        job = self._jobs.get(job_id)
        if job is None or job.expires_at <= self._clock():
            return None
        return job

    def update(self, job_id: str, **changes: Any) -> DownloadJob | None:
        job = self.get(job_id)
        if job is None:
            return None
        updated = replace(job, **changes)
        self._jobs[job_id] = updated
        return updated


def to_public_lookup(record: StoredLookup) -> dict[str, Any]:
    lookup = record.lookup
    data: dict[str, Any] = {'lookupId': record.lookup_id, 'platform': lookup.platform}
    if lookup.title is not None:
        data['title'] = lookup.title
    if lookup.description is not None:
        data['description'] = lookup.description
    if lookup.thumbnail_url is not None:
        data['thumbnailUrl'] = lookup.thumbnail_url
    data['sourceLabel'] = lookup.source_label
    data['qualities'] = [quality.to_json() for quality in lookup.qualities]
    data['reportedFormats'] = lookup.reported_formats
    return data


__all__ = ['DownloadJob', 'DownloadJobStore', 'LookupStore', 'StoredLookup', 'to_public_lookup']
