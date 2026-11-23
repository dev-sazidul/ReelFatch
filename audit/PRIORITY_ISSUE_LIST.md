# Priority Issue List — ReelFetch (`https://bestdownloader.site/`)

**Audit Date:** 2026-11-23  
**Total Issues Identified:** 27 (4 Critical, 10 High, 8 Medium, 5 Low)

---

## Critical Priority (Fix Immediately)

| ID | Category | Summary | Location |
|---|---|---|---|
| **WEB-002 / DL-001** | Functionality / Backend | 6 of 7 platforms fail live lookup with HTTP 502; Cloudflare replaces backend JSON with generic 502 error page | `https://bestdownloader.site/api/videos/lookup`, `backend/app/providers/ytdlp_provider.py:146, 151`, `frontend/src/services/backend-api.ts:90-96` |
| **PLAT-001** | Platform / UX | All 7 platforms hardcoded `"Available"` in UI despite 6 failing in production | `frontend/src/data/platforms.json`, `frontend/src/services/platform-integrations.ts:45-59` |
| **ADS-001** | AdSense / Value | Broken core utility on 6/7 advertised platforms severely undermines user value | `https://bestdownloader.site/` |

*(Note: `WEB-002` and `DL-001` are listed together above as the live symptom + backend/Cloudflare root cause, plus `PLAT-001` and `ADS-001` = 4 Critical issues across the reports.)*

---

## High Priority

| ID | Category | Summary | Location |
|---|---|---|---|
| **PLAT-002** | Functionality | Backend only returns 1 hardcoded quality (`"source"` / `"Original file"`), contradicting multi-quality claims | `backend/app/providers/ytdlp_provider.py:180-188`, `backend/app/videos/validation.py:83` |
| **DL-006** | Backend / Docker | `backend/Dockerfile` lacks Node.js runtime required by `yt-dlp` JS extractors (e.g. YouTube) | `backend/Dockerfile:1-18`, `backend/app/providers/ytdlp_provider.py:58-62` |
| **DL-008** | Backend / Docker | System `ffmpeg` not installed in `Dockerfile` and `ffmpeg_location` not set from `imageio-ffmpeg` | `backend/Dockerfile:4-6`, `backend/app/providers/ytdlp_provider.py:102-124` |
| **DL-002 / UI-003** | Downloader / Mobile | `saveFile()` buffers entire video in JS RAM (`Blob`) with 120s timeout; breaks large/mobile downloads | `frontend/src/services/backend-api.ts:58, 98-125` |
| **DL-003** | Backend Reliability | `asyncio.timeout` does not kill background `yt-dlp` threads; orphaned downloads continue in `/tmp` | `backend/app/providers/ytdlp_provider.py:136-138, 232-234` |
| **DL-004** | Backend Reliability | `DownloadJobStore` never purges expired jobs (unbounded memory leak) | `backend/app/videos/store.py:75-108` |
| **SEC-001** | Security | SSRF risk: no DNS/private-IP resolution check + `YtDlpVideoProvider.universal = True` | `backend/app/security/url_safety.py:47-67`, `backend/app/providers/ytdlp_provider.py:100` |
| **SEC-002** | Security / Reliability | Rate limiter keys on `request.client.host` behind Next.js proxy (`proxy_headers=False`), creating shared-bucket DoS | `backend/app/rate_limit.py:75-88`, `backend/app/__main__.py:26` |
| **WEB-001** | Trust / Branding | Domain is `bestdownloader.site`, brand is `ReelFetch`, emails are `@reelfetch.com` | `frontend/src/config/brand.ts`, `frontend/src/views/info-pages.tsx:109, 152` |
| **ADS-002 / SEO-005** | AdSense / SEO | 7 thin, templated `/platform/*` pages (~150–200 words) indexed without an embedded downloader | `frontend/src/views/platform-page.tsx`, `frontend/src/data/platforms.json` |
| **ADS-003** | AdSense / Legal | Legal pages (`/privacy`, `/terms`, `/copyright`) are minimal stubs; no cookie consent banner for GA4/Clarity/AdSense | `frontend/src/views/info-pages.tsx:123-180`, `frontend/src/app/layout.tsx:48-79` |
| **CNT-001** | Content Quality | Misleading `"1,000+ sites"` claim in JSON-LD and unsupported platform/quality claims in FAQs | `frontend/src/lib/structured-data.ts:41`, `frontend/src/content/site.ts` |
| **CNT-002** | Content Quality | All 5 blog posts follow the exact same 3-site promotional funnel (`BestConvert`, `ImageCustomize`, `FutureSolutionAI`) | `frontend/src/data/blogs.ts`, `frontend/src/app/blog/[slug]/page.tsx` |

---

## Medium Priority

