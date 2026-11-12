# ReelFetch Video Downloader

Chrome extension that reads the page you are on, or a link you right-click, and opens that address on [ReelFetch](https://bestdownloader.site/). The website runs the existing downloader. The extension does not download the file itself.

Supported pages, matching the live backend: Facebook, YouTube, TikTok, Instagram, X, Pinterest, and Reddit. Any other site is unsupported. A file is saved only after you choose a listed option on the website.

## Install in Developer Mode

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `chrome-extension` folder.
5. Pin **ReelFetch Video Downloader**.

The popup reads the current tab only after you click the toolbar icon. Right-click a page or a link and choose **Download with ReelFetch** to send that address.

## What it stores

One local preference: whether the popup asks before opening ReelFetch. It is kept in `chrome.storage.local` on your computer. Page addresses are not saved.

## Checks

From the repository root:

```bash
node chrome-extension/scripts/generate-icons.mjs
node chrome-extension/scripts/test-detection.mjs
```

## Package a zip

From the repository root, after the icons exist:

```bash
mkdir -p chrome-extension/dist
cd chrome-extension
zip -r dist/reelfetch-video-downloader.zip manifest.json background.js popup src icons -x '*.DS_Store'
```

Upload that zip to the Chrome Web Store. Leave this README, `STORE.md`, and `PRIVACY.md` out of the zip. Store listing text is in `STORE.md`. The privacy summary is in `PRIVACY.md`, and the public policy is https://bestdownloader.site/privacy.
