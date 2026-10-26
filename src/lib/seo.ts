import { getPlatformById, getPlatformStatus } from '@/data/platforms';
import { getAuthorizedVideoProvider } from '@/services/platform-integrations';

export type PageMetadata = {
  title: string;
  description: string;
  robots: 'index,follow' | 'noindex,follow';
};

const staticPageMetadata: Record<string, PageMetadata> = {
  '/': {
    title: 'ReelFetch — Download Facebook Reels & Videos',
    description: 'Paste a Facebook video or Reel link to check available download options. ReelFetch is an independent tool and only downloads when an authorized source is connected.',
    robots: 'index,follow',
  },
  '/about': {
    title: 'About ReelFetch — Clear Video Link Guidance',
    description: 'Learn about ReelFetch, an independent video-link interface concept built around clear status, responsible use, and honest limitations.',
    robots: 'index,follow',
  },
  '/faq': {
    title: 'Video Link FAQ — ReelFetch',
    description: 'Answers about platform URL detection, available quality options, downloads, mobile browsers, and the limits of this front-end demo.',
    robots: 'index,follow',
  },
  '/contact': {
    title: 'Contact ReelFetch — Setup Information',
    description: 'Contact details for ReelFetch have not been configured. This page explains what needs to be added before publication.',
    robots: 'noindex,follow',
  },
  '/privacy': {
    title: 'Privacy Draft — ReelFetch',
    description: 'Draft privacy information for ReelFetch. Review and update before publishing an operational service.',
    robots: 'noindex,follow',
  },
  '/terms': {
    title: 'Terms Draft — ReelFetch',
    description: 'Draft terms for the ReelFetch interface demonstration. These terms require review before publication.',
    robots: 'noindex,follow',
  },
  '/copyright': {
    title: 'Copyright and Takedown Draft — ReelFetch',
    description: 'Draft copyright and takedown information for ReelFetch. Configure a monitored contact and review before publication.',
    robots: 'noindex,follow',
  },
};

export function getPageMetadata(pathname: string): PageMetadata {
  const path = pathname.replace(/\/+$/, '') || '/';
  const platformMatch = path.match(/^\/platform\/([^/]+)$/);
  if (platformMatch) {
    const platform = getPlatformById(platformMatch[1]);
    if (!platform) {
      return { title: 'Page not found — ReelFetch', description: 'This ReelFetch page could not be found.', robots: 'noindex,follow' };
    }
    const isAvailable = getPlatformStatus(platform.id) === 'Available'
      && Boolean(getAuthorizedVideoProvider(platform.id));
    return {
      title: platform.seoTitle,
      description: platform.seoDescription,
      robots: isAvailable ? 'index,follow' : 'noindex,follow',
    };
  }

  return staticPageMetadata[path] ?? {
    title: 'Page not found — ReelFetch',
    description: 'This ReelFetch page could not be found.',
    robots: 'noindex,follow',
  };
}

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

export function applyPageMetadata(pathname: string, metadata: PageMetadata) {
  document.title = metadata.title;
  setMeta('name', 'description', metadata.description);
  setMeta('name', 'robots', metadata.robots);
  setMeta('property', 'og:title', metadata.title);
  setMeta('property', 'og:description', metadata.description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', canonicalUrl(pathname));
  setMeta('name', 'twitter:title', metadata.title);
  setMeta('name', 'twitter:description', metadata.description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl(pathname);
}

function canonicalUrl(pathname: string) {
  const cleanPath = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
  try {
    const origin = configuredSiteUrl ? new URL(configuredSiteUrl).origin : window.location.origin;
    return new URL(cleanPath, `${origin}/`).href;
  } catch {
    return new URL(cleanPath, window.location.origin).href;
  }
}
