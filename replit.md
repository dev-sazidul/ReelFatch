# ReelFetch

A responsive, multi-platform video-link interface demo with URL recognition, platform status pages, and a clear separation between illustrative data and authorized service integrations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `VITE_PUBLIC_SITE_URL` — canonical HTTPS origin used to generate sitemap URLs and page metadata

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React, Vite, TypeScript, Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/reelfetch/src/data/platforms.json` — platform names, recognized hostnames, statuses, SEO descriptions, and FAQs
- `artifacts/reelfetch/src/services/platform-integrations.ts` — typed authorized-backend adapter contract; no providers are currently connected
- `artifacts/reelfetch/src/config/ads.ts` — global demo-ad setting and placement switches
- `artifacts/reelfetch/scripts/generate-seo-assets.mjs` — sitemap and robots.txt generation

## Architecture decisions

- Platform URL detection is client-side format recognition only; it does not retrieve or scrape video data.
- A platform is only marked Available when its status and authorized provider integration are both configured.
- Demo results are isolated from real provider result models.
- Demo ad placeholders never link or load an advertising script.

## Product

ReelFetch lets visitors paste a video URL, identify its platform format, and see whether an authorized service is connected. The current build is frontend-only and does not download videos.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Set `VITE_PUBLIC_SITE_URL` to the canonical production origin before building for publication; without it, the generated sitemap contains no absolute URLs.
- Platform routes without an authorized integration are informational, noindex status pages and are omitted from the sitemap.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
