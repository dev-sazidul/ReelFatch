# FAQ & Content Quality Audit — ReelFetch

**Audit Date:** 2026-11-23  
**Scope:** Homepage copy, `homeFaq`, `moreFaq`, all 7 platform pages (`platforms.json`), 5 blog posts (`blogs.ts`), and legal/info pages (`info-pages.tsx`).

---

## 1. FAQ Audit (`frontend/src/content/site.ts` & `platforms.json`)

### Confirmed Problems in FAQs

1. **Overstated Platform Support Claim (`homeFaq[1]`):**
   - **Text:** *"ReelFetch has pages for public videos on YouTube, Instagram, TikTok, Facebook, X, Reddit, and Pinterest. A link on another site may still be checked, but only a returned video file can be saved."*
   - **Reality:** In live testing on `https://bestdownloader.site/`, 6 of the 7 listed platforms (YouTube, Instagram, TikTok, X, Reddit, Pinterest) failed with HTTP 502.
2. **Misleading Quality Selection Claims (`homeFaq[0]`, `homeFaq[3]`, and all 7 platform FAQs):**
   - **Text:** *"Then download a quality that is actually listed"*, *"Full HD is included only when that video offers it."*
   - **Reality:** `YtDlpVideoProvider` (`ytdlp_provider.py:180-188`) only ever returns a single quality (`"Original file"`), never offering selectable resolutions (360p/720p/1080p).
3. **Inaccurate Reddit Audio Claim (`platforms.json:204`):**
   - **Text:** *"Some Reddit videos store picture and sound separately. A combined file is available only when the server can prepare one from what Reddit returns."*
   - **Reality:** `backend/Dockerfile` does not install `ffmpeg` and `ytdlp_provider.py` does not configure `ffmpeg_location` from `imageio-ffmpeg`, plus Reddit lookup currently fails with HTTP 502.
4. **Repetitive Platform FAQs (`platforms.json`):**
   - Every single platform page has 3 nearly identical template-style FAQs: (1) "Can ReelFetch download X?", (2) "Are private posts supported?" / "Is every post a video?", (3) "Is ReelFetch affiliated with X?". This offers minimal unique value per page.
5. **Missing Essential User Questions:**
   - No FAQ covers: maximum file size limit (`512 MB`), supported output formats/codecs, why a `502` or `504` timeout happens, mobile iOS Safari download behavior (Files app vs Photos app), or browser extension privacy/usage.
6. **Contradiction on Browser Extensions (`moreFaq[0]` vs `privacy`):**
   - `moreFaq[0]` (`site.ts:34-35`) states *"No software, app downloads, or browser extensions required"*, while `PrivacyPage` (`info-pages.tsx:130`) references *"The optional ReelFetch browser extension"*, and `chrome-extension/` exists in the repo without being linked or explained in the FAQ.

---

## 2. Content Quality Audit (Page by Page)

| Section / Page | Assessment | Details |
|---|---|---|
| **Homepage Copy (`site.ts`, `home.tsx`)** | **Thin / Repetitive** | Very brief utility copy. Includes `InterfacePreview` ("Sample result layout" / "Demo data") which looks like a dev/QA placeholder. |
| **Platform Pages (`platforms.json`)** | **Thin & Templated** | All 7 pages follow the exact same 3-step template + 1-sentence note + 3 generic FAQs (~150–200 words each) with **no embedded tool** and no platform-specific troubleshooting. |
| **Blog Posts (`blogs.ts`, 5 articles)** | **AI-Templated / Promotional** | Each ~800–1,000 word article is well-written technically, **but every single article** follows an identical 4-link promotional funnel pushing `ReelFetch` -> `BestConvert` -> `ImageCustomize` -> `FutureSolutionAI` in the exact same order, reading as SEO/link-building boilerplate rather than organic editorial content. |
| **About Page (`info-pages.tsx`)** | **Promotional / Thin** | Short page heavily promoting `FutureSolutionAI`, `BestConvert`, and `ImageCustomize`. |
| **Privacy / Terms / Copyright** | **Thin / Incomplete** | 3–4 short paragraphs each; lacks GDPR/CCPA rights, cookie consent details, data retention durations, operator legal entity/address, and uses `@reelfetch.com` emails on `bestdownloader.site`. |
| **Structured Data (`structured-data.ts`)** | **Misleading Claim** | `getWebsiteJsonLd()` (`L41`) claims support for *"1,000+ sites"* even though only 7 are listed and 6/7 currently fail. |

---

## 3. Specific Issues

### CNT-001 — Misleading "1,000+ sites" Claim in JSON-LD & Unsupported Platform Claims in Copy
- **Page / Component:** `structured-data.ts`, `site.ts`, `platforms.json`
- **URL / File Path:** `frontend/src/lib/structured-data.ts:41`, `frontend/src/content/site.ts:11-12`
- **Problem Description:** Copy and schema claim broad multi-platform & "1,000+ sites" support while 6/7 named platforms fail in production.
- **Expected Behavior:** Documentation and schema should accurately match working functionality.
- **Actual Behavior:** Overstated claims that contradict live behavior.
- **Evidence:** `structured-data.ts:41` vs live API tests.
- **Root Cause:** Aspirational marketing/SEO copy not verified against production.
- **Severity:** High
- **Recommended Solution:** Remove "1,000+ sites" claim and update platform copy/FAQs to reflect actual working capabilities.

### CNT-002 — Repetitive Cross-Promotional Funnel Across All 5 Blog Posts
- **Page / Component:** `blogs.ts` & `BlogPostPage`
- **URL / File Path:** `frontend/src/data/blogs.ts:14-404`, `frontend/src/app/blog/[slug]/page.tsx:101-138`
- **Problem Description:** All 5 blog articles repeat the exact same 3 external tool plugs (`BestConvert`, `ImageCustomize`, `FutureSolutionAI`) in their body, author card, and ecosystem box, plus link to `/platform/*` pages that don't work.
- **Expected Behavior:** Original, user-first editorial articles that solve real problems without repetitive self-promotional link blocks.
- **Actual Behavior:** Formulaic "4-tool ecosystem" funnel in every post.
- **Evidence:** `frontend/src/data/blogs.ts:75, 143, 207, 270, 401`.
- **Root Cause:** Blog posts were written primarily as cross-linking vehicles for the FutureSolutionAI ecosystem.
- **Severity:** High
- **Recommended Solution:** Rewrite/expand articles with genuine, unique tutorials, screenshots, and troubleshooting, and reduce repetitive external promotional CTAs.
