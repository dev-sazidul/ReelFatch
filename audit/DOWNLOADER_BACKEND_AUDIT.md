# Downloader & Backend Audit — ReelFetch

**Audit Date:** 2026-11-23  
**Scope:** Complete end-to-end downloader pipeline (`frontend/src/hooks/use-video-lookup.ts`, `frontend/src/services/backend-api.ts`, `frontend/next.config.ts`, `backend/app/*`, `backend/Dockerfile`, `compose.yaml`).

---

## 1. Workflow Trace & Mismatches

1. **Input & Detection (`video-url-form.tsx` -> `use-video-lookup.ts` -> `platforms.ts`):**
   - `detectPlatformUrl()` (`platforms.ts:72-122`) validates `http:`/`https:` URLs, then falls back to creating a `genericPlatform` for **any** hostname. Thus `unsupported` is never returned.
2. **Lookup (`backend-api.ts:18-45` -> `next.config.ts:24` -> `backend/app/videos/router.py:20-23`):**
   - Frontend sends `POST /api/videos/lookup` with a 20s `AbortSignal.timeout`.
   - Backend applies `request_timeout_ms` (`12s`) around `yt_dlp.YoutubeDL.extract_info(download=False)`.
3. **Download Job (`backend-api.ts:46-64` -> `router.py:31-52`):**
   - `POST /api/videos/downloads` does **not** start a background job; it merely creates an in-memory `ready` record (`service.py:73-86`).
   - `GET /api/videos/downloads/{jobId}/file` synchronously downloads the entire video to `/tmp` via `yt-dlp`, then streams it to Next.js, which proxies it to the browser.
   - Browser `saveFile()` (`backend-api.ts:98-125`) buffers **every chunk in JS RAM** (`chunks: Uint8Array[]` -> `new Blob(chunks)`) before triggering `<a download>`.

---

## 2. Identified Issues

### DL-001 — Cloudflare Intercepts Backend HTTP 502 Responses, Hiding Real Error Messages
- **Page / Component:** `YtDlpVideoProvider` + Cloudflare Proxy + `backend-api.ts`
- **URL / File Path:** `backend/app/providers/ytdlp_provider.py:146, 151, 242, 248`, `frontend/src/services/backend-api.ts:90-96`
- **Problem Description:** Backend returns HTTP `502` for `VIDEO_NOT_AVAILABLE` and `PROVIDER_ERROR`. Cloudflare treats origin `502` as a gateway failure and replaces the JSON body with Cloudflare's `Error 502: Bad gateway` payload (`detail`, `title`), which lacks `message`/`code`.
- **Expected Behavior:** Users should see actionable backend error messages (e.g., `"This video could not be retrieved or is unavailable."`).
- **Actual Behavior:** Frontend receives Cloudflare's 502 JSON where `body?.message` is `undefined` and displays `"The server returned HTTP 502."`.
- **Evidence:** Live `POST https://bestdownloader.site/api/videos/lookup` responses for YouTube, TikTok, Instagram, X, Pinterest, Reddit.
- **Root Cause:** Using HTTP `502` for application-level extraction failures behind Cloudflare.
- **Severity:** Critical
- **Recommended Solution:** Return HTTP `422` or `400` (for extraction/unavailable errors) or `503` with a proper JSON body so Cloudflare passes the error JSON through intact.

### DL-002 — Browser Buffers Entire Video File in RAM (`Blob`) with 120s Hard Timeout
- **Page / Component:** `saveFile()` in `backend-api.ts`
- **URL / File Path:** `frontend/src/services/backend-api.ts:58, 98-125`
- **Problem Description:** `saveFile()` reads the entire `ReadableStream` into `chunks: Uint8Array[]`, creates a `Blob`, and calls `anchor.click()` with a hardcoded `AbortSignal.timeout(120_000)`.
- **Expected Behavior:** Browser should stream the download natively to disk via `Content-Disposition: attachment` without holding hundreds of MBs in JS memory or aborting at 120s.
- **Actual Behavior:** Large videos or slow mobile connections can exhaust tab memory (especially on iOS/Android) or fail at 120s.
- **Evidence:** `frontend/src/services/backend-api.ts:58, 104-124`.
- **Root Cause:** Using `fetch()` + `Blob` instead of direct browser navigation / hidden iframe / native download link to `/api/videos/downloads/{jobId}/file`.
- **Severity:** High
- **Recommended Solution:** Trigger native browser download via `window.location.assign(...)` or `<a href="/api/videos/downloads/{jobId}/file" download>` after `POST /api/videos/downloads` succeeds (with error pre-check or status polling).

### DL-003 — `asyncio.timeout` Does Not Cancel Background `yt-dlp` Threads
- **Page / Component:** `YtDlpVideoProvider.lookup` & `download_video`
- **URL / File Path:** `backend/app/providers/ytdlp_provider.py:136-138, 232-234, 310-319`
- **Problem Description:** `asyncio.timeout` cancels the awaiting coroutine, but `asyncio.to_thread(_extract)` / `asyncio.to_thread(_download)` continues running in the thread pool and writing to `/tmp` until `yt-dlp` finishes.
- **Expected Behavior:** Timed-out lookups/downloads should abort promptly without leaking CPU, bandwidth, or `/tmp` disk space.
- **Actual Behavior:** Orphaned `yt-dlp` threads keep running after returning `504 PROVIDER_TIMEOUT`. Also, `_stream_and_cleanup` has no timeout.
- **Evidence:** `backend/app/providers/ytdlp_provider.py:136-138, 232-234`.
- **Root Cause:** Python threads cannot be cancelled by `asyncio.timeout`.
- **Severity:** High
- **Recommended Solution:** Run `yt-dlp` in a cancellable subprocess (`asyncio.create_subprocess_exec`) with `proc.kill()` on timeout.