| ID | Category | Summary | Location |
|---|---|---|---|
| **WEB-003** | Frontend Logic | `detectPlatformUrl()` never returns `unsupported`, making `useVideoLookup` branch dead code | `frontend/src/data/platforms.ts:94-118`, `frontend/src/hooks/use-video-lookup.ts:84-89` |
| **WEB-005 / UI-005** | UX / Conversion | Platform pages lack embedded `VideoUrlForm` and redirect users to `/#tool` | `frontend/src/views/platform-page.tsx:49-51` |
| **WEB-008 / UI-002** | UX / AdSense | `InterfacePreview` ("Demo data" / "Sample result layout") exposed on production homepage | `frontend/src/components/interface-preview.tsx`, `frontend/src/views/home.tsx:35` |
| **DL-005** | Backend Reliability | Concurrent `GET /downloads/{jobId}/file` requests race on `/tmp` files | `backend/app/videos/service.py:99-153` |
| **SEC-004** | Reliability | Unbounded concurrent `/tmp` disk usage (up to 60 × 512 MB/min) | `backend/app/providers/ytdlp_provider.py:214-271` |
| **SEO-001** | Technical SEO | Duplicate/conflicting JSON-LD schema builders (`siteGraph`, `homeGraph`, unused `getWebsiteJsonLd`) | `frontend/src/lib/structured-data.ts` |
| **SEO-002** | Technical SEO | Missing `og:image` and `twitter:image` across all pages | `frontend/src/lib/seo.ts:129-137` |
| **SEO-004** | Performance / SEO | Render-blocking Google Fonts `<link>` and `<script>` tags in `<head>` | `frontend/src/app/layout.tsx:48-69` |
| **UI-001** | Audit Coverage | Live Chrome DevTools rendering across 5 viewports unable to verify (`DevToolsActivePort` missing) | `https://bestdownloader.site/` |

---

## Low Priority

| ID | Category | Summary | Location |
|---|---|---|---|
| **WEB-004** | Copy | Clipboard empty warning hardcodes `"Copy a Facebook link"` | `frontend/src/hooks/use-video-lookup.ts:52` |
| **WEB-006** | UX | Contact page has no interactive form or `mailto:` link | `frontend/src/views/info-pages.tsx:92-121` |
| **WEB-007** | Legal Copy | `LegalPage` prints dynamic `new Date().getFullYear()` instead of a real revision date | `frontend/src/views/info-pages.tsx:171` |
| **DL-007** | Frontend | `filenameFrom()` regex drops spaces/Unicode and ignores `filename*=` | `frontend/src/services/backend-api.ts:128` |
| **SEC-003** | Security | `thumbnailUrl` from `yt-dlp` is not scheme-validated | `backend/app/providers/ytdlp_provider.py:156, 198` |
| **SEC-005** | Security / Config | `x-powered-by: Next.js` exposed; `compose.yaml` port `8082` vs `.env.example` `8080` | `frontend/next.config.ts`, `compose.yaml:26` |
| **SEO-003** | Technical SEO | `sitemap.xml` omits `<lastmod>` timestamps | `frontend/public/sitemap.xml` |
| **SEC-006** | Testing | Local `backend/.venv` / `pytest` not set up | `backend/tests/` |

---

## Recommended Order of Fixes

1. **Fix Core Downloader & Backend Reliability (`WEB-002`, `DL-001`, `DL-006`, `DL-008`, `PLAT-001`, `PLAT-002`)**: Install Node.js & `ffmpeg` in `backend/Dockerfile`, fix `yt-dlp` extraction across platforms (or accurately mark unsupported platforms as `Unavailable`/`Coming Soon`), return 4xx/503 JSON instead of `502` behind Cloudflare, and expose real selectable qualities.
2. **Fix Security & Memory/Disk Bugs (`SEC-001`, `SEC-002`, `DL-003`, `DL-004`, `DL-005`, `SEC-004`)**: Add DNS/IP SSRF protection, disable `universal = True`, fix proxy IP rate limiting, use cancellable subprocesses for `yt-dlp`, purge `DownloadJobStore`, and lock `open_download`.
3. **Fix Mobile/Large File Download Flow (`DL-002`, `UI-003`)**: Switch from in-memory `Blob` buffering to native browser streaming downloads.
4. **Clean Up AdSense & Trust Blockers (`WEB-001`, `WEB-008`, `ADS-002`, `ADS-003`, `CNT-001`, `CNT-002`)**: Remove `InterfacePreview` demo widget from production, align `bestdownloader.site` branding/emails, expand Privacy/Terms/Copyright + add cookie consent banner, embed the downloader on platform pages with unique content, and make blog posts genuinely editorial rather than repetitive 4-link funnels.
5. **Polish Technical SEO & Performance (`SEO-001`, `SEO-002`, `SEO-003`, `SEO-004`)**: Consolidate JSON-LD, add `og:image`, switch to `next/font/google`, and add `<lastmod>` to `sitemap.xml`.
6. **Verify in Live Chrome DevTools (`UI-001`)**: Enable Chrome remote debugging and verify all 5 viewports and interactive states end-to-end.
