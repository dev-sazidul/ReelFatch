import { decideHandoff, noticeUrl } from './src/handoff.js';

const MENU_ID = 'download-with-reelfetch';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Download with ReelFetch',
      contexts: ['page', 'link'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const candidate = linkFromMenu(info);
  const decision = decideHandoff(candidate);
  const destination = decision.type === 'handoff' ? decision.target : noticeUrl(decision.detection.state);
  chrome.tabs.create({ url: destination });
  if (tab?.id != null) setBadge(tab.id, decision.detection);
});

function linkFromMenu(info) {
  if (typeof info.linkUrl === 'string' && info.linkUrl) return info.linkUrl;
  if (typeof info.pageUrl === 'string') return info.pageUrl;
  return '';
}

function setBadge(tabId, detection) {
  const text = detection.state === 'available' && detection.platform ? detection.platform.badge : '';
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#1e63b8' });
  chrome.action.setBadgeText({ tabId, text });
}
