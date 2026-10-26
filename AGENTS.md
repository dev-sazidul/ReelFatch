# Agent notes

ReelFetch is a React + Vite frontend and a NestJS API in `backend/`. Preserve the current homepage design unless a behavior change requires a copy update.

## Authorized downloads only

- Facebook lookup uses the official Graph API `GET /{video-id}?fields=id,name,description,picture,source,format`.
- Call it only with `FACEBOOK_PAGE_ACCESS_TOKEN` or `FACEBOOK_USER_ACCESS_TOKEN`. Send the token as a Bearer header. Never log the token, cookies, or the `source` URL.
- A share or `fb.watch` link may be resolved by a public HTTPS redirect to a numeric watch, Reel, or videos id. Use `HEAD`, do not send cookies, and discard the body. Do not parse Facebook HTML or invent a file URL.
- If `source` is missing or its host is not `*.fbcdn.net` or `*.fbsbx.com`, return `VIDEO_NOT_AVAILABLE`.
- YouTube, TikTok, and Instagram stay `PROVIDER_NOT_CONFIGURED`. Do not add scrapers or unofficial download libraries.
- The labeled homepage sample card is demo layout data. Find Video must not use it.

## Commands

Frontend, from the repository root:

```bash
npm install
npm run dev
npm run build
```

Backend:

```bash
cd backend
npm install
npm test
npm run build
npm run start:dev
```

The Vite dev server proxies `/api/health` and `/api/videos` to `http://127.0.0.1:3000`. Restart `npm run dev` after changing `vite.config.ts`.
