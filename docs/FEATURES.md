# Features

## Lookup

`POST /api/videos/lookup` with `{ "url": "https://www.facebook.com/watch/?v=123456789012345" }`.

Success returns `lookupId`, `platform`, `title`, `description`, `thumbnailUrl`, `sourceLabel`, `qualities`, and `reportedFormats`. The Graph `source` URL is not included. `reportedFormats` lists sizes Facebook returned and is not a list of download links.

`GET /api/videos/lookups/:lookupId` returns the same public record until it expires.

## Download

`POST /api/videos/downloads` with `{ "lookupId", "qualityId": "source" }` checks that Graph still returns an allowed file URL and creates a job.

`GET /api/videos/downloads/:jobId` returns `ready`, `streaming`, `completed`, or `failed`.

`GET /api/videos/downloads/:jobId/file` streams the file as an attachment. The browser shows in-page progress when `Content-Length` is present.

## Health

`GET /api/health` reports whether a Facebook token is configured. It does not reveal the token.

## Error codes

| Code | Meaning |
| --- | --- |
| `INVALID_URL` | The text is not a usable http(s) URL. |
| `INVALID_REQUEST` | The JSON body or id failed validation. |
| `UNSUPPORTED_LINK` | The host has no provider. |
| `LINK_ID_UNAVAILABLE` | No numeric video id was present in the URL or in a public redirect. |
| `LOGIN_REQUIRED` | The public redirect pointed at a Facebook login page. No cookies are sent. |
| `PROVIDER_NOT_CONFIGURED` | The video id was found, but no media provider is configured to return a file. |
| `PROVIDER_UNAUTHORIZED` | Graph API rejected the token, commonly error 190. |
| `VIDEO_NOT_PERMITTED` | The token is not allowed to read that video. |
| `VIDEO_NOT_FOUND` | Graph API did not recognize the id. |
| `VIDEO_NOT_AVAILABLE` | No allowed file URL was returned, or the CDN response was not a video. |
| `PROVIDER_RATE_LIMITED` | Facebook rate-limited the call. |
| `PROVIDER_TIMEOUT` | Graph API or the file host timed out. |
| `PROVIDER_ERROR` | Another Graph API failure. The token is redacted. |
| `FILE_TOO_LARGE` | The file exceeds `MAX_DOWNLOAD_BYTES`. |
| `RATE_LIMITED` | This API's own rate limit. |
| `LOOKUP_NOT_FOUND` / `JOB_NOT_FOUND` | The id is unknown or expired. |

## Limitations

- One downloadable quality, "Original file", because the documented `format` objects do not include file URLs.
- No queue worker. Jobs are records in memory and the file transfer happens on the download request.
- No account system, cookies, or persisted library.
- Restarting the API drops lookups and jobs.
