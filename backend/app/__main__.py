"""Starts the API: `python -m app` (add `--reload` while developing)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import uvicorn

from app.config import load_config, load_env_file


def main() -> None:
    load_env_file()
    config = load_config(os.environ)
    reload = '--reload' in sys.argv[1:]
    uvicorn.run(
        'app.main:create_app',
        factory=True,
        host=config.host,
        port=config.port,
        reload=reload,
        reload_dirs=[str(Path(__file__).resolve().parent)] if reload else None,
        # The rate limit keys on the socket address, as before. Forwarded-for headers are
        # ignored so a client cannot pick its own identity through the Next.js proxy.
        proxy_headers=False,
        log_level='info',
    )


if __name__ == '__main__':
    main()
