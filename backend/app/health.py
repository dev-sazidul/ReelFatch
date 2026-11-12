from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.config import AppConfig, facebook_access_token

router = APIRouter()


@router.get('/api/health')
async def health(request: Request) -> dict[str, Any]:
    config: AppConfig = request.app.state.config
    if config.enable_yt_dlp:
        return {
            'status': 'ok',
            'downloader': 'yt-dlp',
            'providers': {
                'facebook': {'mode': 'yt-dlp', 'configured': True},
                'youtube': {'mode': 'yt-dlp', 'configured': True},
                'tiktok': {'mode': 'yt-dlp', 'configured': True},
                'instagram': {'mode': 'yt-dlp', 'configured': True},
                'x': {'mode': 'yt-dlp', 'configured': True},
                'reddit': {'mode': 'yt-dlp', 'configured': True},
                'pinterest': {'mode': 'yt-dlp', 'configured': True},
            },
        }
    return {
        'status': 'ok',
        'providers': {
            'facebook': {
                'mode': 'graph-api',
                'configured': len(facebook_access_token(config)) > 0,
                'graphApiVersion': config.graph_api_version,
            },
            'youtube': {'configured': False, 'reason': 'Official Data API does not provide video files.'},
            'tiktok': {'configured': False, 'reason': 'No authorized download provider is configured.'},
            'instagram': {'configured': False, 'reason': 'No authorized download provider is configured.'},
        },
    }
