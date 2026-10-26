import { ApiError } from '../common/api-error';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isIpAddress(hostname: string) {
  if (hostname.startsWith('[') || hostname.includes(':')) return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

export function parsePublicHttpUrl(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value || value.length > 2000) {
    throw new ApiError(400, 'INVALID_URL', 'Enter one http or https video link.');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(400, 'INVALID_URL', 'Enter a complete link beginning with https:// or http://.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ApiError(400, 'INVALID_URL', 'Only http and https links can be checked.');
  }
  if (url.username || url.password) {
    throw new ApiError(400, 'INVALID_URL', 'Links that include a username or password are not accepted.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new ApiError(400, 'INVALID_URL', 'Only standard web ports are accepted.');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || isIpAddress(host) || BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new ApiError(400, 'INVALID_URL', 'That host is not allowed.');
  }
  return url;
}

export function isAllowedMediaUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  if (url.port && url.port !== '443') return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || isIpAddress(host) || BLOCKED_HOSTS.has(host) || host.endsWith('.local')) return false;
  return host === 'fbcdn.net' || host.endsWith('.fbcdn.net') || host === 'fbsbx.com' || host.endsWith('.fbsbx.com');
}

export function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    for (const key of [...url.searchParams.keys()]) {
      if (/token|cookie|password|secret|auth|session|credential/i.test(key)) url.searchParams.set(key, '[redacted]');
    }
    return url.toString().slice(0, 300);
  } catch {
    return '[unparsed url]';
  }
}
