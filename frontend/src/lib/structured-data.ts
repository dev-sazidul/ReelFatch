import { brand, DEFAULT_SITE_URL } from '@/config/brand';
import type { BlogPost } from '@/data/blogs';

export const PARENT_ORGANIZATION = {
  '@type': 'Organization',
  '@id': 'https://futuresolutionai.com/#organization',
  name: 'FutureSolutionAI',
  url: 'https://futuresolutionai.com',
  logo: 'https://futuresolutionai.com/logo.png',
  description: 'Custom Web, SaaS & AI Solutions for modern creators, businesses, and digital ecosystems.',
  sameAs: [
    'https://futuresolutionai.com',
    'https://bestconvert.site',
    'https://imagecustomize.site',
    DEFAULT_SITE_URL,
  ],
};

export const ECOSYSTEM_LINKS = [
  'https://futuresolutionai.com',
  'https://bestconvert.site',
  'https://imagecustomize.site',
];

export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${DEFAULT_SITE_URL}/#webapp`,
        name: brand.name,
        alternateName: `${brand.name} Video Downloader`,
        url: DEFAULT_SITE_URL,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        description: 'Free online universal video and reel downloader for Facebook, Instagram, YouTube, TikTok, X, and 1,000+ sites.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        creator: PARENT_ORGANIZATION,
        publisher: PARENT_ORGANIZATION,
        parentOrganization: PARENT_ORGANIZATION,
        sameAs: ECOSYSTEM_LINKS,
      },
      {
        '@type': 'WebSite',
        '@id': `${DEFAULT_SITE_URL}/#website`,
        url: DEFAULT_SITE_URL,
        name: brand.name,
        description: 'High-speed universal video and reel downloader built for personal offline viewing across modern devices.',
        publisher: PARENT_ORGANIZATION,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${DEFAULT_SITE_URL}/?url={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        sameAs: ECOSYSTEM_LINKS,
      },
      PARENT_ORGANIZATION,
    ],
  };
}

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

