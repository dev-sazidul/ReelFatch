# Complete Website Audit — ReelFetch (`https://bestdownloader.site/`)

**Audit Date:** 2026-11-23  
**Scope:** Live site (`https://bestdownloader.site/`) HTTP/HTML/API inspection + complete `frontend/` and `backend/` source code audit.  
**Note on Browser Automation:** Live Chrome DevTools could not attach because `DevToolsActivePort` was unavailable (Chrome remote debugging was not enabled). Interactive visual rendering and client-side JS execution in live Chrome are marked as **Unable to Verify** where applicable; all HTTP responses, HTML output, API calls, and source code behaviors were directly observed.

---

## 1. Site & Page Inventory

| Route / Asset | Live HTTP Status | Response Time | H1 Count | Notes |
|---|---|---|---|---|
| `/` | 200 | 1.12s | 1 | Homepage + Downloader Tool + Sample Preview + Ecosystem + Platforms + How It Works + Features + Devices + FAQ |
| `/about` | 200 | 0.39s | 1 | About ReelFetch + FutureSolutionAI / BestConvert / ImageCustomize callout |
| `/contact` | 200 | 0.32s | 1 | Static email card (`support@reelfetch.com`), no contact form |
| `/privacy` | 200 | 0.32s | 1 | Brief 4-section policy; references `G-V30LSQ672C`, Microsoft Clarity, AdSense |
| `/terms` | 200 | 0.39s | 1 | Brief 4-section generic Terms of Service |
| `/copyright` | 200 | 0.32s | 1 | Brief 3-section DMCA policy (`dmca@reelfetch.com`) |
| `/faq` | 200 | 0.49s | 1 | 10-question FAQ accordion + platform links |
| `/blog` | 200 | 0.32s | 1 | 5 articles; heavy cross-promotion of FutureSolutionAI / BestConvert / ImageCustomize |
| `/blog/[slug]` (5 posts) | 200 | ~0.35s | 1 | Article view + author card + ecosystem box + related posts |
| `/platform/facebook` | 200 | 0.38s | 1 | Status: Available |
| `/platform/youtube` | 200 | 0.35s | 1 | Status: Available (but live lookup fails with 502) |
| `/platform/tiktok` | 200 | 0.30s | 1 | Status: Available (but live lookup fails with 502) |
| `/platform/instagram` | 200 | 0.34s | 1 | Status: Available (but live lookup fails with 502) |
| `/platform/x` | 200 | 0.37s | 1 | Status: Available (but live lookup fails with 502) |
| `/platform/pinterest` | 200 | 0.36s | 1 | Status: Available (but live lookup fails with 502) |
| `/platform/reddit` | 200 | 0.40s | 1 | Status: Available (but live lookup fails with 502) |
| `/robots.txt` | 200 | 0.33s | — | Allows `/`, disallows `/api/`, points to `sitemap.xml` |
| `/sitemap.xml` | 200 | 0.26s | — | 21 URLs |
| `/ads.txt` | 200 | 0.28s | — | `google.com, pub-5871594289590523, DIRECT, f08c47fec0942fa0` |
| `/manifest.webmanifest` | 200 | 0.36s | — | PWA manifest |
| `/sw.js` | 200 | 0.72s | — | Service worker |

---

## 2. Identified Issues

### WEB-001 — Brand Name vs. Domain Name & Email Mismatch
- **Page / Component:** Site-wide (`brand.ts`, `info-pages.tsx`, `site-shell.tsx`)
- **URL / File Path:** `https://bestdownloader.site/contact`, `https://bestdownloader.site/copyright`, `frontend/src/config/brand.ts:5-7`, `frontend/src/views/info-pages.tsx:108-109, 152`
- **Problem Description:** The live domain is `bestdownloader.site`, while the brand name is `ReelFetch` and all contact/DMCA emails use `@reelfetch.com` (`support@reelfetch.com`, `dmca@reelfetch.com`).
- **Expected Behavior:** Brand name, domain, and support/DMCA email addresses should be consistent and verifiably tied to the operating domain.
- **Actual Behavior:** Users see `bestdownloader.site` in the address bar, `ReelFetch` in the UI, and `support@reelfetch.com` / `dmca@reelfetch.com` on trust pages.
- **Evidence:** `frontend/src/config/brand.ts:5-7`; `frontend/src/views/info-pages.tsx:109, 152`.
- **Root Cause:** Brand migration/domain change to `bestdownloader.site` left legacy `reelfetch.com` emails and brand copy in place.
- **Severity:** High
- **Recommended Solution:** Align support/DMCA emails with the active domain (or clearly document the relationship) and ensure email inboxes are actively monitored.

