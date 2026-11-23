import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('platforms.json has honest availability statuses and troubleshooting', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/platforms.json'), 'utf8'));
  const byId = Object.fromEntries(data.platforms.map((p) => [p.id, p]));
  assert.equal(byId.facebook.status, 'Available');
  assert.equal(byId.youtube.status, 'Available');
  assert.equal(byId.tiktok.status, 'Available');
  assert.equal(byId.instagram.status, 'Coming Soon');
  assert.equal(byId.x.status, 'Coming Soon');
  assert.equal(byId.pinterest.status, 'Coming Soon');
  assert.equal(byId.reddit.status, 'Coming Soon');
  for (const p of data.platforms) {
    assert.ok(Array.isArray(p.troubleshooting) && p.troubleshooting.length >= 2, `${p.id} missing troubleshooting`);
  }
});

test('sitemap.xml includes lastmod and excludes Coming Soon platforms', () => {
  const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  assert.match(sitemap, /\/platform\/facebook/);
  assert.match(sitemap, /\/platform\/youtube/);
  assert.match(sitemap, /\/platform\/tiktok/);
  assert.doesNotMatch(sitemap, /\/platform\/instagram/);
  assert.doesNotMatch(sitemap, /\/platform\/reddit/);
  assert.doesNotMatch(sitemap, /\/platform\/pinterest/);
  assert.doesNotMatch(sitemap, /\/platform\/x</);
});

test('og-image.png exists and is a valid PNG', () => {
  const buf = fs.readFileSync(path.join(root, 'public/og-image.png'));
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('structured-data.ts has no 1,000+ sites claim or unused getWebsiteJsonLd', () => {
  const sd = fs.readFileSync(path.join(root, 'src/lib/structured-data.ts'), 'utf8');
  assert.doesNotMatch(sd, /1,000\+/);
  assert.doesNotMatch(sd, /getWebsiteJsonLd/);
});

test('home.tsx does not expose InterfacePreview demo widget', () => {
  const home = fs.readFileSync(path.join(root, 'src/views/home.tsx'), 'utf8');
  assert.doesNotMatch(home, /InterfacePreview/);
});

test('backend-api.ts does not buffer Blob in saveFile', () => {
  const api = fs.readFileSync(path.join(root, 'src/services/backend-api.ts'), 'utf8');
  assert.doesNotMatch(api, /new Blob/);
  assert.match(api, /triggerNativeDownload/);
  assert.match(api, /filename\\\*=UTF-8/);
});
