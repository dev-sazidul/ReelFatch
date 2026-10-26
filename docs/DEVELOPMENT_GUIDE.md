# Development guide

Use two terminals. Node.js 22 or newer is expected.

## Frontend

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/. Production build:

```bash
npm run build
```

`npm run build` typechecks, writes `public/sitemap.xml` and `public/robots.txt`, then builds the Vite app. A warning about `VITE_PUBLIC_SITE_URL` is expected when that variable is unset.

Copy `.env.example` to `.env` only if the API is not on `http://127.0.0.1:3000`. `VITE_API_BASE_URL` empty means the browser calls this same origin and Vite proxies the API.

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm test
npm run build
npm run start:dev
```

The API listens on http://127.0.0.1:3000. Check http://127.0.0.1:3000/api/health.

`npm test` covers URL validation, Facebook link classification, provider selection, Graph error mapping, and the rule that a missing token does not call Facebook.

`npm run build` compiles to `backend/dist`. `npm start` runs the compiled server.

## Facebook token

1. Create a Meta app at https://developers.facebook.com/apps/.
2. Request the permissions the video owner can grant. `user_videos` is required for videos that person uploaded or was tagged in. A Page token is required for videos that Page owns, and the caller must be allowed to read the Page.
3. Put the token in `FACEBOOK_PAGE_ACCESS_TOKEN` or `FACEBOOK_USER_ACCESS_TOKEN`.
4. Restart the API. Do not commit `.env`.

Numeric watch, Reel, and `/videos/{id}` links are read directly. A share or `fb.watch` link is followed with a public `HEAD` redirect, without cookies. A download is offered only when the media provider returns a file URL. A redirect that does not contain a numeric id returns `LINK_ID_UNAVAILABLE`. A login page returns `LOGIN_REQUIRED`.

## Adding a provider

1. Add a class that implements `VideoProvider`.
2. Register it in the providers passed to `selectProvider`.
3. Implement lookup with an authorized API only. Return `PROVIDER_NOT_CONFIGURED` until credentials exist.
4. Add unit tests for host selection and the unconfigured error.
5. Document the credential and the API limitation in `docs/PROJECT_OVERVIEW.md`.

To move downloads onto Redis later, replace `DownloadJobStore` with a BullMQ adapter that preserves the job id and status fields. Do not add that package until a worker is actually used.
