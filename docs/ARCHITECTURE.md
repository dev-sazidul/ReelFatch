# Architecture

```text
Browser (Vite, port 5173)
  Find Video
    -> POST /api/videos/lookup
Vite proxy
    -> NestJS API (port 3000)
         VideosController
           VideosService
             ProviderRegistry
               FacebookVideoProvider -> graph.facebook.com
               YouTube / TikTok / Instagram providers (not configured)
             LookupStore (memory, TTL)
             DownloadJobStore (memory, TTL)
         GET /api/videos/downloads/:jobId/file
           -> Facebook Graph source URL, then an allowed CDN host
```

Controllers validate input and return JSON or a file stream. Provider calls, job records, and file transfer live in services. Replacing `DownloadJobStore` with a BullMQ queue is the extension point for moving long downloads off the request process. Redis and BullMQ are not installed; the in-memory store is enough for one local server and avoids an unused dependency.

## Provider interface

`VideoProvider` in `backend/src/providers/video-provider.ts` exposes:

- `platform` and `hosts`
- `isConfigured()`
- `lookup(url)` returning metadata and qualities, never a fabricated file URL
- Facebook additionally implements `getAuthorizedSource(videoId)` for the download step

`selectProvider` chooses the adapter from the hostname. A new platform is a new class registered beside `FacebookVideoProvider`. Until that class has a real authorized client, `isConfigured()` stays false and lookup throws `PROVIDER_NOT_CONFIGURED`.

## Security boundaries

- Pasted URLs are parsed and checked. The server does not fetch the pasted URL.
- Graph requests use `Authorization: Bearer` and a numeric video id. The token is not placed in the query string and is redacted if it appears in an error message.
- CDN downloads allow only `https` URLs on `.fbcdn.net` and `.fbsbx.com`, with no userinfo and no IP hosts. Redirects are followed manually, at most three hops, and each hop must pass the same check.
- Response content type must be a video type or `application/octet-stream`.
- `MAX_DOWNLOAD_BYTES` stops oversized files. Request timeouts cover Graph calls and the file transfer.
- `@nestjs/throttler` limits request rate per IP. Health checks are excluded.
- CORS allows only `CORS_ORIGIN`.

## Frontend

`createBackendVideoProvider` posts to the API and implements the existing `AuthorizedVideoProvider` used by the homepage. Download progress uses `Content-Length` when the file response includes it. The browser then receives the bytes and is asked to save them.

`/api/lookup-log` remains a Vite development logger. It is not part of the Nest API.
