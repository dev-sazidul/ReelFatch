# Technical SEO Audit — ReelFetch (`https://bestdownloader.site/`)

**Audit Date:** 2026-11-23  
**Scope:** Live HTML/headers (`https://bestdownloader.site/`), `robots.txt`, `sitemap.xml`, `seo.ts`, `structured-data.ts`, `layout.tsx`, `page.tsx`.

---

## 1. Live Crawl & Metadata Summary

- **HTTP Statuses:** All 21 sitemap URLs + `/robots.txt` + `/sitemap.xml` + `/ads.txt` returned HTTP `200`.
- **Titles & Meta Descriptions:** Unique per route via `buildMetadata()` (`frontend/src/lib/seo.ts:116-139`).
- **H1 Structure:** Exactly 1 `<h1>` per page across all audited routes.
- **Canonical URLs:** Present on all pages (`https://bestdownloader.site` for `/`, `https://bestdownloader.site/<path>` for subpages).
- **Robots.txt:** Valid (`Allow: /`, `Disallow: /api/`, `Sitemap: https://bestdownloader.site/sitemap.xml`).
- **XML Sitemap:** Valid, 21 URLs, all pointing to `https://bestdownloader.site`.
- **Open Graph & Twitter Cards:** Present (`og:title`, `og:description`, `og:url`, `og:site_name`, `twitter:card`).

---

## 2. Identified Technical SEO Issues

### SEO-001 — Duplicate / Conflicting JSON-LD Schema Definitions & Unused `getWebsiteJsonLd()`
- **Page / Component:** `structured-data.ts`, `RootLayout`, `HomePage`
- **URL / File Path:** `frontend/src/lib/structured-data.ts:28-72, 143-181`, `frontend/src/app/layout.tsx:71`, `frontend/src/app/page.tsx:11`
- **Problem Description:** `layout.tsx` renders `siteGraph()` (Organization `ReelFetch`, `support@reelfetch.com`, `WebSite`), while `page.tsx` renders `homeGraph()` (`SoftwareApplication` + `FAQPage`). Meanwhile, `getWebsiteJsonLd()` (`structured-data.ts:28-72`) defines a completely different `WebApplication` + `WebSite` + `FutureSolutionAI` Organization (with `"1,000+ sites"` and `SearchAction`) that is unused, creating conflicting/dead schema code.
- **Expected Behavior:** One clean, consistent `@graph` schema hierarchy without conflicting organization/website entities or dead schema builders.
- **Actual Behavior:** `siteGraph()` and `homeGraph()` emit separate `@context` blocks without `@id` linking, and `getWebsiteJsonLd()` is dead code.
- **Evidence:** `frontend/src/app/layout.tsx:71`; `frontend/src/app/page.tsx:11`; `frontend/src/lib/structured-data.ts:28-72`.
- **Root Cause:** Multiple iterations of `structured-data.ts` merged together.
- **Severity:** Medium
- **Recommended Solution:** Consolidate into a single consistent `@id`-linked schema graph and remove unused `getWebsiteJsonLd()`.

### SEO-002 — Missing `og:image` and `twitter:image` Across All Pages
- **Page / Component:** `buildMetadata()`
- **URL / File Path:** `frontend/src/lib/seo.ts:129-137`
- **Problem Description:** `openGraph` and `twitter` metadata do not specify an `images` array (`og:image` / `twitter:image`).
- **Expected Behavior:** Every indexable page should include a valid 1200×630 `og:image` for social sharing and rich previews.
- **Actual Behavior:** No `og:image` is emitted; `twitter:card` is only `summary` without an image.
- **Evidence:** `frontend/src/lib/seo.ts:129-137`.
- **Root Cause:** Omitted from `buildMetadata()`.
- **Severity:** Medium
- **Recommended Solution:** Create a social share image (e.g., `/og-image.png`) and add `images` to `openGraph` and `twitter` in `buildMetadata()`.

### SEO-003 — Static `sitemap.xml` Lacks `<lastmod>` and Does Not Dynamically Reflect Blog/Platform Updates
- **Page / Component:** `sitemap.xml` & `generate-seo-assets.mjs`
- **URL / File Path:** `https://bestdownloader.site/sitemap.xml`, `frontend/public/sitemap.xml`
- **Problem Description:** `sitemap.xml` omits `<lastmod>` dates (even though blog posts have `updatedAt` dates in `blogs.ts`).
- **Expected Behavior:** Include accurate `<lastmod>` timestamps for content pages and blog posts.
- **Actual Behavior:** Only `<loc>`, `<changefreq>`, and `<priority>` are present.
- **Evidence:** `frontend/public/sitemap.xml:1-108`.
- **Root Cause:** Generator script does not emit `<lastmod>`.
- **Severity:** Low
- **Recommended Solution:** Add `<lastmod>` to `generate-seo-assets.mjs` (or migrate to Next.js `app/sitemap.ts`).

### SEO-004 — Render-Blocking External Google Fonts & Tracking Scripts in `<head>`
- **Page / Component:** `RootLayout`
- **URL / File Path:** `frontend/src/app/layout.tsx:48-69`
- **Problem Description:** `<head>` loads Google Tag Manager (`gtag/js`), Google Fonts stylesheet, and `adsbygoogle.js` directly in `<head>`, plus Microsoft Clarity via `Script`. Note also `x-powered-by: Next.js` header is exposed on live responses.
- **Expected Behavior:** Use `next/font/google` for zero-layout-shift self-hosted `Inter` font, defer non-critical third-party scripts, and disable `poweredByHeader`.
- **Actual Behavior:** External Google Fonts CSS request in `<head>` adds render-blocking latency; live homepage TTFB was `1.12s` (vs `0.3s` on subpages).
- **Evidence:** `frontend/src/app/layout.tsx:48-69`; live `curl -sI` output (`x-powered-by: Next.js`).
- **Root Cause:** Manual `<link>` and `<script>` tags in `layout.tsx`.
- **Severity:** Medium
- **Recommended Solution:** Switch to `next/font/google`, set `poweredByHeader: false` in `next.config.ts`, and use `next/script` `strategy="lazyOnload"` or `afterInteractive` for ads/analytics.

### SEO-005 — Thin / Low-Word-Count Platform Pages Indexed in Sitemap
- **Page / Component:** `/platform/*`
- **URL / File Path:** `https://bestdownloader.site/platform/facebook` .. `reddit`
- **Problem Description:** All 7 platform pages are `index, follow` and in `sitemap.xml`, despite having ~150–200 words of templated text and 6/7 failing in production.
- **Expected Behavior:** Only indexable pages with substantial, working, unique value should be indexed.
- **Actual Behavior:** Thin templated pages are indexed.
- **Evidence:** `frontend/src/data/platforms.json`, `frontend/public/sitemap.xml:74-106`.
- **Root Cause:** All platforms set to `Available` in `platforms.json`.
- **Severity:** High
- **Recommended Solution:** `noindex` non-working platform pages until fixed, and enrich working platform pages with unique content and an embedded downloader.

### SEO-006 — Core Web Vitals & Mobile Usability
- **Status:** **Unable to Verify** live CWV metrics (LCP, CLS, INP) in Chrome DevTools because Chrome remote debugging was not enabled. Live server TTFB measured via `curl` was `1.12s` on `/` and `0.26s–0.49s` on subpages.
