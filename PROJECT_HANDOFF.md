# ReelFetch project handoff

Last updated: 2026-10-26. This file is the primary handoff for the next coding agent. The repository is the source of truth if this file and the code disagree. Update this file after each significant change.

The running application is the Vite frontend at the repository root and the NestJS API in `backend/`. Directories `artifacts/` and `lib/` are leftover workspace packages. They are not what `npm run dev` serves.

## 1. Project overview

ReelFetch is a local web app for checking a Facebook video link and downloading a file only when a provider returns a real media URL. The interface is a mobile-first React site named ReelFetch. It is not a Meta product.

Implemented features:

- Paste, clear, and Find Video for a Facebook link.
- Public `HEAD` redirect resolution for share and `fb.watch` links that redirect to a numeric watch, Reel, or `/videos/{id}` URL.
- Optional Graph API lookup when a Page or user token is configured.
- One downloadable quality, labeled "Original file", only when Graph returns a `source` URL on an allowed CDN host.
- Health, lookup, metadata, download-job, and file routes.
- Clear errors for an unresolved link, a login redirect, a missing token, a missing file URL, and an unconfigured platform.
- A labeled homepage sample card. Find Video does not use it.

Long-term goal: add other platforms only where an authorized API can return a file the caller is allowed to save. YouTube, TikTok, and Instagram are registered and intentionally unconfigured. No official file-download API is wired for them.

Stack, from `package.json` and `backend/package.json`:

- Frontend: React 19.1.0, TypeScript, Vite 7, Tailwind 4, wouter.
- Backend: NestJS 11, TypeScript, class-validator, `@nestjs/throttler`.
- Tests: Node's test runner through `tsx`. There is no frontend test script.
- Not installed: Redis, BullMQ, Python, a database used by the running app.

## 2. Current architecture

```text
Browser (Vite, port 5173)
  src/hooks/use-video-lookup.ts
    -> src/services/backend-api.ts
Vite proxy /api/videos and /api/health -> http://127.0.0.1:3000
NestJS
  backend/src/videos/videos.controller.ts
    -> backend/src/videos/videos.service.ts
         -> backend/src/providers/provider-registry.ts
         -> backend/src/providers/facebook/facebook.provider.ts
              1. backend/src/providers/facebook/facebook-redirect.ts
              2. backend/src/providers/facebook/facebook-graph.client.ts
         -> backend/src/videos/video-store.ts
         -> backend/src/security/media-stream.ts
```

`POST /api/lookup-log` is only the Vite dev logger in `vite.lookup-log.ts`. It is not a Nest route.

API routes, prefix `/api`:

- `GET /health` — `backend/src/health/health.controller.ts`
- `POST /videos/lookup`
- `GET /videos/lookups/:lookupId`
- `POST /videos/downloads` — body `lookupId` and `qualityId` (`source` only)
- `GET /videos/downloads/:jobId`
- `GET /videos/downloads/:jobId/file`

Provider registry: `selectProvider` matches the hostname. Facebook hosts are `facebook.com` and `fb.watch`. `futurePlatformProviders()` returns unconfigured YouTube, TikTok, and Instagram adapters.

URL resolver: `resolveFacebookVideoId` in `facebook-redirect.ts`. A numeric id already in the URL returns immediately. Otherwise it sends `HEAD` with `redirect: 'manual'`, at most four hops, user agent `ReelFetch/1.0`, no cookies. It accepts only `https` locations on Facebook, `fb.watch`, or `fb.me`. It reads an id from the redirect URL. It discards the body and does not parse HTML.

Graph adapter: `FacebookGraphClient.getVideo` calls `GET https://graph.facebook.com/{version}/{video-id}?fields=id,name,description,picture,source,format` with `Authorization: Bearer`. The version defaults to `v26.0`. The token is not put in the query string. This call runs only after an id is resolved and a token is configured.

Download flow: lookup stores an in-memory record for `LOOKUP_TTL_MS` (default 10 minutes). Creating a download calls Graph again, checks the CDN allowlist, and stores a job. The file route streams that URL with a size cap and a timeout. Jobs live in `DownloadJobStore`. There is no Redis queue. `backend/src/videos/video-store.ts` notes BullMQ as a later replacement.

Frontend entry points: `src/pages/home.tsx`, `src/components/video-url-form.tsx`, `src/components/video-result-card.tsx`, `src/services/platform-integrations.ts`.

## 3. Completed work

Completed and covered by unit tests:

- Host and URL validation, including rejection of IP hosts, credentials in the URL, and non-HTTP protocols (`backend/src/security/url-safety.ts`).
- Classification of numeric watch, Reel, and `/videos/{id}` links. Share codes and `fb.watch` paths are not treated as ids by themselves (`facebook-url.ts`).
- Redirect fixtures for a share link, an `fb.watch` link, a login URL, HTTP 429, and an off-platform redirect.
- Graph error mapping for token rejection, permission denial, and redaction of the token.
- A Graph `source` URL is not copied into the public lookup JSON. A non-CDN `source` is refused.
- Empty `authorized` qualities throw `VIDEO_NOT_AVAILABLE` instead of a successful empty result.

