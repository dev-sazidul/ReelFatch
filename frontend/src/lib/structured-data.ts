import { brand, DEFAULT_SITE_URL } from '@/config/brand';
import type { BlogPost } from '@/data/blogs';
import { homeFaq, moreFaq } from '@/content/site';
import { getPlatformById, platformRegistry } from '@/data/platforms';
import { absoluteUrl, siteOrigin } from '@/lib/seo';

export const PARENT_ORGANIZATION = {
  '@type': 'Organization',
  '@id': 'https://futuresolutionai.com/#organization',
  name: 'FutureSolutionAI',
  url: 'https://futuresolutionai.com',
  logo: 'https://futuresolutionai.com/logo.png',
  description: 'Custom Web, SaaS & AI Solutions for modern creators, businesses, and digital ecosystems.',
};

export function getBlogPostJsonLd(post: BlogPost) {
  const postUrl = `${DEFAULT_SITE_URL}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${postUrl}#article`,
    isPartOf: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    url: postUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    author: {
      '@type': 'Organization',
      name: 'FutureSolutionAI Editorial Team',
      url: 'https://futuresolutionai.com',
    },
    publisher: PARENT_ORGANIZATION,
    keywords: post.tags.join(', '),
    articleSection: post.category,
    inLanguage: 'en-US',
  };
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

type Crumb = { name: string; path: string };

function crumbList(crumbs: readonly Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function faqPage(items: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function siteGraph() {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'ReelFetch',
        url: origin,
        email: 'support@reelfetch.com',
        parentOrganization: { '@id': PARENT_ORGANIZATION['@id'] },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'ReelFetch',
        url: origin,
        description: 'Web tool for checking public video links and downloading available qualities.',
        publisher: { '@id': `${origin}/#organization` },
      },
      PARENT_ORGANIZATION,
    ],
  };
}

export function homeGraph() {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${origin}/#webapp`,
        name: 'ReelFetch',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        url: absoluteUrl('/'),
        description: 'Checks a public video link from supported platforms and lists available download qualities.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${origin}/#organization` },
      },
      faqPage(homeFaq),
    ],
  };
}

export function breadcrumbGraph(crumbs: readonly Crumb[]) {
  return { '@context': 'https://schema.org', ...crumbList(crumbs) };
}

export function faqGraph(crumbs: readonly Crumb[], items: { question: string; answer: string }[]) {
  return { '@context': 'https://schema.org', '@graph': [crumbList(crumbs), faqPage(items)] };
}

export function platformGraph(slug: string) {
  const platform = getPlatformById(slug);
  if (!platform) return null;
  return faqGraph(
    [
      { name: 'Home', path: '/' },
      { name: platform.name, path: `/platform/${platform.id}` },
    ],
    platform.faqs,
  );
}

export const infoCrumbs = {
  about: [{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }],
  faq: [{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }],
  contact: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }],
  privacy: [{ name: 'Home', path: '/' }, { name: 'Privacy Policy', path: '/privacy' }],
  terms: [{ name: 'Home', path: '/' }, { name: 'Terms of Service', path: '/terms' }],
  copyright: [{ name: 'Home', path: '/' }, { name: 'Copyright', path: '/copyright' }],
} as const;

export function relatedPlatforms(currentId: string) {
  return platformRegistry.filter((platform) => platform.id !== currentId);
}

export const faqItems = [...homeFaq, ...moreFaq];
