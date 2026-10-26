import { classifyFacebookTarget, type FacebookLinkType } from './facebook-url';

export type FacebookResolution =
  | { status: 'resolved'; videoId: string; via: 'url' | 'redirect' }
  | { status: 'unresolved'; linkType: FacebookLinkType }
  | { status: 'login_required' }
  | { status: 'rate_limited' }
  | { status: 'unavailable' };

const MAX_HOPS = 4;

function facebookHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const bare = host.replace(/^www\./, '');
  return bare === 'facebook.com' || bare.endsWith('.facebook.com') || bare === 'fb.watch' || bare.endsWith('.fb.watch') || bare === 'fb.me';
}

function isLoginUrl(url: URL) {
  const path = url.pathname.toLowerCase();
  return path === '/login' || path.startsWith('/login/') || path.includes('login.php') || path.startsWith('/checkpoint');
}

function idFromUrl(url: URL) {
  const target = classifyFacebookTarget(url);
  return target.kind === 'video' ? target.videoId : null;
}

/**
 * Reads a numeric video id from the URL or from a public HTTPS redirect.
 * Response bodies are discarded. Cookies are not sent or stored.
 */
export async function resolveFacebookVideoId(
  start: URL,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<FacebookResolution> {
  const direct = idFromUrl(start);
  if (direct) return { status: 'resolved', videoId: direct, via: 'url' };

  const initial = classifyFacebookTarget(start);
  const linkType = initial.kind === 'unresolved' ? initial.linkType : 'other';
  if (linkType === 'other') return { status: 'unresolved', linkType };

  let current = start;
  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    let response: Response;
    try {
      response = await fetchImpl(current, {
        method: 'HEAD',
        redirect: 'manual',
        headers: { accept: 'text/html', 'user-agent': 'ReelFetch/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        return { status: 'unavailable' };
      }
      return { status: 'unavailable' };
    }
    await response.body?.cancel();

    if (response.status === 429) return { status: 'rate_limited' };
    if (response.status < 300 || response.status >= 400) return { status: 'unresolved', linkType };

    const location = response.headers.get('location');
    if (!location) return { status: 'unavailable' };
    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      return { status: 'unavailable' };
    }
    if (next.protocol !== 'https:' || next.username || next.password || !facebookHost(next.hostname)) {
      return { status: 'unavailable' };
    }
    if (isLoginUrl(next)) return { status: 'login_required' };
    const videoId = idFromUrl(next);
    if (videoId) return { status: 'resolved', videoId, via: 'redirect' };
    current = next;
  }

  return { status: 'unresolved', linkType };
}
