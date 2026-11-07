from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.config import AppConfig, facebook_access_token

router = APIRouter()


@router.get('/api/health')
async def health(request: Request) -> dict[str, Any]:
    config: AppConfig = request.app.state.config
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