Previously verified live on 2026-10-26, not re-run while writing this file:

- `HEAD` of `https://www.facebook.com/share/v/1CFYs2VsvF/` redirected to `https://www.facebook.com/reel/1761930238257177`.
- `POST /api/videos/lookup` for that share link returned HTTP 503 `PROVIDER_NOT_CONFIGURED` and included the video id `1761930238257177`.
- `https://fb.watch/abcXYZ/` redirected to `https://www.facebook.com/watch/` and the API returned HTTP 422 `LINK_ID_UNAVAILABLE`.
- Numeric Reel and watch URLs resolve with `via: "url"` and do not require a redirect.
- Frontend `tsc --noEmit` passed earlier the same day. `vite build` passed earlier, before the latest hint-text edit. Re-run the frontend build before treating it as current.

## 4. Current issues

- `backend/.env` is absent. Both Facebook token variables are therefore unset. Lookup of a resolved id returns `PROVIDER_NOT_CONFIGURED`. No Graph request is made.
- A live end-to-end download has never succeeded. No response in this project has been observed to contain a Graph `source` URL, and no browser save of a video file has been verified.
- Share and `fb.watch` links that do not redirect to a numeric id stay unresolved. This was verified for the fake short code above. It is unknown how often real `fb.watch` links redirect to an id from this server.
- The resolver does not retrieve SD/HD files. `format` from Graph is width and height metadata only.
- In-memory lookups and jobs disappear when the API process restarts.
- `artifacts/` and `lib/` can confuse an agent into editing the unused Replit tree.
- The homepage sample card is still demo data. It is labeled and is not the Find Video result. Do not wire it to a real lookup.

## 5. Facebook downloader status

Share-link resolver: implemented in `facebook-redirect.ts` and called first from `FacebookVideoProvider.lookup`. It is URL resolution only.

Numeric ids: `/watch/?v=`, `/watch/{id}`, `/video.php?v=`, `/reel/{id}`, `/reels/{id}`, and `/{page}/videos/{id}` when the id matches `^\d{5,20}$`.

Graph integration: optional second step. Fields requested: `id,name,description,picture,source,format`. Documented by Meta's Video reference as of the 2026-10-26 reading: `source` is a raw file URL only when the token may read that video. Do not treat it as available for every public Reel. This repository has not verified a live `source` response.

Environment variables, names only, from `backend/.env.example`:

- `PORT` (default 3000)
- `CORS_ORIGIN`
- `FACEBOOK_GRAPH_API_VERSION` (default `v26.0`)
- `FACEBOOK_PAGE_ACCESS_TOKEN` — used when set
- `FACEBOOK_USER_ACCESS_TOKEN` — used when the Page token is empty
- `REQUEST_TIMEOUT_MS` (12000)
- `DOWNLOAD_TIMEOUT_MS` (120000)
- `MAX_DOWNLOAD_BYTES` (536870912)
- `RATE_LIMIT_TTL_MS` (60000)
- `RATE_LIMIT_LIMIT` (60)
- `LOOKUP_TTL_MS` (600000)

`facebookAccessToken` in `backend/src/config/app-config.ts` prefers the Page token.

Media URL rule: `isAllowedMediaUrl` in `backend/src/security/url-safety.ts` allows only `https` URLs on `.fbcdn.net` or `.fbsbx.com`, with no userinfo and no IP host. `graph.facebook.com` is not a media host.

Current provider configuration: Facebook code is present, but it is not configured at runtime because `backend/.env` does not exist. YouTube, TikTok, and Instagram are hard-coded as `isConfigured() === false`.

## 6. Latest test results

Re-run on 2026-10-26 while writing this handoff, from `backend/`, using the existing `tsx` install. No packages were installed.

```text
19 tests, 19 pass, 0 fail
```

Files: `api-error.test.ts`, `url-safety.test.ts`, `facebook-url.test.ts`, `facebook-redirect.test.ts`, `facebook.provider.test.ts`, `provider-registry.test.ts`.

These tests use mocks. They do not call the public Facebook network and they do not download a video.

Previously reported, not repeated during this handoff: the live share-link redirect and the live `PROVIDER_NOT_CONFIGURED` API response described in section 3. A successful live end-to-end download has not been verified.

## 7. Environment setup

Requirements: Node.js 22 is what this machine used (`v22.14.0`). npm 10.9.2 can exit during a lockfile-less install; `backend/package-lock.json` and the root `package-lock.json` already exist. Do not print or commit tokens.

Frontend, from the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. The dev server proxies `/api/videos` and `/api/health` to `VITE_DEV_API_PROXY` or `http://127.0.0.1:3000`. Root `.env` is optional. See `.env.example`. `npm run build` typechecks, writes sitemap files, then builds. A missing `VITE_PUBLIC_SITE_URL` only warns.

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm test
npm run build
npm run start:dev
```

`npm start` runs `node dist/main.js` after `npm run build`. Health: `http://127.0.0.1:3000/api/health`. It reports whether a token is set. It must not reveal the token.

