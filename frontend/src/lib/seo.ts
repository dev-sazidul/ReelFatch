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
    title: 'Online Video Downloader for Reels & Shorts | ReelFetch',
    description: 'Paste a public YouTube, Instagram, TikTok, Facebook, X, Reddit, or Pinterest link. ReelFetch lists the download qualities that source actually returns.',
    robots: 'index,follow',
  },
  '/about': {
    title: 'About ReelFetch | Online Video Downloader',
    description: 'ReelFetch is an independent web tool for checking public video links and saving a file when the source provides one. No account is required.',
    robots: 'index,follow',
  },
  '/faq': {
    title: 'Video Downloader FAQ | ReelFetch',
    description: 'Answers about public YouTube, Instagram, TikTok, and Facebook links, saved file location, quality limits, copyright, and what ReelFetch does not download.',
    robots: 'index,follow',
  },
  '/contact': {
    title: 'Contact ReelFetch Support',
    description: 'Contact ReelFetch for product questions or a copyright notice. Support email and the takedown policy are listed on this page.',
    robots: 'index,follow',
  },
  '/privacy': {
    title: 'Privacy Policy | ReelFetch',
    description: 'How ReelFetch handles video links, temporary files, Microsoft Clarity, and Google AdSense. No account is required to use the downloader.',
    robots: 'index,follow',
  },
  '/terms': {
    title: 'Terms of Service | ReelFetch',
    description: 'Terms for using ReelFetch to save public videos you have permission to keep. Availability depends on the source platform.',
    robots: 'index,follow',
  },
  '/copyright': {
    title: 'Copyright & Takedown Policy | ReelFetch',
    description: 'How to send ReelFetch a copyright notice. ReelFetch does not host a video library and is not affiliated with the source platforms.',
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
export function siteOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      const url = new URL(configuredSiteUrl);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
    } catch {
      /* Use the public site when the env value is not a valid origin. */
    }
  }
  return 'https://bestdownloader.site';
}

export function absoluteUrl(pathname: string) {
  const cleanPath = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  if (cleanPath === '/') return siteOrigin();
  return new URL(cleanPath, `${siteOrigin()}/`).href;
}

export async function buildMetadata(pathname: string): Promise<Metadata> {
  const metadata = getPageMetadata(pathname);
  const canonical = absoluteUrl(pathname);
  const index = metadata.robots.startsWith('index');
  return {
    title: metadata.title,
    description: metadata.description,
    robots: {
      index,
      follow: true,
      googleBot: { index, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    alternates: { canonical },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      url: canonical,
      siteName: 'ReelFetch',
      locale: 'en_US',
    },
    twitter: { card: 'summary', title: metadata.title, description: metadata.description },
  };
}
