import { SITE_ORIGIN, decideHandoff } from '../src/handoff.js';
import { statusLabel } from '../src/platforms.js';
import { loadPreferences, savePreferences } from '../src/preferences.js';

const els = {
  pill: document.querySelector('#status-pill'),
  platform: document.querySelector('#platform-name'),
  url: document.querySelector('#page-url'),
  message: document.querySelector('#message'),
  download: document.querySelector('#download'),
  confirmOpen: document.querySelector('#confirm-open'),
  confirmCancel: document.querySelector('#confirm-cancel'),
  openSite: document.querySelector('#open-site'),
  copy: document.querySelector('#copy'),
  confirm: document.querySelector('#confirm'),
};

const previewPages = {
  youtube: 'https://www.youtube.com/watch?v=public-video',
  unsupported: 'https://example.com/watch',
  loading: '',
};

let current = decideHandoff('');
let preferences = { confirmBeforeOpen: false };

els.openSite.addEventListener('click', () => {
  void openUrl(`${SITE_ORIGIN}/`);
});

els.download.addEventListener('click', () => {
  if (current.type !== 'handoff') return;
  if (preferences.confirmBeforeOpen) {
    showConfirm(true);
    return;
  }
  void openUrl(current.target);
});

els.confirmOpen.addEventListener('click', () => {
  if (current.type === 'handoff') void openUrl(current.target);
});

els.confirmCancel.addEventListener('click', () => showConfirm(false));

els.copy.addEventListener('click', async () => {
  if (!current.detection.url) return;
  try {
    await navigator.clipboard.writeText(current.detection.url);
    setMessage('Link copied.');
  } catch {
    setMessage('The link could not be copied. Select it from the page address bar instead.');
  }
});

els.confirm.addEventListener('change', () => {
  preferences = { confirmBeforeOpen: els.confirm.checked };
  void savePreferences(preferences);
});

void start();

async function start() {
  preferences = await loadPreferences();
  els.confirm.checked = preferences.confirmBeforeOpen;
  const preview = previewPage();
  if (preview) {
    showDetection(decideHandoff(preview === 'loading' ? '' : preview));
    if (preview === 'loading') showLoading();
    return;
  }
  showLoading();
  try {
    const tab = await activeTab();
    const detection = decideHandoff(tab?.url || '');
    showDetection(detection);
    if (tab?.id != null && globalThis.chrome?.action) {
      const text = detection.detection.state === 'available' ? detection.detection.platform.badge : '';
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#1e63b8' });
      await chrome.action.setBadgeText({ tabId: tab.id, text });
    }
  } catch {
    showDetection(decideHandoff(''));
    setMessage('The current tab could not be read. Open a video page and try again.');
  }
}

function previewPage() {
  if (location.protocol === 'chrome-extension:') return '';
  const value = new URLSearchParams(location.search).get('preview');
  if (value === 'loading') return 'loading';
  if (value === 'youtube') return previewPages.youtube;
  if (value === 'unsupported') return previewPages.unsupported;
  return '';
}

function showLoading() {
  els.pill.dataset.state = 'loading';
  els.pill.textContent = 'Checking';
  els.platform.textContent = 'Reading the current tab';
  els.url.textContent = 'Looking up the address of this tab.';
  els.download.disabled = true;
  els.copy.disabled = true;
}

function showDetection(decision) {
  current = decision;
  const detection = decision.detection;
  const label = detection.platform?.name || 'No supported video page';
  els.pill.dataset.state = detection.state;
  els.pill.textContent = detection.state === 'loading' ? 'Checking' : statusLabel(detection.state);
  els.platform.textContent = label;
  els.url.textContent = detection.url || 'This tab has no public video link.';
  setMessage(detection.message);
  els.download.disabled = decision.type !== 'handoff';
  els.download.textContent = 'Download Video';
  els.copy.disabled = !detection.url;
  showConfirm(false);
}

function showConfirm(open) {
  els.confirmOpen.hidden = !open;
  els.confirmCancel.hidden = !open;
  els.download.hidden = open;
  setMessage(open
    ? 'Open ReelFetch with this link? The website will check it. Nothing is saved until you choose a file.'
    : current.detection.message);
}

function setMessage(text) {
  els.message.textContent = text;
}

async function activeTab() {
  if (!globalThis.chrome?.tabs?.query) return null;
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function openUrl(url) {
  els.download.disabled = true;
  els.download.textContent = 'Opening…';
  try {
    if (globalThis.chrome?.tabs?.create) {
      await chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener');
    }
    setMessage('ReelFetch is opening. Choose a listed file there if the source returns one.');
  } catch {
    els.download.disabled = current.type !== 'handoff';
    els.download.textContent = 'Download Video';
    setMessage('ReelFetch could not be opened. Check your connection and try again.');
  }
}
