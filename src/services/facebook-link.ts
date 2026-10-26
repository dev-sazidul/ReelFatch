export type FacebookLinkKind = 'reel' | 'watch' | 'share' | 'short' | 'other';

const labels: Record<FacebookLinkKind, string> = {
  reel: 'Facebook Reel link',
  watch: 'Facebook Watch link',
  share: 'Facebook share link',
  short: 'fb.watch short link',
  other: 'Facebook page link',
};

export function facebookLinkLabel(kind: FacebookLinkKind) {
  return labels[kind];
}

/** Classifies a URL that has already been recognized as a Facebook host. */
export function classifyFacebookLink(rawUrl: string): FacebookLinkKind {
  const url = new URL(rawUrl.trim());
  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  if (host === 'fb.watch' || host.endsWith('.fb.watch')) return 'short';

  const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/reel' || path.startsWith('/reel/') || path.startsWith('/reels/') || path.includes('/reel/')) {
    return 'reel';
  }
  if (path.startsWith('/share/')) return 'share';
  if (path === '/watch' || path.startsWith('/watch/') || path.includes('/videos/') || path.startsWith('/video/')) {
    return 'watch';
  }
  return 'other';
}
