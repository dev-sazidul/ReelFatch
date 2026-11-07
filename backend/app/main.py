from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import AppConfig, load_config, load_env_file
from app.errors import install_exception_handlers
from app.health import router as health_router
from app.http_client import ClientFactory, create_http_client
from app.providers.facebook.provider import FacebookVideoProvider
from app.rate_limit import RateLimitHeadersMiddleware, Throttler
from app.videos.router import router as videos_router
from app.videos.service import VideosService

logger = logging.getLogger('Bootstrap')


def _configure_logging() -> None:
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s [%(name)s] %(message)s')
    # httpx logs complete request URLs at INFO; CDN source URLs must stay private.
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)


def create_app(config: AppConfig | None = None, client_factory: ClientFactory = create_http_client) -> FastAPI:
    _configure_logging()
    if config is None:
        load_env_file()
        config = load_config(os.environ)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        logger.info('ReelFetch API listening on %s', config.port)
        yield

    # Interactive docs are off: this is an internal service and its routes are documented in docs/FEATURES.md.
    app = FastAPI(title='ReelFetch API', docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
    app.state.config = config
    app.state.throttler = Throttler(config.rate_limit_ttl_ms, config.rate_limit_limit)
    app.state.videos = VideosService(config, FacebookVideoProvider(config, client_factory), media_client_factory=client_factory)

    install_exception_handlers(app)
    app.add_middleware(RateLimitHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(config.cors_origins),
        allow_methods=['GET', 'POST', 'OPTIONS'],
        allow_headers=['content-type', 'accept'],
    )
    app.include_router(health_router)
    app.include_router(videos_router)
    return app