### DL-004 — `DownloadJobStore` Never Purges Expired Jobs (Unbounded Memory Leak)
- **Page / Component:** `DownloadJobStore`
- **URL / File Path:** `backend/app/videos/store.py:75-108`
- **Problem Description:** `LookupStore` purges expired entries in `get()`, but `DownloadJobStore` has no `_purge()` method at all.
- **Expected Behavior:** Expired download jobs should be evicted periodically or on `save()`/`get()`.
- **Actual Behavior:** Every `POST /api/videos/downloads` permanently retains a `DownloadJob` object in RAM for the lifetime of the single-worker process.
- **Evidence:** `backend/app/videos/store.py:75-108` vs `store.py:63`.
- **Root Cause:** Missing `_purge()` in `DownloadJobStore`.
- **Severity:** High
- **Recommended Solution:** Implement TTL-based `_purge()` on `save()`/`get()` and cap maximum store size.

### DL-005 — Concurrent/Repeated Requests to Same `job_id` Race on Temp Files
- **Page / Component:** `VideosService.open_download`
- **URL / File Path:** `backend/app/videos/service.py:99-153`, `backend/app/providers/ytdlp_provider.py:215, 293-300`
- **Problem Description:** `open_download` never checks if `job.status` is already `'streaming'` or `'completed'`. Calling `GET /api/videos/downloads/{jobId}/file` multiple times in parallel spawns concurrent `yt-dlp` downloads using the exact same `rf_{job_id}_` temp filename prefix.
- **Expected Behavior:** A `jobId` should only execute one download or reject concurrent duplicate file requests.
- **Actual Behavior:** Concurrent calls overwrite/delete each other's temp files via `_cleanup_pattern(temp_dir, job_id)`.
- **Evidence:** `backend/app/videos/service.py:99-153`.
- **Root Cause:** No state guard or per-job lock in `open_download`.
- **Severity:** Medium
- **Recommended Solution:** Guard `open_download` so `streaming`/`completed` jobs cannot be re-triggered concurrently.

### DL-006 — Missing Node.js Runtime in `backend/Dockerfile` Breaks `yt-dlp` JS Extraction
- **Page / Component:** `backend/Dockerfile` & `YtDlpVideoProvider._get_js_runtimes`
- **URL / File Path:** `backend/Dockerfile:1-18`, `backend/app/providers/ytdlp_provider.py:58-62`
- **Problem Description:** `YtDlpVideoProvider` checks `shutil.which('node')`, but `backend/Dockerfile` uses `python:3.14-slim-bookworm` without installing `nodejs`.
- **Expected Behavior:** `node` (or another supported JS runtime) should be installed for `yt-dlp` extractors that require JS execution (especially YouTube).
- **Actual Behavior:** `_get_js_runtimes()` returns `None` inside Docker.
- **Evidence:** `backend/Dockerfile:2-18`; `backend/app/providers/ytdlp_provider.py:58-62`.
- **Root Cause:** `nodejs` omitted from `apt-get install` in `backend/Dockerfile`.
- **Severity:** High
- **Recommended Solution:** Install `nodejs` (or `deno`) in `backend/Dockerfile` and verify `yt-dlp` YouTube extraction in container.

### DL-007 — `filenameFrom()` Regex Fails on Spaces / Non-ASCII Filenames
- **Page / Component:** `backend-api.ts` (`filenameFrom`)
- **URL / File Path:** `frontend/src/services/backend-api.ts:127-130`
- **Problem Description:** `disposition?.match(/filename="([A-Za-z0-9._-]+)"/)` only matches ASCII alphanumerics, `.`, `_`, `-`, and ignores `filename*=UTF-8''...`.
- **Expected Behavior:** All valid `Content-Disposition` filenames should be parsed.
- **Actual Behavior:** Any filename with spaces or Unicode falls back to `'video.mp4'`.
- **Evidence:** `frontend/src/services/backend-api.ts:128`.
- **Root Cause:** Overly restrictive regex.
- **Severity:** Low
- **Recommended Solution:** Parse `filename*=` and quoted `filename="..."` safely (or rely on native browser download via `Content-Disposition`).

### DL-008 — `ffmpeg` Availability & Unpinned `yt-dlp` Dependency
- **Page / Component:** `backend/requirements.txt` & `backend/Dockerfile`
- **URL / File Path:** `backend/requirements.txt:5-6`, `backend/Dockerfile:4-6`
- **Problem Description:** `yt-dlp>=2026.10.26` and `imageio-ffmpeg>=0.8.1` have no upper version bounds, and `ffmpeg` binary is installed via `imageio-ffmpeg` rather than system `ffmpeg` (which `yt-dlp` expects on `PATH` unless configured via `ffmpeg_location`).
- **Expected Behavior:** `yt-dlp` should reliably find `ffmpeg` for merging separate video+audio streams (`bestvideo+bestaudio`).
- **Actual Behavior:** If `imageio-ffmpeg` binary is not on `PATH` and `ffmpeg_location` is not set in `ytdlp_provider.py`, `yt-dlp` cannot merge DASH streams (e.g., Reddit, YouTube 1080p).
- **Evidence:** `backend/app/providers/ytdlp_provider.py:102-124` (no `ffmpeg_location` option set); `backend/Dockerfile:4-6` (does not `apt-get install ffmpeg`).
- **Root Cause:** Missing system `ffmpeg` in `Dockerfile` and no `ffmpeg_location` passed to `YoutubeDL`.
- **Severity:** High
- **Recommended Solution:** Install `ffmpeg` in `backend/Dockerfile` (or pass `imageio_ffmpeg.get_ffmpeg_exe()` as `ffmpeg_location` in `ytdlp_provider.py`).
