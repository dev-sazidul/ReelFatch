# Security & Reliability Report — ReelFetch

**Audit Date:** 2026-11-23  
**Scope:** `backend/app/*`, `frontend/src/app/api/lookup-log/route.ts`, `frontend/next.config.ts`, `backend/Dockerfile`, `compose.yaml`.  
*(Note: No secret values are printed in this report; no `.env` files or hardcoded secrets were found in the repository.)*

---

## 1. Identified Security & Reliability Issues

### SEC-001 — SSRF Risk in `parse_public_http_url()` + Universal `YtDlpVideoProvider`
- **Page / Component:** `url_safety.py`, `registry.py`, `ytdlp_provider.py`
- **URL / File Path:** `backend/app/security/url_safety.py:15-18, 47-67`, `backend/app/providers/registry.py:16-18`, `backend/app/providers/ytdlp_provider.py:100`
- **Problem Description:** `parse_public_http_url` only blocks literal IPv6 (`[`/`:`), dotted-quad IPv4 (`\d{1,3}(\.\d{1,3}){3}`), `localhost`, `metadata.google.internal`, and `.local`/`.internal`. It does **not** resolve DNS to block private/loopback/link-local/CGNAT IPs (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`), nor does it block integer/hex/octal IP formats (`http://2130706433/`, `http://0x7f000001/`). Because `YtDlpVideoProvider.universal = True`, any URL is passed to `yt-dlp`, which follows HTTP 302 redirects without SSRF validation.
- **Expected Behavior:** DNS resolution and redirect target IP validation should block all non-global/private/link-local IPs, and `yt-dlp` should be restricted to allowlisted domains/extractors.
- **Actual Behavior:** Internal Docker hostnames, DNS-rebinding hosts, alternative IP notations, or 302 redirects to `169.254.169.254` / `127.0.0.1` can be probed via `yt-dlp`.
- **Evidence:** `backend/app/security/url_safety.py:47-67`; `backend/app/providers/ytdlp_provider.py:100`.
- **Root Cause:** String-based hostname check without `ipaddress`/`socket.getaddrinfo` resolution or extractor allowlisting.
- **Severity:** High
- **Recommended Solution:** Resolve DNS and verify all A/AAAA records are `ip.is_global` before fetching, disable `universal = True` (restrict to allowlisted hosts/extractors), and validate redirect hops.

### SEC-002 — Rate Limiter Broken Behind Next.js Reverse Proxy (Shared Bucket DoS)
- **Page / Component:** `rate_limit.py` & `__main__.py`
- **URL / File Path:** `backend/app/rate_limit.py:75-88`, `backend/app/__main__.py:26`, `frontend/next.config.ts:21-26`
- **Problem Description:** `throttle()` keys on `request.client.host`, and `uvicorn` runs with `proxy_headers=False`. Because all browser traffic is proxied through Next.js (`127.0.0.1` or the Next.js container IP), every user shares the same single 60 req/min bucket per endpoint.
- **Expected Behavior:** Rate limiting should key on the real client IP (e.g., `CF-Connecting-IP` / trusted `X-Forwarded-For` from the reverse proxy).
- **Actual Behavior:** One user hitting 60 requests/min rate-limits **all** users on the site.
- **Evidence:** `backend/app/rate_limit.py:75-88`; `backend/app/__main__.py:26`.
- **Root Cause:** `proxy_headers=False` and no trusted forwarded-IP extraction.
- **Severity:** High
- **Recommended Solution:** Extract real client IP from trusted proxy headers (`CF-Connecting-IP` / `X-Forwarded-For` from trusted Docker/loopback proxy) and tighten per-IP download limits.

### SEC-003 — Unvalidated `thumbnailUrl` Returned Directly from `yt-dlp`
- **Page / Component:** `YtDlpVideoProvider.lookup` & `VideoResultCard`
- **URL / File Path:** `backend/app/providers/ytdlp_provider.py:156, 198`, `frontend/src/components/video-result-card.tsx:86`
- **Problem Description:** Unlike `FacebookVideoProvider` (which validates `picture` with `is_allowed_media_url`), `YtDlpVideoProvider` forwards `info.get('thumbnail')` verbatim to the frontend `<img src={result.thumbnailUrl}>`.
- **Expected Behavior:** Validate that `thumbnailUrl` is an `https://` URL before returning it.
- **Actual Behavior:** Any scheme/URL returned by an extractor is passed through.
- **Evidence:** `backend/app/providers/ytdlp_provider.py:156, 198` vs `backend/app/providers/facebook/provider.py:93`.
- **Root Cause:** Missing URL scheme check on `info.get('thumbnail')`.
- **Severity:** Low
- **Recommended Solution:** Enforce `https://` scheme validation on `thumbnail_url` before returning it in `ProviderLookup`.

### SEC-004 — Disk Exhaustion Risk from Concurrent Downloads in `/tmp`
- **Page / Component:** `YtDlpVideoProvider.download_video` & `VideosService.open_download`
- **URL / File Path:** `backend/app/providers/ytdlp_provider.py:214-271`, `backend/app/videos/service.py:99-153`
- **Problem Description:** Up to 60 `download_file` requests/min can each download up to `512 MB` (`max_download_bytes`) into `/tmp` simultaneously, and the same `job_id` can be requested concurrently without locking.
- **Expected Behavior:** Bounded concurrent downloads and per-job concurrency lock.
- **Actual Behavior:** Unbounded concurrent `/tmp` disk usage and race conditions on `rf_{job_id}_*`.
- **Evidence:** `backend/app/videos/service.py:99-153`; `backend/app/providers/ytdlp_provider.py:215`.
- **Root Cause:** No `asyncio.Semaphore` for concurrent downloads and no job state guard.
- **Severity:** Medium
- **Recommended Solution:** Add a download concurrency semaphore, lock/guard `job.status` in `open_download`, and enforce `/tmp` cleanup on startup.

### SEC-005 — `x-powered-by: Next.js` Header Exposed & Compose Port Mismatch
- **Page / Component:** `frontend/next.config.ts` & `compose.yaml`
- **URL / File Path:** Live `https://bestdownloader.site/` headers, `compose.yaml:26`, `.env.example:3`
- **Problem Description:** Live responses expose `x-powered-by: Next.js`. Additionally, `compose.yaml:26` defaults `FRONTEND_PORT` to `8082` while `.env.example:3` and `AGENTS.md` document `8080`.
- **Expected Behavior:** Disable `poweredByHeader` and keep port defaults consistent across Compose and docs.
- **Actual Behavior:** `x-powered-by: Next.js` is sent on every response.
- **Severity:** Low
- **Recommended Solution:** Set `poweredByHeader: false` in `frontend/next.config.ts` and align `compose.yaml` / `.env.example`.

### SEC-006 — Test Suite Not Runnable in Current Environment (`pytest` Missing)
- **Page / Component:** `backend/tests/`
- **URL / File Path:** `backend/tests/` (10 test modules)
- **Problem Description:** No `.venv` or `pytest` is installed in the local Python 3.14 environment, so backend tests could not be executed locally.
- **Severity:** Low
- **Recommended Solution:** Create `backend/.venv` and install `requirements-dev.txt` to run `pytest`.
