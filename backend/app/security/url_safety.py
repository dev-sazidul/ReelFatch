from __future__ import annotations

import asyncio
import ipaddress
import re
import socket
from urllib.parse import SplitResult, parse_qsl, urlencode, urlsplit, urlunsplit

from app.errors import ApiError

BLOCKED_HOSTS = {'localhost', 'metadata.google.internal'}
_IPV4 = re.compile(r'[0-9]{1,3}(\.[0-9]{1,3}){3}')
_NUMERIC_OR_HEX_HOST = re.compile(r'^(?:[0-9]+|0[xX][0-9a-fA-F]+)$')
_OCTAL_OR_SHORT_IP = re.compile(r'^(?:0[0-7]+|[0-9]+)(?:\.(?:0[0-7]+|0[xX][0-9a-fA-F]+|[0-9]+)){1,3}$')
# Characters a browser URL parser refuses in a host name.
_FORBIDDEN_HOST = re.compile(r'[\s<>^|\\"%`{}#/?@\[\]]')
_SENSITIVE_QUERY = re.compile(r'token|cookie|password|secret|auth|session|credential', re.IGNORECASE)


def _is_ip_address(hostname: str) -> bool:
    if hostname.startswith('[') or ':' in hostname:
        return True
    if _IPV4.fullmatch(hostname):
        return True
    if _NUMERIC_OR_HEX_HOST.fullmatch(hostname) or _OCTAL_OR_SHORT_IP.fullmatch(hostname):
        return True
    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        return False


def is_global_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str.split('%', 1)[0])
    except ValueError:
        return False
    return (
        ip.is_global
        and not ip.is_private
        and not ip.is_loopback
        and not ip.is_link_local
        and not ip.is_multicast
        and not ip.is_reserved
        and not ip.is_unspecified
    )


async def ensure_public_dns_host(hostname: str, port: int = 443) -> None:
    if _is_ip_address(hostname) or hostname in BLOCKED_HOSTS or hostname.endswith('.local') or hostname.endswith('.internal'):
        raise ApiError(400, 'INVALID_URL', 'That host is not allowed.')
    loop = asyncio.get_running_loop()
    try:
        infos = await loop.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except OSError:
        raise ApiError(400, 'INVALID_URL', 'That host could not be resolved.') from None
    if not infos:
        raise ApiError(400, 'INVALID_URL', 'That host could not be resolved.')
    for info in infos:
        sockaddr = info[4]
        ip_str = sockaddr[0] if sockaddr else ''
        if not is_global_ip(ip_str):
            raise ApiError(400, 'INVALID_URL', 'That host is not allowed.')


def is_safe_thumbnail_url(raw_url: object) -> bool:
    if not isinstance(raw_url, str) or len(raw_url) > 2000:
        return False
    parts = split_url(raw_url.strip())
    if parts is None or parts.scheme.lower() != 'https':
        return False
    if parts.username or parts.password:
        return False
    host = url_host(parts)
    if not host or _is_ip_address(host) or host in BLOCKED_HOSTS or host.endswith('.local') or host.endswith('.internal'):
        return False
    return True


def _strip_trailing_dot(host: str) -> str:
    return host[:-1] if host.endswith('.') else host


def split_url(raw: str) -> SplitResult | None:
    """Parses an absolute URL. Returns None when a browser URL parser would reject it."""
    try:
        parts = urlsplit(raw)
        parts.port  # noqa: B018 - raises ValueError for an invalid port
    except ValueError:
        return None
    if not parts.scheme:
        return None
    if parts.scheme.lower() in ('http', 'https'):
        host = parts.hostname or ''
        if not host:
            return None
        if ':' not in host and _FORBIDDEN_HOST.search(host):
            return None
    return parts


def url_host(parts: SplitResult) -> str:
    return _strip_trailing_dot((parts.hostname or '').lower())


def parse_public_http_url(raw_url: str) -> SplitResult:
    value = raw_url.strip()
    if not value or len(value) > 2000:
        raise ApiError(400, 'INVALID_URL', 'Enter one http or https video link.')
    try:
        scheme = urlsplit(value).scheme.lower()
    except ValueError:
        scheme = ''
    if scheme and scheme not in ('http', 'https'):
        raise ApiError(400, 'INVALID_URL', 'Only http and https links can be checked.')
    parts = split_url(value)
    if parts is None:
        raise ApiError(400, 'INVALID_URL', 'Enter a complete link beginning with https:// or http://.')
    if parts.username or parts.password:
        raise ApiError(400, 'INVALID_URL', 'Links that include a username or password are not accepted.')
    if parts.port is not None and parts.port not in (80, 443):
        raise ApiError(400, 'INVALID_URL', 'Only standard web ports are accepted.')
    host = url_host(parts)
    if not host or _is_ip_address(host) or host in BLOCKED_HOSTS or host.endswith('.local') or host.endswith('.internal'):
        raise ApiError(400, 'INVALID_URL', 'That host is not allowed.')
    return parts


def is_allowed_media_url(raw_url: str) -> bool:
    parts = split_url(raw_url)
    if parts is None:
        return False
    if parts.scheme.lower() != 'https' or parts.username or parts.password:
        return False
    if parts.port is not None and parts.port != 443:
        return False
    host = url_host(parts)
    if not host or _is_ip_address(host) or host in BLOCKED_HOSTS or host.endswith('.local'):
        return False
    return host == 'fbcdn.net' or host.endswith('.fbcdn.net') or host == 'fbsbx.com' or host.endswith('.fbsbx.com')


def redact_url(raw_url: str) -> str:
    parts = split_url(raw_url.strip())
    if parts is None:
        return '[unparsed url]'
    pairs = parse_qsl(parts.query, keep_blank_values=True)
    if any(_SENSITIVE_QUERY.search(key) for key, _ in pairs):
        redacted: list[tuple[str, str]] = []
        seen: set[str] = set()
        for key, value in pairs:
            if _SENSITIVE_QUERY.search(key):
                if key in seen:
                    continue
                seen.add(key)
                value = '[redacted]'
            redacted.append((key, value))
        parts = parts._replace(query=urlencode(redacted))
    return urlunsplit(parts)[:300]