### WEB-002 — 6 of 7 Advertised Platforms Fail Live Lookup with HTTP 502 (Cloudflare Origin Bad Gateway)
- **Page / Component:** Homepage Downloader Tool (`HeroSection` / `VideoUrlForm`) & `/api/videos/lookup`
- **URL / File Path:** `https://bestdownloader.site/api/videos/lookup`, `backend/app/providers/ytdlp_provider.py:146, 151`, `frontend/src/services/backend-api.ts:90-96`
- **Problem Description:** Testing all 7 advertised platforms on the live site showed only Facebook succeeding; YouTube, TikTok, Instagram, X, Pinterest, and Reddit all returned HTTP 502 with Cloudflare's `Error 502: Bad gateway` payload.
- **Expected Behavior:** Public video URLs on all advertised platforms should resolve and return metadata/qualities, or return a clear JSON 4xx/5xx error message from the backend.
- **Actual Behavior:** Cloudflare intercepts HTTP 502 responses from the origin and replaces the JSON body with Cloudflare's `origin_bad_gateway` error; the frontend falls back to `"The server returned HTTP 502."`.
- **Evidence:** Live `POST https://bestdownloader.site/api/videos/lookup` tests on 2026-11-23 (see `PLATFORM_FUNCTIONALITY_REPORT.md`).
- **Root Cause:** `ytdlp_provider.py` raises `ApiError(502, ...)` on `DownloadError`/exceptions, and Cloudflare's proxy replaces origin `502` responses with its own gateway error page/JSON; additionally `backend/Dockerfile` lacks Node.js for `yt-dlp` JS runtimes.
- **Severity:** Critical
- **Recommended Solution:** Fix `yt-dlp` runtime dependencies (Node.js, updated extractors, residential/proxy or platform-compliant handling) and avoid returning raw HTTP `502` to Cloudflare for expected lookup failures (use `422`/`400`/`404` or `503` with JSON body).

