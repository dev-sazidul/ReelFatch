# Changelog

## 2026-11-07

- Added separate non-root Docker images and a Compose stack with health checks, an internal backend, runtime backend settings, and a standalone Next.js production server.

- Separated application code into `frontend/` and `backend/`; frontend dependencies, configuration, assets, scripts, and environment files now live in `frontend/`.

- Migrated Vite/wouter to Next.js App Router and NestJS to FastAPI/Uvicorn on `upgrade/fastapi-nextjs`.
- Preserved the homepage design and API field names, status codes, and authorized Graph-only download flow.
- Added backend `.env` loading, server-rendered page metadata, real 404 responses, and production API forwarding.
- Renamed frontend environment settings to `NEXT_PUBLIC_*` and `API_PROXY_TARGET`; sitemap generation uses Next.js production environment precedence.
- Added Python regression coverage for routes, downloads, configuration, rate limiting, HTTPS redirects, body limits, and sensitive logging.
- Disabled production lookup-log requests; retained the development logger without printing malformed request contents.
- Replaced obsolete setup and architecture documentation with current commands and deployment limitations.

## 2026-10-26

- Added a NestJS API in `backend/` with lookup, metadata, download-job, file, and health routes.
- Connected Find Video to that API. Facebook uses the official Graph API when a Page or user access token is configured.
- Share links and `fb.watch` short links return `LINK_ID_UNAVAILABLE` instead of being scraped.
- YouTube, TikTok, and Instagram return `PROVIDER_NOT_CONFIGURED`. No unofficial download client was added.
- Missing tokens return `PROVIDER_NOT_CONFIGURED` and do not call Facebook.
- Added request validation, timeouts, rate limiting, CORS, media-host checks, and secret redaction.
- Documented setup, endpoints, and provider limits.
