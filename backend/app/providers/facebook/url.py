from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal
from urllib.parse import SplitResult, parse_qsl

FacebookLinkType = Literal['share', 'short', 'reel', 'watch', 'other']

VIDEO_ID = re.compile(r'[0-9]{5,20}')
_REEL = re.compile(r'/reels?/([0-9]{5,20})(?:/|\Z)')
_VIDEOS = re.compile(r'/videos/([0-9]{5,20})(?:/|\Z)')


@dataclass(frozen=True)
class FacebookTarget:
    kind: Literal['video', 'unresolved']
    video_id: str | None = None
    link_type: FacebookLinkType | None = None


def _clean_path(pathname: str) -> str:
    trimmed = pathname.rstrip('/')
    return trimmed or '/'


def _numeric_id(value: str | None) -> str | None:
    return value if value and VIDEO_ID.fullmatch(value) else None


def _first_query_value(parts: SplitResult, name: str) -> str | None:
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == name:
            return value
    return None


def classify_facebook_target(url: SplitResult) -> FacebookTarget:
    """Classifies a Facebook URL. Share codes and fb.watch links are not treated as video ids."""
    host = (url.hostname or '').lower()
    host = host[4:] if host.startswith('www.') else host
    host = host[:-1] if host.endswith('.') else host
    if host == 'fb.watch' or host.endswith('.fb.watch'):
        return FacebookTarget('unresolved', link_type='short')

    path = _clean_path(url.path).lower()
    if path == '/share' or path.startswith('/share/'):
        return FacebookTarget('unresolved', link_type='share')

    watch_value = _first_query_value(url, 'v')
    if watch_value is None:
        watch_value = _first_query_value(url, 'video_id')
    watch_id = _numeric_id(watch_value)
    if path == '/watch' or path.startswith('/watch/') or path == '/video.php' or path.endswith('/video.php'):
        if watch_id:
            return FacebookTarget('video', video_id=watch_id)
        path_id = _numeric_id(path.split('/')[-1])
        return FacebookTarget('video', video_id=path_id) if path_id else FacebookTarget('unresolved', link_type='watch')

    reel = _REEL.search(path)
    if path == '/reel' or path.startswith('/reel/') or path.startswith('/reels/') or '/reel/' in path:
        return FacebookTarget('video', video_id=reel.group(1)) if reel else FacebookTarget('unresolved', link_type='reel')

    videos = _VIDEOS.search(path)
    if videos:
        return FacebookTarget('video', video_id=videos.group(1))
    if '/videos/' in path or path.startswith('/video/'):
        return FacebookTarget('unresolved', link_type='watch')

    return FacebookTarget('unresolved', link_type='other')


def unresolved_link_message(link_type: FacebookLinkType) -> str:
    if link_type in ('share', 'short'):
        return 'The public redirect for this share or fb.watch link did not include a numeric video id. ReelFetch does not read the page or use cookies to look further.'
    if link_type in ('reel', 'watch'):
        return 'That Facebook link does not include a numeric video id, so the Graph API cannot look it up.'
    return 'That Facebook link does not look like a Reel, Watch, or video address. Paste the video link that contains the numeric id.'
