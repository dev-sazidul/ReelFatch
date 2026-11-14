import type { Metadata } from 'next';
import { DEFAULT_SITE_URL } from '@/config/brand';
import { getBlogPostBySlug } from '@/data/blogs';
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
  '/blog': {
    title: 'Creator & Video Production Blog — ReelFetch',
    description: 'Expert guides, video optimization strategies, cross-platform media archiving, and creator workflows for high-quality video production.',
    robots: 'index,follow',
  },
};

export function getPageMetadata(pathname: string): PageMetadata {
  const path = pathname.replace(/\/+$/, '') || '/';
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const post = getBlogPostBySlug(blogMatch[1]);
    if (!post) {
      return { title: 'Blog Post Not Found — ReelFetch', description: 'This ReelFetch blog article could not be found.', robots: 'noindex,follow' };
    }
    return {
      title: `${post.title} — ReelFetch`,
      description: post.metaDescription || post.excerpt,
      robots: 'index,follow',
    };
  }

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
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  try {
    const url = new URL(configuredSiteUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : DEFAULT_SITE_URL;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

async function canonicalUrl(pathname: string) {
  const cleanPath = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const origin = configuredOrigin() || DEFAULT_SITE_URL;
  return new URL(cleanPath, `${origin}/`).href;
}
