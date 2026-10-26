import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const publicDirectory = path.join(projectRoot, 'public');
const registryPath = path.join(projectRoot, 'src/data/platforms.json');
const registry = JSON.parse(await readFile(registryPath, 'utf8'));

function getSiteOrigin() {
  const configured = process.env.VITE_PUBLIC_SITE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

const origin = getSiteOrigin();
const publicRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.8', changefreq: 'monthly' },
  ...registry.platforms
    .filter((platform) => platform.status === 'Available')
    .map((platform) => ({ path: `/platform/${platform.id}`, priority: '0.7', changefreq: 'monthly' })),
];

const sitemapUrls = origin
  ? publicRoutes.map(({ path: route, priority, changefreq }) => `  <url>
    <loc>${escapeXml(new URL(route, `${origin}/`).href)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')
  : '  <!-- Set VITE_PUBLIC_SITE_URL to the public HTTPS origin to populate absolute URLs. -->';

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>
`;

const robots = `User-agent: *
Allow: /
${origin ? `Sitemap: ${origin}/sitemap.xml\n` : '# Set VITE_PUBLIC_SITE_URL before publishing to add the absolute sitemap URL.\n'}`;

await Promise.all([
  writeFile(path.join(publicDirectory, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(publicDirectory, 'robots.txt'), robots, 'utf8'),
]);

if (!origin) {
  console.warn('SEO sitemap has no URLs yet. Set VITE_PUBLIC_SITE_URL before publishing.');
}
