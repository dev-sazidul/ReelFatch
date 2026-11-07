# ReelFetch

```text
frontend/       Next.js app, assets, scripts, and npm dependencies
backend/        FastAPI service and Python tests
docs/           Shared architecture and setup documentation
attached_assets/ Reference materials
```

## Docker

With Docker Desktop running Linux containers, start both apps from the repository root:

```powershell
docker compose up --build -d
```

Open http://localhost:8080. Only the frontend is published; it forwards API calls to the backend container. Optional Docker settings are in the root `.env.example`. Facebook tokens belong in `backend/.env` and are loaded only at runtime.

```powershell
docker compose ps
docker compose logs -f
docker compose down
```

See [the Docker guide](docs/DOCKER.md) for configuration and rebuilding.

For development without Docker, run each application in its own terminal, starting from the repository root.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. For production, run `npm run build` and `npm start` from `frontend/` (port 4173). Optional settings belong in `frontend/.env.local`; see `frontend/.env.example`.

## Backend

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m app --reload
```

The API listens on http://127.0.0.1:3000. Backend settings and authorized Facebook tokens belong in `backend/.env`; see `backend/.env.example`. On macOS/Linux use `.venv/bin/python`.

See [the development guide](docs/DEVELOPMENT_GUIDE.md) for tests, production setup, and provider limitations.
