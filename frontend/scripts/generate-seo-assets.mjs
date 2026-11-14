import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import nextEnv from '@next/env';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
// Use the same production .env precedence and expansion as `next build`.
nextEnv.loadEnvConfig(projectRoot, false);
const publicDirectory = path.join(projectRoot, 'public');
const registryPath = path.join(projectRoot, 'src/data/platforms.json');
const registry = JSON.parse(await readFile(registryPath, 'utf8'));

// Import blogs dynamically from TS
let blogSlugs = [];
try {
  const { blogs } = await import('../src/data/blogs.ts');
  blogSlugs = blogs.map((b) => b.slug);
} catch (err) {
  // Fallback: extract slugs via regex if TS loader fails
  const blogsContent = await readFile(path.join(projectRoot, 'src/data/blogs.ts'), 'utf8');
  const matches = [...blogsContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
  blogSlugs = matches.map((m) => m[1]);
}

const DEFAULT_ORIGIN = 'https://bestdownloader.site';

function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_ORIGIN;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return DEFAULT_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

const origin = getSiteOrigin();
const publicRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/copyright', priority: '0.3', changefreq: 'yearly' },
  ...blogSlugs.map((slug) => ({ path: `/blog/${slug}`, priority: '0.7', changefreq: 'monthly' })),
  ...registry.platforms
    .filter((platform) => platform.status === 'Available')
    .map((platform) => ({ path: `/platform/${platform.id}`, priority: '0.7', changefreq: 'monthly' })),
];

const sitemapUrls = publicRoutes
  .map(
    ({ path: route, priority, changefreq }) => `  <url>
    <loc>${escapeXml(new URL(route, `${origin}/`).href)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`;

await Promise.all([
  writeFile(path.join(publicDirectory, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(publicDirectory, 'robots.txt'), robots, 'utf8'),
]);

console.log(`Generated SEO sitemap with ${publicRoutes.length} URLs pointing to ${origin}`);
