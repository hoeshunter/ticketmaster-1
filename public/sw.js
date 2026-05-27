const CACHE_NAME = 'ticketmaster-v8';
const urlsToCache = [
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
