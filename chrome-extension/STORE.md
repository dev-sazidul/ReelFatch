# Chrome Web Store listing

## Name

ReelFetch Video Downloader

## Summary

Send a public video link to ReelFetch and review the download options on the website.

## Description

ReelFetch Video Downloader detects when you are on a public video page and opens that link on https://bestdownloader.site/.

Supported sites are Facebook, YouTube, TikTok, Instagram, X, Pinterest, and Reddit. Other sites are shown as unsupported and are not sent.

Click Download Video in the popup, or right-click a page or link and choose Download with ReelFetch. ReelFetch then checks the link with its existing downloader. A file is saved only if you choose one of the options the source returns. The extension does not download videos by itself, does not sign in to those sites, and does not read passwords, cookies, or your browsing history.

Privacy: https://bestdownloader.site/privacy

## Permission justifications

- activeTab: read the address of the tab you opened the popup from.
- contextMenus: add Download with ReelFetch to the right-click menu.
- storage: remember the “ask before opening” setting on this computer.

No host permission is requested. The extension does not inject scripts into Facebook, YouTube, or the other video sites.

## Icons

Generated files:

- 16×16 `icons/icon-16.png`
- 32×32 `icons/icon-32.png`
- 48×48 `icons/icon-48.png`
- 128×128 `icons/icon-128.png`

Regenerate with `node chrome-extension/scripts/generate-icons.mjs`.

## Screenshots to capture before upload

Take these from the loaded extension. Do not use mock traffic numbers.

1. Popup on a YouTube watch page, status Available, Download Video enabled. 1280×800.
2. Popup on an unsupported site, status Unsupported, Download Video disabled. 1280×800.
3. The ReelFetch homepage after the extension opens it, with the link filled in and the normal result or error from the website. 1280×800.

Optional promo images, only if you export them from those same screens:

- Small tile: 440×280 PNG
- Marquee: 1400×560 PNG

Use the real blue `#1e63b8` mark and the name ReelFetch. Do not add stars, download counts, or “official YouTube” wording.
