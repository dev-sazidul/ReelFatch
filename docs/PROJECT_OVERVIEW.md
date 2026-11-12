# Project overview

ReelFetch is a local web application for checking Facebook video links and downloading a file only when Facebook's official Graph API returns one the configured token is allowed to read.

The Next.js frontend lives in `frontend/`. The FastAPI service lives in `backend/`. The homepage design is unchanged: paste a link, choose Find Video, then review any qualities the API actually returned. A collapsed sample card on the homepage is labeled demo data and is not a lookup result.

## What works today

- Video downloading and metadata lookup powered by `yt-dlp` for Facebook, YouTube, TikTok, Instagram, X/Twitter, Reddit, and Pinterest.
- Merges audio and video streams into clean MP4 files with accurate size headers and download progress.
- Fallback support for Facebook Graph API `v26.0` when a Page or user access token is explicitly configured.
- URL validation and host verification for all supported video platforms.
- Health, lookup, metadata, download-job, and streaming file endpoints are available.

## What does not work without more access

- Share and `fb.watch` links work only when a public HTTPS HEAD redirect exposes a numeric video id. ReelFetch does not parse page HTML to find one.
- A token does not grant access to private or other people's videos. Graph API permission errors are returned as `VIDEO_NOT_PERMITTED` or `PROVIDER_UNAUTHORIZED`.
- The `format` list describes width and height. It does not include a file URL, so ReelFetch offers one download, labeled "Original file", only when `source` is present.
- YouTube's official Data API does not provide video files. TikTok and Instagram do not have a configured official download API. Those platforms return `PROVIDER_NOT_CONFIGURED`.

## Required credentials

Create a Meta app, have the video owner authorize it, and put one token in `backend/.env`:

- `FACEBOOK_PAGE_ACCESS_TOKEN` for a Page video the token's Page can manage. Meta's Post reference says `source` is withheld for Page-owned videos unless the requesting user is an admin of that Page.
- `FACEBOOK_USER_ACCESS_TOKEN` with `user_videos` for videos uploaded by, or tagging, that person.

Public videos still require a valid Page or user token, per the [Video reference](https://developers.facebook.com/docs/graph-api/reference/video/). Empty tokens prevent Graph calls; public HEAD redirect checks may still run. The API reads `backend/.env` at startup, preserving shell environment values.
