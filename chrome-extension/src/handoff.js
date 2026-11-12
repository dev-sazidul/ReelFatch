import { detectVideoPage } from './platforms.js';

export const SITE_ORIGIN = 'https://bestdownloader.site';

export function buildHandoffUrl(videoUrl) {
  const target = new URL('/', SITE_ORIGIN);
  target.searchParams.set('url', videoUrl);
  return target.toString();
}

export function decideHandoff(rawUrl, registry) {
  const detection = detectVideoPage(rawUrl, registry);
  if (detection.state === 'available') {
    return { type: 'handoff', detection, target: buildHandoffUrl(detection.url) };
  }
  return { type: 'notice', detection };
}

export function noticeUrl(state) {
  const page = new URL(chrome.runtime.getURL('popup/notice.html'));
  page.searchParams.set('reason', state);
  return page.toString();
}
