# Development guide

Use two terminals with Node.js 22+ and Python 3.11+. Verification used Node.js 24 and Python 3.14 on Windows.

Alternatively, run the production stack with `docker compose up --build -d` from the repository root and open http://localhost:8080. See [the Docker guide](DOCKER.md) for container settings. Local development commands below continue to work without Docker.

## Frontend

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/. For production, from `frontend/`:

```powershell
npm run typecheck
npm run build
npm start
```

Production serves http://localhost:4173/. Next.js needs a Node server for API forwarding and dynamic pages; `.next/` is not a static hosting directory. The build generates the sitemap and robots file, then builds and typechecks the application.

Copy `frontend/.env.example` to `frontend/.env.local` to customize the frontend. All frontend environment files belong in `frontend/`. Shell variables take precedence, followed by Next.js's mode-specific local file, `.env.local`, mode-specific file, and `.env`. The SEO generator loads the same production environment files as the build.

- Leave `NEXT_PUBLIC_API_BASE_URL` empty for same-origin API requests.
- `API_PROXY_TARGET` defaults to `http://127.0.0.1:3000`; it is server-only.
- Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin before building for deployment. Without it, the sitemap is empty and canonical URLs use the incoming host with a local HTTP fallback.
- Public environment values are embedded at build time. Rebuild after changing them or the proxy target. Restart development after configuration changes.

Migration mapping: `VITE_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL`, `VITE_DEV_API_PROXY` → `API_PROXY_TARGET`, `VITE_PUBLIC_SITE_URL` → `NEXT_PUBLIC_SITE_URL`.

## Backend

Windows PowerShell, in a second terminal starting at the repository root:

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env # first setup only; preserve an existing .env
.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m app --reload
```

On macOS/Linux, use `.venv/bin/python` and `cp`. For production, install `requirements.txt` and run `python -m app` from `backend/` without reload. No TypeScript backend build remains.

The API binds to http://127.0.0.1:3000. `GET /api/health` reports configuration without tokens. Startup reads `backend/.env`; shell variables take precedence. Keep credentials in the backend environment, never in public frontend variables.

Use one API worker. Lookups, jobs, and rate limits are in memory and disappear on restart. The limiter uses the socket peer; through Next.js, visitors share the proxy's per-route limit. Forwarded client headers are ignored. Multiple workers or per-client limits behind a proxy require shared state and an explicit trusted proxy policy.

## Authorized Facebook lookup

Set only `FACEBOOK_PAGE_ACCESS_TOKEN` or `FACEBOOK_USER_ACCESS_TOKEN` for a video the token may read. A Page token takes precedence. Restart the API after changing configuration. Never commit environment files.

Numeric watch, Reel, and videos links are read directly. Share and fb.watch links may resolve through public HTTPS HEAD redirects without cookies or body parsing. Missing ids produce `LINK_ID_UNAVAILABLE`; login redirects produce `LOGIN_REQUIRED`. Missing credentials prevent Graph calls, although public redirect checks can still run.

Downloads require a Graph-provided source on an allowed Facebook CDN. Fixture tests do not prove that a real token can download a particular video.

## Adding a provider

Implement `VideoProvider` in `backend/app/providers/base.py`, register it through `backend/app/videos/service.py`, and use an authorized API only. Keep providers unconfigured until their integration exists. Add tests for host selection and credential/provider failures. Add shared persistence only when deployment requires it.