### WEB-003 — `detectPlatformUrl()` Never Returns `unsupported`, Leaving Dead Code and Misleading UX
- **Page / Component:** `detectPlatformUrl`, `useVideoLookup`, `InterfacePreview`
- **URL / File Path:** `frontend/src/data/platforms.ts:72-122`, `frontend/src/hooks/use-video-lookup.ts:84-89`, `frontend/src/components/interface-preview.tsx:10`
- **Problem Description:** `detectPlatformUrl` fabricates a `genericPlatform` for any valid `http://`/`https://` URL instead of returning `{ kind: 'unsupported' }`.
- **Expected Behavior:** Either unsupported domains are rejected client-side (matching the form hint and demo preview's "Unsupported URL" state) or the UI explicitly communicates universal URL support.
- **Actual Behavior:** Any URL (e.g., `https://google.com`) is treated as "recognized" and sent to `/api/videos/lookup`, making `detection.kind === 'unsupported'` dead code.
- **Evidence:** `frontend/src/data/platforms.ts:94-118`; `frontend/src/hooks/use-video-lookup.ts:84-89`.
- **Root Cause:** A generic fallback was added to `detectPlatformUrl` without updating `useVideoLookup` or `InterfacePreview`.
- **Severity:** Medium
- **Recommended Solution:** Decide whether non-listed domains are supported; if not, return `{ kind: 'unsupported' }` for non-matching hosts.

### WEB-004 — Hardcoded "Facebook link" Message in Clipboard Paste Handler
- **Page / Component:** `useVideoLookup` (`pasteUrl`)
- **URL / File Path:** `frontend/src/hooks/use-video-lookup.ts:52`
- **Problem Description:** When the user clicks **Paste** with an empty clipboard, the warning says: `"Your clipboard is empty. Copy a Facebook link, then try Paste again."`
- **Expected Behavior:** Platform-agnostic message (`"Copy a video link, then try Paste again."`).
- **Actual Behavior:** Mentions only Facebook despite advertising 7 platforms.
- **Evidence:** `frontend/src/hooks/use-video-lookup.ts:52`.
- **Root Cause:** Leftover copy from when the app was Facebook-only.
- **Severity:** Low
- **Recommended Solution:** Update copy to `"Your clipboard is empty. Copy a public video link, then try Paste again."`

### WEB-005 — Platform Pages Link to Homepage `#tool` Instead of Embedding the Downloader
- **Page / Component:** `PlatformPage`
- **URL / File Path:** `https://bestdownloader.site/platform/*`, `frontend/src/views/platform-page.tsx:49-51`
- **Problem Description:** Individual platform pages (`/platform/youtube`, `/platform/tiktok`, etc.) do not include the downloader input form; they only render a button `"Open the downloader"` linking to `/#tool`.
- **Expected Behavior:** Users landing on `/platform/youtube` from search should be able to paste and download directly on that page.
- **Actual Behavior:** Users must click away to `/#tool`, making platform pages feel like thin doorway/guide pages.
- **Evidence:** `frontend/src/views/platform-page.tsx:49-51`.
- **Root Cause:** `HeroSection` / `VideoUrlForm` is only mounted in `frontend/src/views/home.tsx`.
- **Severity:** Medium
- **Recommended Solution:** Embed `VideoUrlForm` (pre-configured/hinted for that platform) directly on `/platform/[slug]` pages.

### WEB-006 — Contact Page Has No Interactive Contact Form
- **Page / Component:** `ContactPage`
- **URL / File Path:** `https://bestdownloader.site/contact`, `frontend/src/views/info-pages.tsx:92-121`
- **Problem Description:** The Contact page only displays a static email address (`support@reelfetch.com`) with no clickable `mailto:` link, no contact form, and no physical/company details.
- **Expected Behavior:** A functional contact form or clear, clickable support channels and operator details.
- **Actual Behavior:** Plain text email only.
- **Evidence:** `frontend/src/views/info-pages.tsx:108-110`.
- **Root Cause:** Minimal static implementation.
- **Severity:** Low
- **Recommended Solution:** Add a working contact form (with spam protection) and `mailto:` link, plus clear operator information.

### WEB-007 — `LegalPage` Footer Displays Dynamic Current Year as "Last updated"
- **Page / Component:** `LegalPage` (`/privacy`, `/terms`, `/copyright`)
- **URL / File Path:** `frontend/src/views/info-pages.tsx:170-172`
- **Problem Description:** `Last updated: {new Date().getFullYear()} ReelFetch` renders only the current year dynamically rather than an actual policy revision date.
- **Expected Behavior:** An explicit, static `Last updated: YYYY-MM-DD` date reflecting when the policy was actually reviewed.
- **Actual Behavior:** Dynamically prints the current year on every render.
- **Evidence:** `frontend/src/views/info-pages.tsx:171`.
- **Root Cause:** Hardcoded `new Date().getFullYear()`.
- **Severity:** Low
- **Recommended Solution:** Replace with an explicit static effective/updated date (e.g., `November 2026`).

### WEB-008 — Unused `DraftNotice` Component and Demo Preview Clutter on Homepage
- **Page / Component:** `InterfacePreview` / `info-pages.tsx`
- **URL / File Path:** `https://bestdownloader.site/`, `frontend/src/components/interface-preview.tsx:20-104`, `frontend/src/views/info-pages.tsx:26-28`
- **Problem Description:** `InterfacePreview` ("Sample result layout" with "Demo data" and a dropdown of 10 error/loading states) is exposed directly below the main downloader tool on the production homepage. Meanwhile, `DraftNotice` exists as unused code in `info-pages.tsx`.
- **Expected Behavior:** Production homepage should present a clean, finished tool without developer/QA state-preview widgets.
- **Actual Behavior:** Users see a "Preview sample layout" toggle with "Demo data" and "Unavailable" quality buttons, which can confuse visitors into thinking it's a demo/unfinished site.
- **Evidence:** `frontend/src/components/interface-preview.tsx:20-104`, `frontend/src/views/home.tsx:35`.
- **Root Cause:** Development/QA preview widget left enabled in production `HomePage`.
- **Severity:** Medium
- **Recommended Solution:** Remove `InterfacePreview` from the production homepage (or gate it behind dev mode) and clean up unused `DraftNotice`.
