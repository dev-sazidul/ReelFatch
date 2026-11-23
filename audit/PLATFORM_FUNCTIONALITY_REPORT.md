# Platform Functionality Report — ReelFetch (`https://bestdownloader.site/`)

**Test Date:** 2026-11-23  
**Method:** Live `GET /api/health`, `POST /api/videos/lookup`, `POST /api/videos/downloads`, and `GET /api/videos/downloads/{jobId}/file` against `https://bestdownloader.site/`, combined with backend/frontend source inspection.

---

## Summary Table

| Platform | UI Status | Live API Lookup | Live Download | Overall Status |
|---|---|---|---|---|
| **Facebook** | Available | HTTP 201 (1.91s) | HTTP 200 (`video/mp4`, 5.38 MB, valid `ftypisom`) | **Fully Working** (single `source` quality only) |
| **YouTube** | Available | HTTP 502 (Cloudflare `origin_bad_gateway`) | Not reached | **Not Working** |
| **TikTok** | Available | HTTP 502 (Cloudflare `origin_bad_gateway`) | Not reached | **Not Working** |
| **Instagram** | Available | HTTP 502 (Cloudflare `origin_bad_gateway`) | Not reached | **Not Working** |
| **X (Twitter)** | Available | HTTP 502 (Cloudflare `origin_bad_gateway`) | Not reached | **Not Working** |
| **Pinterest** | Available | HTTP 502 (Cloudflare `origin_bad_gateway`) | Not reached | **Not Working** |
| **Reddit** | Available | HTTP 502 (Cloudflare `origin_bad_gateway`) | Not reached | **Not Working** |

> **Important Note on Quality Selection:** Even on Facebook (the one working platform), the backend (`ytdlp_provider.py:180-188`) only returns **one** quality option: `id: "source"`, `label: "Original file"`. It does **not** return selectable resolutions (e.g., 360p, 720p, 1080p) despite the homepage and FAQ repeatedly promising *"choose an available quality"* / *"select a listed quality"*.

---

## Per-Platform Detailed Findings

### 1. Facebook — **Fully Working** (Single-Quality Only)
- **Test URL:** `https://www.facebook.com/watch/?v=10153231379946729`
- **URL Detection:** Working (`facebook.com`, `fb.watch` in `platforms.json:7`).
- **Backend Recognition & Resolution:** `yt-dlp (Facebook)` (`POST /api/videos/lookup` -> HTTP `201` in `1.91s`).
- **Metadata Returned:** `title: "How to Share With Just Friends"`, `durationSeconds: 74.304`, `qualities: [{"id":"source","label":"Original file","available":true,"format":"mp4"}]`, `reportedFormats: []`.
- **Download Process:** `POST /api/videos/downloads` -> HTTP `201` (`0.27s`); `GET /api/videos/downloads/{jobId}/file` -> HTTP `200` (`2.17s`), `content-type: video/mp4`, `content-length: 5388007`, `content-disposition: attachment; filename="How_to_Share_With_Just_Friends.mp4"`, magic bytes `b'\x00\x00\x00 ftypisom'` (valid MP4).
- **Issues Found:** Only 1 quality (`source`) is returned; `reportedFormats` was empty `[]`.

### 2. YouTube — **Not Working**
- **Test URL:** `https://www.youtube.com/watch?v=jNQXAC9IVRw` (public video)
- **URL Detection:** Frontend detects `youtube.com`, `youtu.be`, `youtube-nocookie.com` (`platforms.json:38`).
- **Backend Recognition & Resolution:** Backend `YtDlpVideoProvider` accepts it, but live `POST /api/videos/lookup` failed twice with **HTTP 502** (`2.43s`, Cloudflare `origin_bad_gateway`).
- **Media / Quality / Download:** Not returned; download cannot start.
- **Root Cause:**
  1. `backend/Dockerfile` (`python:3.14-slim-bookworm`) does **not** install Node.js, so `ytdlp_provider.py:_get_js_runtimes()` (L58–62) returns `None`, preventing `yt-dlp` from solving YouTube JS challenges.
  2. YouTube frequently blocks datacenter/cloud IPs without PO tokens or cookies.
  3. `ytdlp_provider.py:146, 151` raises `ApiError(502, ...)`, which Cloudflare intercepts and replaces with its generic 502 error page/JSON.

### 3. TikTok — **Not Working**
- **Test URL:** `https://www.tiktok.com/@tiktok/video/7106594312292453675`
- **URL Detection:** Frontend detects `tiktok.com` (`platforms.json:69`).
- **Live Lookup:** Failed twice with **HTTP 502** (`1.63s`, Cloudflare `origin_bad_gateway`).
- **Root Cause:** `yt-dlp` TikTok extraction fails on the production server (likely anti-bot / datacenter IP block or extractor failure), raising `ApiError(502)` which Cloudflare intercepts.

