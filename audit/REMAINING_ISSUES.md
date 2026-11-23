# Remaining Issues & Deployment Checklist — ReelFetch

**Date:** 2026-11-23

---

## 1. Blocked by External Platform Restrictions (Not Bypassable)
1. **Instagram (`Coming Soon`):** Unauthenticated server-side `yt-dlp` requests receive empty media responses requiring login cookies.
2. **Reddit (`Coming Soon`):** Unauthenticated server-side `yt-dlp` requests fail with `"Account authentication is required"`.
3. **X (Twitter) & Pinterest (`Coming Soon`):** Not yet verified with confirmed public video URLs in production; kept `Coming Soon` rather than falsely advertising `Available`.

---

## 2. Not Live-Verified / Pending Deployment
1. **Production Deployment:** All fixes are in the local repository and have not yet been deployed to `https://bestdownloader.site/`. After deploying via `docker compose up --build -d`, re-test `/api/videos/lookup` and `/api/videos/downloads/{jobId}/file` for Facebook, YouTube, and TikTok on the live domain.
2. **Docker Build Verification:** `backend/Dockerfile` (`nodejs` + `ffmpeg`) was updated and verified by inspection, but `docker compose build` was not run locally.
3. **Contact Form Delivery:** `POST /api/contact` validates and logs inquiries server-side (`[contact-form]`), as no SMTP/email provider credentials exist in the repo. Connect an email transport (or transactional mail service) if automated email forwarding is desired.

---

## 3. Unable to Verify (Browser Automation Unavailable)
1. **Live Chrome 5-Viewport Visual Inspection (`UI-001` / `SEO-006`):**
   - Viewports: Desktop `1440×900`, Laptop `1280×800`, Tablet `768×1024`, Android `360×800`, iPhone `390×844`.
   - Reason: Chrome remote debugging (`DevToolsActivePort`) was not enabled on the host machine.
   - Action: Start Chrome with remote debugging enabled (`chrome://inspect/#remote-debugging`) and run visual/mobile download verification after deployment.
