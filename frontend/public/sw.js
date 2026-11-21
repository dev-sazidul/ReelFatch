const VERSION = 'reelfetch-pwa-1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isSensitive(url, request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
  }
});

function isSensitive(url, request) {
  if (url.pathname.startsWith('/api/')) return true;
  if (request.headers.get('range')) return true;
  if (request.headers.get('RSC') || request.headers.get('Next-Router-Prefetch') || url.searchParams.has('_rsc')) return true;
  const destination = request.destination;
  return destination === 'video' || destination === 'audio';
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/')
    || url.pathname.startsWith('/icons/')
    || url.pathname.startsWith('/splash/')
    || url.pathname === '/favicon.svg'
    || url.pathname === '/offline.html';
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok && isPublicHtml(response)) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
      await trimCache(cache, 20);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && !isPrivate(response)) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

function isPublicHtml(response) {
  const type = response.headers.get('content-type') || '';
  return type.includes('text/html') && !isPrivate(response);
}

function isPrivate(response) {
  const cacheControl = response.headers.get('cache-control') || '';
  return /no-store|private/i.test(cacheControl);
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}
