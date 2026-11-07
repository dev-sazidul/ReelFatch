# Docker

The root `compose.yaml` runs the production Next.js frontend and FastAPI backend as two Linux containers. Both processes run as non-root users. The frontend uses a multi-stage build and Next.js's standalone server; the backend runs one Uvicorn process.

## Start and stop

Use Docker Desktop with Linux containers and Docker Compose 2.24+ (or newer). The optional `env_file` setting requires that Compose version; see [Docker's environment-file documentation](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/).

From the repository root:

```powershell
docker compose up --build -d
docker compose ps
```

Open http://localhost:8080. The frontend waits for backend health before starting. Its own health check exercises the proxied API health route.

```powershell
docker compose logs -f
docker compose down
```

Stopping or recreating the backend clears in-memory lookups and download jobs. There is no persistent database or volume to initialize.

## Configuration

All files are optional for an unconfigured local launch:

| File | Purpose |
| --- | --- |
| Root `.env` (copy root `.env.example`) | Compose host port, bind address, and public site URL |
| `backend/.env` (copy `backend/.env.example`) | Runtime backend settings and authorized Facebook token |
| `frontend/.env.local` | Local non-Docker development only; excluded from Docker builds |

The default host address is `127.0.0.1`, port `8080`. Change `FRONTEND_PORT` if occupied. Set `FRONTEND_BIND_ADDRESS=0.0.0.0` only when you intend to expose the frontend beyond this machine. The backend has no published host port; its container listens on `0.0.0.0:3000` and Next.js reaches `http://backend:3000` through the Compose network. Compose overrides backend `HOST` and `PORT` so local loopback settings do not break container communication.

Set `NEXT_PUBLIC_SITE_URL` in the root `.env` before building for a public deployment. It controls canonical URLs, sitemap, and robots output. It is a public build-time value; changing it requires rebuilding the frontend. An empty value permits local use with an empty sitemap.

The browser uses same-origin API calls. `NEXT_PUBLIC_API_BASE_URL` is intentionally empty in the image. The backend hostname is set by the frontend's `API_PROXY_TARGET` build argument, not a browser setting. Compose supplies that argument automatically. A manual frontend build can override it with `--build-arg API_PROXY_TARGET=...`.

Only backend runtime configuration receives Facebook credentials. Neither image includes local environment files, virtual environments, dependency directories, or build output from the host. Do not pass tokens as frontend build arguments. No token is required to start the stack; authorized Graph lookups require one.

## Rebuild and validate

After code or public build-time settings change:

```powershell
docker compose up --build -d
```

After changing backend credentials/settings, recreate the backend to reload its environment:

```powershell
docker compose up -d --force-recreate backend
```

Configuration and health checks:

```powershell
docker compose config --quiet
docker compose ps
curl.exe http://localhost:8080/api/health
```

Use `curl` instead of `curl.exe` on macOS/Linux. Avoid printing the full resolved Compose configuration because it can contain backend credentials.

Keep one backend instance: lookups, jobs, and rate limiting are process-local. Requests through Next.js share the proxy's socket-peer rate limit. This Docker setup packages the existing authorized download behavior; it adds no scraping or new providers.
