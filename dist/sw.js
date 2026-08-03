const CACHE_NAME = 'ticketmaster-v10';

// Static assets that never change between sessions — cache them aggressively.
// Vite fingerprints JS/CSS bundles, so a new deploy = new filename = new cache entry.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-20x20.png',
  '/icons/icon-40x40.png',
  '/icons/icon-60x60.png',
  '/icons/icon-76x76.png',
  '/icons/icon-120x120.png',
  '/icons/icon-152x152.png',
  '/icons/icon-167x167.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/splash/iphone-17-pro-max-splash.png',
  '/splash/iphone-17-pro-splash.png',
  '/splash/iphone-15-pro-max-splash.png',
  '/splash/iphone-15-pro-splash.png',
  '/splash/iphone-15-plus-splash.png',
  '/splash/iphone-15-mini-splash.png',
  '/splash/iphone-15-splash.png',
  '/splash/iphone-14-pro-max-splash.png',
  '/splash/iphone-14-pro-splash.png',
  '/splash/iphone-14-pro-max-legacy-splash.png',
  '/splash/iphone-14-pro-legacy-splash.png',
  '/splash/iphone-14-mini-splash.png',
  '/splash/iphone-14-splash.png',
  '/splash/iphone-11-pro-max-splash.png',
  '/splash/iphone-x-splash.png',
  '/splash/iphone-11-splash.png',
  '/splash/iphone-plus-splash.png',
  '/splash/iphone-8-splash.png',
  '/splash/iphone-se-splash.png',
  '/splash/ipad-pro-129-splash.png',
  '/splash/ipad-pro-11-splash.png',
  '/splash/ipad-mini-splash.png'
];

// ── Install: precache all static assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: tiered caching strategy ───────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache API calls or uploads — always go to the network.
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') return;

  // 2. JS/CSS bundles, fonts, icons, images, splashes, uploads → CACHE FIRST.
  //    Vite fingerprints bundles so stale content is never an issue.
  //    Uploads are event images stored on the backend.
  const isCacheFirst =
    /\.(js|css|woff2?|ttf|otf|eot)$/.test(url.pathname) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/splash/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/assets/');

  if (isCacheFirst) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        // Not in cache yet — fetch, store, return.
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. PNG/JPG/WebP images (non-icon/splash) → CACHE FIRST with network fallback.
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 4. HTML / navigation → NETWORK FIRST, fall back to cache.
  //    Ensures the user always gets the latest shell if online,
  //    but the app still opens when offline/slow.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
  );
});
