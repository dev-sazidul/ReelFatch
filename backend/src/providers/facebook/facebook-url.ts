const VIDEO_ID = /^\d{5,20}$/;

export type FacebookLinkType = 'share' | 'short' | 'reel' | 'watch' | 'other';

export type FacebookTarget =
  | { kind: 'video'; videoId: string }
  | { kind: 'unresolved'; linkType: FacebookLinkType };

function cleanPath(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

function numericId(value: string | null) {
  return value && VIDEO_ID.test(value) ? value : null;
}

/** Classifies a Facebook URL. Share codes and fb.watch links are not treated as video ids. */
export function classifyFacebookTarget(url: URL): FacebookTarget {
  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  if (host === 'fb.watch' || host.endsWith('.fb.watch')) return { kind: 'unresolved', linkType: 'short' };

  const path = cleanPath(url.pathname).toLowerCase();
  if (path === '/share' || path.startsWith('/share/')) return { kind: 'unresolved', linkType: 'share' };

  const watchId = numericId(url.searchParams.get('v') ?? url.searchParams.get('video_id'));
  if (path === '/watch' || path.startsWith('/watch/') || path === '/video.php' || path.endsWith('/video.php')) {
    if (watchId) return { kind: 'video', videoId: watchId };
    const last = path.split('/').at(-1) ?? '';
    const pathId = numericId(last);
    return pathId ? { kind: 'video', videoId: pathId } : { kind: 'unresolved', linkType: 'watch' };
  }

  const reel = path.match(/\/reels?\/(\d{5,20})(?:\/|$)/);
  if (path === '/reel' || path.startsWith('/reel/') || path.startsWith('/reels/') || path.includes('/reel/')) {
    return reel ? { kind: 'video', videoId: reel[1] } : { kind: 'unresolved', linkType: 'reel' };
  }

  const videos = path.match(/\/videos\/(\d{5,20})(?:\/|$)/);
  if (videos) return { kind: 'video', videoId: videos[1] };
  if (path.includes('/videos/') || path.startsWith('/video/')) return { kind: 'unresolved', linkType: 'watch' };

  return { kind: 'unresolved', linkType: 'other' };
}

export function unresolvedLinkMessage(linkType: FacebookLinkType) {
  if (linkType === 'share' || linkType === 'short') {
    return 'The public redirect for this share or fb.watch link did not include a numeric video id. ReelFetch does not read the page or use cookies to look further.';
  }
  if (linkType === 'reel' || linkType === 'watch') {
    return 'That Facebook link does not include a numeric video id, so the Graph API cannot look it up.';
  }
  return 'That Facebook link does not look like a Reel, Watch, or video address. Paste the video link that contains the numeric id.';
}
