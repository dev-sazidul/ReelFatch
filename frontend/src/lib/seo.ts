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
    title: 'ReelFetch — Universal Video & Reel Downloader',
    description: 'Free online video downloader for Facebook, Instagram, YouTube, TikTok, X, and 1,000+ sites. Download public reels, shorts, and videos in HD MP4.',
    robots: 'index,follow',
  },
  '/about': {
    title: 'About ReelFetch — Fast & Free Universal Video Downloader',
    description: 'Learn about ReelFetch, the high-performance online tool for saving videos and reels from major social platforms.',
    robots: 'index,follow',
  },
  '/faq': {
    title: 'FAQ — ReelFetch Video Downloader',
    description: 'Frequently asked questions about downloading videos from YouTube, Instagram, TikTok, Facebook, audio extraction, and device support.',
    robots: 'index,follow',
  },
  '/contact': {
    title: 'Contact ReelFetch',
    description: 'Get in touch with the ReelFetch team for technical support, inquiries, and feedback.',
    robots: 'index,follow',
  },
  '/privacy': {
    title: 'Privacy Policy — ReelFetch',
    description: 'ReelFetch privacy policy. Learn how we handle video links without tracking or persistent storage.',
    robots: 'index,follow',
  },
  '/terms': {
    title: 'Terms of Service — ReelFetch',
    description: 'ReelFetch terms of service and acceptable use guidelines.',
    robots: 'index,follow',
  },
  '/copyright': {
    title: 'Copyright & DMCA Policy — ReelFetch',
    description: 'ReelFetch copyright, DMCA, and content takedown policy.',
    robots: 'index,follow',
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
