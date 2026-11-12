import { homeFaq, moreFaq } from '@/content/site';
import { getPlatformById, platformRegistry } from '@/data/platforms';
import { absoluteUrl, siteOrigin } from '@/lib/seo';

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
        name: 'ReelFetch',
        url: origin,
        email: 'support@reelfetch.com',
      },
      {
        '@type': 'WebSite',
        name: 'ReelFetch',
        url: origin,
        description: 'Web tool for checking public video links and saving a file when the source provides one.',
        publisher: { '@type': 'Organization', name: 'ReelFetch', url: origin },
      },
    ],
  };
}

export function homeGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'ReelFetch',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        url: absoluteUrl('/'),
        description: 'Checks a public video link and lists the download qualities that source returns.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