### 4. Instagram — **Not Working**
- **Test URL:** `https://www.instagram.com/reel/DCq9qX0S4xQ/`
- **URL Detection:** Frontend detects `instagram.com` (`platforms.json:100`).
- **Live Lookup:** Failed with **HTTP 502** (`1.61s`, Cloudflare `origin_bad_gateway`).
- **Root Cause:** Instagram blocks unauthenticated/datacenter `yt-dlp` requests or requires login/cookies; backend raises `ApiError(502)`, intercepted by Cloudflare.

### 5. X (Twitter) — **Not Working**
- **Test URL:** `https://x.com/NASA/status/1857128812277002495`
- **URL Detection:** Frontend detects `x.com`, `twitter.com` (`platforms.json:131`).
- **Live Lookup:** Failed with **HTTP 502** (`1.34s`, Cloudflare `origin_bad_gateway`).
- **Root Cause:** X/Twitter extraction via `yt-dlp` fails on server (guest token / API / rate-limit / datacenter block), raising `ApiError(502)` intercepted by Cloudflare.

### 6. Pinterest — **Not Working**
- **Test URL:** `https://www.pinterest.com/pin/99360735500167749/`
- **URL Detection:** Frontend detects `pinterest.com`, `pin.it` (`platforms.json:162`).
- **Live Lookup:** Failed with **HTTP 502** (`0.93s`, Cloudflare `origin_bad_gateway`).
- **Root Cause:** `yt-dlp` extraction failed on the server, raising `ApiError(502)` intercepted by Cloudflare.

### 7. Reddit — **Not Working**
- **Test URL:** `https://www.reddit.com/r/aww/comments/1g1q0q0/`
- **URL Detection:** Frontend detects `reddit.com`, `redd.it` (`platforms.json:193`).
- **Live Lookup:** Failed with **HTTP 502** (`0.56s`, Cloudflare `origin_bad_gateway`).
- **Root Cause:** Reddit blocks unauthenticated datacenter requests / `yt-dlp` extraction fails, raising `ApiError(502)` intercepted by Cloudflare.

---

## Platform-Specific Issues

### PLAT-001 — All 7 Platforms Marked "Available" in UI Despite 6 Failing in Production
- **Page / Component:** `PlatformGrid` & `PlatformPage`
- **URL / File Path:** `frontend/src/data/platforms.json:8, 39, 70, 101, 132, 163, 194`, `frontend/src/services/platform-integrations.ts:45-59`
- **Problem Description:** All 7 platforms are hardcoded `"status": "Available"` and `getAuthorizedVideoProvider()` unconditionally returns `backendProvider` for every platform.
- **Expected Behavior:** Only genuinely working platforms should be marked `Available`; broken or unverified platforms should be marked `Unavailable` or `Coming Soon` (or fixed).
- **Actual Behavior:** 6 of 7 platforms fail with HTTP 502 on live lookup while displaying green `Available` badges.
- **Evidence:** `GET /api/health` reports all 7 `configured: true`, yet 6/7 fail `POST /api/videos/lookup` with 502.
- **Root Cause:** Static JSON config + unconditional `backendProvider` return without per-platform health/capability verification.
- **Severity:** Critical
- **Recommended Solution:** Fix/verify each `yt-dlp` extractor in production (add Node.js runtime, proxies/cookies where permitted, or disable broken platforms) and reflect real status in UI.

### PLAT-002 — Only Single `"source"` Quality Returned Instead of Multiple Selectable Qualities
- **Page / Component:** `YtDlpVideoProvider.lookup` & `QualitySelector`
- **URL / File Path:** `backend/app/providers/ytdlp_provider.py:180-188`, `backend/app/videos/validation.py:83`
- **Problem Description:** `lookup()` hardcodes a single quality `id='source'` (`"Original file"`), and `validate_download()` rejects any `qualityId != 'source'`.
- **Expected Behavior:** Return actual selectable quality tiers (e.g., 1080p, 720p, 480p, 360p) as advertised in homepage copy and FAQs.
- **Actual Behavior:** Only `"Original file"` is ever offered.
- **Evidence:** `backend/app/providers/ytdlp_provider.py:180-188`; live Facebook response `qualities: [{"id":"source","label":"Original file","available":true,"format":"mp4"}]`.
- **Root Cause:** `YtDlpVideoProvider` was implemented with a single hardcoded `source` format instead of mapping `info['formats']` to selectable `format_id`s.
- **Severity:** High
- **Recommended Solution:** Map distinct progressive/merged resolutions from `yt-dlp` formats into selectable `qualities` and pass the chosen `format_id` to `download_video`.
