from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Mapping

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / '.env'

DEFAULT_CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
_DECIMAL = re.compile(r'[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?')
_HEX = re.compile(r'0[xX][0-9a-fA-F]+')
_GRAPH_VERSION = re.compile(r'v[0-9]+\.[0-9]+')


@dataclass(frozen=True)
class AppConfig:
    port: int = 3000
    host: str = '127.0.0.1'
    cors_origins: tuple[str, ...] = field(default_factory=lambda: tuple(DEFAULT_CORS_ORIGINS.split(',')))
    graph_api_version: str = 'v26.0'
    facebook_user_access_token: str = ''
    facebook_page_access_token: str = ''
    request_timeout_ms: int = 12_000
    download_timeout_ms: int = 120_000
    max_download_bytes: int = 536_870_912
    rate_limit_ttl_ms: int = 60_000
    rate_limit_limit: int = 60
    lookup_ttl_ms: int = 600_000
    enable_yt_dlp: bool = True


def load_env_file(path: Path = ENV_FILE) -> None:
    """Reads backend/.env without overriding variables already set in the environment."""
    if path.is_file():
        load_dotenv(path, override=False)


def facebook_access_token(config: AppConfig) -> str:
    return config.facebook_page_access_token or config.facebook_user_access_token


def _integer(env: Mapping[str, str], key: str, fallback: int) -> int:
    raw = env.get(key)
    if raw is None or raw.strip() == '':
        return fallback
    text = raw.strip()
    value: float | None = None
    if _DECIMAL.fullmatch(text):
        value = float(text)
    elif _HEX.fullmatch(text):
        value = float(int(text, 16))
    if value is None or not value.is_integer() or value <= 0:
        raise ValueError(f'{key} must be a positive integer.')
    return int(value)


def _trimmed(env: Mapping[str, str], key: str) -> str:
    return (env.get(key) or '').strip()


def load_config(env: Mapping[str, str]) -> AppConfig:
    graph_api_version = _trimmed(env, 'FACEBOOK_GRAPH_API_VERSION') or 'v26.0'
    if not _GRAPH_VERSION.fullmatch(graph_api_version):
        raise ValueError('FACEBOOK_GRAPH_API_VERSION must look like v26.0.')

    cors_raw = _trimmed(env, 'CORS_ORIGIN') or DEFAULT_CORS_ORIGINS
    cors_origins = tuple(origin.strip() for origin in cors_raw.split(',') if origin.strip())

    enable_yt_dlp_raw = _trimmed(env, 'ENABLE_YT_DLP').lower()
    enable_yt_dlp = enable_yt_dlp_raw not in ('false', '0', 'no', 'off')

    return AppConfig(
        port=_integer(env, 'PORT', 3000),
        host=_trimmed(env, 'HOST') or '127.0.0.1',
        cors_origins=cors_origins,
        graph_api_version=graph_api_version,
        facebook_user_access_token=_trimmed(env, 'FACEBOOK_USER_ACCESS_TOKEN'),
        facebook_page_access_token=_trimmed(env, 'FACEBOOK_PAGE_ACCESS_TOKEN'),
        request_timeout_ms=_integer(env, 'REQUEST_TIMEOUT_MS', 12_000),
        download_timeout_ms=_integer(env, 'DOWNLOAD_TIMEOUT_MS', 120_000),
        max_download_bytes=_integer(env, 'MAX_DOWNLOAD_BYTES', 536_870_912),
        rate_limit_ttl_ms=_integer(env, 'RATE_LIMIT_TTL_MS', 60_000),
        rate_limit_limit=_integer(env, 'RATE_LIMIT_LIMIT', 60),
        lookup_ttl_ms=_integer(env, 'LOOKUP_TTL_MS', 600_000),
        enable_yt_dlp=enable_yt_dlp,
    )
