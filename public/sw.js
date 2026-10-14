// LID-sim Service Worker for caching question media and offline support
const CACHE_NAME = 'lid-sim-media-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Intercept media assets: local assets/cache/ or external origin foreignvasi.com
  const isLocalMedia = url.pathname.includes('/assets/cache/') || url.pathname.includes('/assets/coats/');
  const isOriginMedia = url.hostname === 'foreignvasi.com';

  if (isLocalMedia || isOriginMedia) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. Direct match in device cache
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }

        // 2. Fetch from network and store in device cache
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          // If network failed (e.g. offline), try matching by URL string as fallback
          const fallback = await cache.match(url.pathname) || await cache.match(request.url);
          if (fallback) return fallback;
          throw err;
        }
      })
    );
  }
});
