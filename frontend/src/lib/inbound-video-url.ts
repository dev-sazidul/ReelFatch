import platformData from '@/data/platforms.json';

type PlatformConfig = {
  id: string;
  name: string;
  domains: string[];
  status: string;
};

const platforms = (platformData as { platforms: PlatformConfig[] }).platforms;
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

export type InboundVideoUrl =
  | { ok: true; url: string }
  | { ok: false; kind: 'error' | 'warning'; message: string };

export function readInboundVideoUrl(href: string): InboundVideoUrl | null {
  let page: URL;
  try {
    page = new URL(href);
  } catch {
    return null;
  }
  if (!page.searchParams.has('url')) return null;
  return validateInboundVideoUrl(page.searchParams.get('url') ?? '');
}

export function validateInboundVideoUrl(rawValue: string): InboundVideoUrl {
  const raw = rawValue.trim();
  if (!raw || raw.length > 2000) {
    return { ok: false, kind: 'error', message: 'Enter a complete link beginning with https:// or http://.' };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, kind: 'error', message: 'Enter a complete link beginning with https:// or http://.' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, kind: 'error', message: 'Enter a complete link beginning with https:// or http://.' };
  }
  if (url.username || url.password) {
    return { ok: false, kind: 'error', message: 'Links that include a username or password are not accepted.' };
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    return { ok: false, kind: 'error', message: 'Only standard web ports are accepted.' };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host.includes(':') || isIpv4(host) || BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, kind: 'error', message: 'That host is not allowed.' };
  }

  const platform = platforms.find((item) => item.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)));
  if (!platform || platform.status === 'Unavailable') {
    return { ok: false, kind: 'error', message: 'That link is not on a supported video platform.' };
  }
  if (platform.status !== 'Available') {
    return {
      ok: false,
      kind: 'warning',
      message: `This ${platform.name} link was recognized, but no download service is connected. The video was not checked.`,
    };
  }

  return { ok: true, url: raw };
}

function isIpv4(host: string) {
  return /^[0-9]{1,3}(\.[0-9]{1,3}){3}$/.test(host);
}