No Redis, database, or Python service is required for the current process.

## 8. Pending tasks

1. Configure a permitted token and prove one download. Depends on a Meta app token for a video that token may read, plus a link that resolves to that video's numeric id. Acceptance: `GET /api/health` shows Facebook `configured: true`, lookup returns a quality whose id is `source`, the file response has a video content type, and the browser saves bytes. Do not claim success from a mock.
2. Record, in this file, whether a real `fb.watch` link and a second share link redirect to an id from this server. Depends on nothing but network access. Acceptance: each URL is recorded as `resolved`, `unresolved`, `login_required`, or `unavailable`, without saving a video.
3. If a token is present and Graph returns no `source`, record the error code. Depends on task 1's token. Acceptance: the code is `VIDEO_NOT_AVAILABLE`, `VIDEO_NOT_PERMITTED`, or `PROVIDER_UNAUTHORIZED`, and no file URL was invented.
4. Leave YouTube, TikTok, and Instagram unconfigured until an authorized file API exists. Acceptance: their lookup still returns `PROVIDER_NOT_CONFIGURED` and no scraper is added.
5. Add Redis and BullMQ only if more than one API instance must share jobs or jobs must survive a restart. Depends on a deployment that needs that. Acceptance: the controller still calls a job service, not Redis directly.

## 9. Next steps

The next agent should:

1. Read this file, `AGENTS.md`, and `backend/src/providers/facebook/facebook.provider.ts`.
2. Confirm `backend/.env` is still absent, or that tokens are unset, without printing secrets.
3. Run `npm test` in `backend/` and compare the count with section 6.
4. Do not start with a new downloader design. The missing piece is a permitted token and one observed file response.
5. If the user supplies a token, put it only in `backend/.env`, restart the API, and test a video that account owns. Use a numeric Reel or watch link, or a share link that resolves. Stop if Graph does not return an allowed `source` URL.
6. Update sections 3, 4, 5, and 6 of this file with the observed result.

## 10. Known limitations and security

- A token is not a right to every public Reel. Meta's Video reference requires a Page or user token even for a public video, and `user_videos` for videos that person uploaded or was tagged in. Page videos may withhold `source` unless the caller can administer the Page. Private and login-only videos are not accessible by following a redirect or by guessing an id.
- `LOGIN_REQUIRED` means the redirect target was a login or checkpoint URL. The server does not accept or send Facebook cookies.
- Redirect validation rejects non-HTTPS, userinfo, IP hosts, and non-Facebook hosts. A redirect that never exposes a numeric id is `LINK_ID_UNAVAILABLE`.
- CDN downloads allow `.fbcdn.net` and `.fbsbx.com` only. Other hosts, including `graph.facebook.com`, are refused.
- Logs and error text must redact tokens, cookies, passwords, and `source` URLs. `redactSensitive` and `redactUrl` exist for that. Do not log the Graph request URL.
- The local API rate limit is 60 requests per minute. Facebook's Video-node limit is not a single number in the code. The URL-node limit of 10 reads per URL per app per hour and the oEmbed quotas were read from Meta docs and are not implemented as clients.
- Saving a video the user does not own can violate copyright and Facebook's terms. ReelFetch does not decide ownership.
- `artifacts/` includes an old API and UI. Do not treat it as deployed behavior.

## 11. Decisions and non-goals

Decisions:

- NestJS is enough for one local process. Python, Redis, and BullMQ were not added.
- URL resolution and media availability are separate. An id does not imply a file.
- Only one quality is offered, and only from a real `source` URL.
- FDOWN.net is a comparison, not an API. Its public pages do not document a developer endpoint. Do not call that website as a backend.
- HTML parsing of Facebook pages was rejected. The redirect resolver uses headers only.

Do not assume these work without a new verification:

- Every share link or `fb.watch` link redirects to a numeric id.
- Graph `source` exists for a public Reel posted by someone else.
- `og_object.id` from the Graph URL node is the video id. That was not implemented because the docs call it an object id, not a video id.
- oEmbed returns a downloadable file. The documented fields are embed HTML and player size. It was not integrated.
- The homepage sample card, or a 200 from the lookup route with empty qualities, means a download succeeded. Empty qualities now throw. The sample card is still fake demo data.

## 12. Resume instructions for AI agents

Use this prompt:

```text
Read PROJECT_HANDOFF.md, AGENTS.md, and backend/src/providers/facebook/facebook.provider.ts before changing ReelFetch. Inspect the current repository and verify what is already implemented. Continue from the first unfinished item in section 8. Do not duplicate the redirect resolver, the Graph client, or the Nest routes. Do not parse Facebook HTML, send cookies, invent file URLs, or report a download success unless a live response returns a video file and the browser saves it. Preserve the current UI except for copy required by a behavior change. Do not edit artifacts/ or lib/ unless you first confirm they are on the running path. Do not print secrets. After a significant change, update PROJECT_HANDOFF.md so the completed work, test results, and next step stay accurate.
```
