/**
 * Platforms ReelFetch can check today. Status matches the website registry
 * and the yt-dlp provider hosts. Add a platform here before the popup can
 * offer it. Use "coming-soon" when the site recognizes the host but no
 * download service is connected.
 */
export const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', badge: 'FB', status: 'available', domains: ['facebook.com', 'fb.watch'] },
  { id: 'youtube', name: 'YouTube', badge: 'YT', status: 'available', domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
  { id: 'tiktok', name: 'TikTok', badge: 'TT', status: 'available', domains: ['tiktok.com'] },
  { id: 'instagram', name: 'Instagram', badge: 'IG', status: 'available', domains: ['instagram.com'] },
  { id: 'x', name: 'X', badge: 'X', status: 'available', domains: ['x.com', 'twitter.com'] },
  { id: 'pinterest', name: 'Pinterest', badge: 'PIN', status: 'available', domains: ['pinterest.com', 'pin.it'] },
  { id: 'reddit', name: 'Reddit', badge: 'RD', status: 'available', domains: ['reddit.com', 'redd.it'] },
];

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);
const MAX_URL_LENGTH = 2000;

export function detectVideoPage(rawValue, registry = PLATFORMS) {
  const raw = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!raw) {
    return result('empty', 'Open a video page, then try again.');
  }
  if (raw.length > MAX_URL_LENGTH) {
    return result('invalid', 'That link is too long to send to ReelFetch.');
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    return result('invalid', 'This address is not a public http or https link.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return result('invalid', 'This address is not a public http or https link.');
  }
  if (url.username || url.password) {
    return result('invalid', 'Links that include a username or password are not accepted.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    return result('invalid', 'Only standard web ports are accepted.');
  }

  const host = (url.hostname || '').toLowerCase().replace(/\.$/, '');
  if (!host || isBlockedHost(host)) {
    return result('invalid', 'That host is not allowed.');
  }

  const platform = registry.find((item) => item.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)));
  if (!platform) {
    return result('unsupported', 'ReelFetch does not support this site.', { url: raw });
  }
  if (platform.status === 'coming-soon') {
    return result('coming-soon', `${platform.name} is recognized, but checking it is not connected yet.`, { url: raw, platform });
  }
  if (platform.status !== 'available') {
    return result('unsupported', 'ReelFetch does not support this site.', { url: raw, platform });
  }

  return result('available', `${platform.name} link detected. ReelFetch will check it on the website.`, {
    url: raw,
    platform,
  });
}

function isBlockedHost(host) {
  if (host.includes(':')) return true;
  if (/^[0-9]{1,3}(\.[0-9]{1,3}){3}$/.test(host)) return true;
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) return true;
  return false;
}

function result(state, message, extra = {}) {
  return {
    state,
    message,
    url: extra.url || '',
    platform: extra.platform || null,
  };
}

export function statusLabel(state) {
  if (state === 'available') return 'Available';
  if (state === 'coming-soon') return 'Coming Soon';
  return 'Unsupported';
}
