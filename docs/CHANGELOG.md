# Changelog

## 2026-10-26

- Added a NestJS API in `backend/` with lookup, metadata, download-job, file, and health routes.
- Connected Find Video to that API. Facebook uses the official Graph API when a Page or user access token is configured.
- Share links and `fb.watch` short links return `LINK_ID_UNAVAILABLE` instead of being scraped.
- YouTube, TikTok, and Instagram return `PROVIDER_NOT_CONFIGURED`. No unofficial download client was added.
- Missing tokens return `PROVIDER_NOT_CONFIGURED` and do not call Facebook.
- Added request validation, timeouts, rate limiting, CORS, media-host checks, and secret redaction.
- Documented setup, endpoints, and provider limits.
