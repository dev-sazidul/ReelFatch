# Architecture

```text
Browser -> Next.js App Router (5173 dev / 4173 production)
  frontend/src/app/ -> frontend/src/views/ + shared components
  Find Video -> POST /api/videos/lookup
Next.js rewrites -> FastAPI / Uvicorn (127.0.0.1:3000)
  app/videos/router.py -> VideosService
    Provider registry
      FacebookVideoProvider -> public HTTPS HEAD redirect -> Graph API
      YouTube / TikTok / Instagram -> PROVIDER_NOT_CONFIGURED
    LookupStore / DownloadJobStore (memory, TTL)
  GET /api/videos/downloads/{job_id}/file -> allowed CDN stream
```

## Frontend

The frontend lives entirely in `frontend/`, including its package files, Next.js configuration, scripts, public assets, and environment files. The root layout supplies fonts, global CSS, brand colors, and client providers. Route pages reuse `frontend/src/views/`; `frontend/src/lib/seo.ts` supplies server-rendered metadata. Homepage styles and the labeled demo layout remain intact. Unknown routes and platform slugs return 404.

`createBackendVideoProvider` preserves lookup and download behavior. A download creates a job, reads the file stream with progress, and saves a browser Blob. The Graph source URL stays in the backend. `POST /api/lookup-log` is development-only; production returns 404 and does not send logging requests.

## Backend

`app/main.py:create_app` loads configuration, installs error handlers and CORS, creates services and the limiter, and registers routes. `python -m app` starts Uvicorn. Backend environment loading preserves shell values.

`VideoProvider` in `app/providers/base.py` exposes platform, hosts, `is_configured()`, and async `lookup()`. Facebook also has `get_authorized_source()` for rechecking access at download time.

The API preserves previous JSON fields, error codes, and POST success status (201). Unknown fields are rejected; request bodies are capped while reading. Use one worker; shared persistence is required before scaling to multiple processes.

## Security boundaries

- Numeric ids are extracted without fetching the page. Share resolution uses HTTPS HEAD, no cookies or body parsing, and approved Facebook hosts and ports on every hop.
- Graph calls use a numeric id and Bearer header. Tokens are never placed in query strings.
- Media URLs and redirects require HTTPS on allowed Facebook CDN hosts without credentials or nonstandard ports. Media type, total timeout, and maximum bytes are checked.
- Outbound HTTP request logging is suppressed to keep source URLs private. Unexpected errors log their type rather than their raw message.
- Per-route limiting excludes health and ignores forwarded headers; proxied requests share a socket-peer bucket.
- CORS permits configured origins only. The default frontend accesses the API through Next.js.

Provider tests use injected HTTP transports. They prove behavior against controlled responses, not access to real Facebook content.
