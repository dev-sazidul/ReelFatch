# Agent notes

ReelFetch has a Next.js App Router frontend (React) in `frontend/` and a FastAPI service in `backend/`. Preserve the current homepage design unless a behavior change requires a copy update.

## Authorized downloads only

- Facebook lookup uses the official Graph API `GET /{video-id}?fields=id,name,description,picture,source,format`.
- Call it only with `FACEBOOK_PAGE_ACCESS_TOKEN` or `FACEBOOK_USER_ACCESS_TOKEN`. Send the token as a Bearer header. Never log the token, cookies, or the `source` URL.
- A share or `fb.watch` link may be resolved by a public HTTPS redirect to a numeric watch, Reel, or videos id. Use `HEAD`, do not send cookies, and discard the body. Do not parse Facebook HTML or invent a file URL.
- If `source` is missing or its host is not `*.fbcdn.net` or `*.fbsbx.com`, return `VIDEO_NOT_AVAILABLE`.
- YouTube, TikTok, and Instagram stay `PROVIDER_NOT_CONFIGURED`. Do not add scrapers or unofficial download libraries.
- The labeled homepage sample card is demo layout data. Find Video must not use it.

## Commands

Docker, from the repository root: `docker compose up --build -d` serves the frontend on `http://localhost:8080`. The API is internal to the Compose network. See `docs/DOCKER.md`; never print full `docker compose config` output because it may include secrets. Use `docker compose config --quiet` for validation.

Frontend, from the repository root:

```bash
cd frontend
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

Backend:

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m app --reload
```

Next.js serves development on port 5173 and production on 4173. It forwards `/api/health` and `/api/videos` to `http://127.0.0.1:3000`. Restart development or rebuild production after changing `next.config.ts` or the proxy target. Python 3.11+ is required. The API reads `backend/.env` at startup without overriding shell variables. Use one API worker because lookups, jobs, and rate limits are in memory.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Next.js generates agent guidance in its application directory. The generator lives at `frontend/node_modules/next/dist/server/lib/generate-agent-files.js`.

<!-- END:nextjs-agent-rules -->
