# Project overview

ReelFetch is a local web application for checking Facebook video links and downloading a file only when Facebook's official Graph API returns one the configured token is allowed to read.

The React frontend lives at the repository root. The NestJS API lives in `backend/`. The homepage design is unchanged: paste a link, choose Find Video, then review any qualities the API actually returned. A collapsed sample card on the homepage is labeled demo data and is not a lookup result.

## What works today

- URL validation for Facebook, YouTube, TikTok, and Instagram hosts.
- Numeric Facebook watch, reel, and `/videos/{id}` links can be sent to Graph API `v26.0`.
- When a Page or user access token is configured, the API requests `id`, `name`, `description`, `picture`, `source`, and `format`.
- The `source` field is the raw video file URL documented by Meta. The API downloads it only from `https` hosts ending in `.fbcdn.net` or `.fbsbx.com`, then streams it to the browser.
- Health, lookup, metadata, download-job, and file endpoints are available.
- Missing credentials return `PROVIDER_NOT_CONFIGURED`. No Facebook request is made in that case for links that already contain a numeric id.

## What does not work without more access

- `facebook.com/share/...` and `fb.watch/...` links do not contain a numeric video id. Meta's Video API does not document a way to exchange those codes for an id. ReelFetch does not open the page to extract one.
- A token does not grant access to private or other people's videos. Graph API permission errors are returned as `VIDEO_NOT_PERMITTED` or `PROVIDER_UNAUTHORIZED`.
- The `format` list describes width and height. It does not include a file URL, so ReelFetch offers one download, labeled "Original file", only when `source` is present.
- YouTube's official Data API does not provide video files. TikTok and Instagram do not have a configured official download API. Those platforms return `PROVIDER_NOT_CONFIGURED`.

## Required credentials

Create a Meta app, have the video owner authorize it, and put one token in `backend/.env`:

- `FACEBOOK_PAGE_ACCESS_TOKEN` for a Page video the token's Page can manage. Meta's Post reference says `source` is withheld for Page-owned videos unless the requesting user is an admin of that Page.
- `FACEBOOK_USER_ACCESS_TOKEN` with `user_videos` for videos uploaded by, or tagging, that person.

Public videos still require a valid Page or user token, per the [Video reference](https://developers.facebook.com/docs/graph-api/reference/video/). Leave both values empty to run the API without calling Facebook.
