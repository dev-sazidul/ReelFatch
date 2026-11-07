import type { Metadata } from 'next';
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

/**
 * Server-rendered page metadata: the same title, description, robots, Open Graph,
 * Twitter, and canonical tags the Vite app set in the browser after each navigation.
 */
export async function buildMetadata(pathname: string): Promise<Metadata> {
  const metadata = getPageMetadata(pathname);
  const canonical = await canonicalUrl(pathname);
  return {
    title: metadata.title,
    description: metadata.description,
    robots: metadata.robots,
    alternates: { canonical },
    openGraph: { title: metadata.title, description: metadata.description, type: 'website', url: canonical },
    twitter: { card: 'summary_large_image', title: metadata.title, description: metadata.description },
  };
}

function configuredOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredSiteUrl) return null;
  try {
    const url = new URL(configuredSiteUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

async function canonicalUrl(pathname: string) {
  const cleanPath = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  // Without NEXT_PUBLIC_SITE_URL, use the host the page was requested on, as the browser did.
  let origin = configuredOrigin();
  if (!origin) {
    const { headers } = await import('next/headers');
    const host = (await headers()).get('host') || 'localhost';
    origin = `http://${host}`;
  }
  return new URL(cleanPath, `${origin}/`).href;
}
