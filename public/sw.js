// LID-sim Service Worker for caching question media and offline support
const CACHE_NAME = 'lid-sim-media-v1';
const SW_INIT_TIME = Date.now();
let requestCount = 0;

self.addEventListener('install', () => {
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
    const filename = url.pathname.split('/').pop() || url.pathname;
    const fetchStart = performance.now();
    requestCount++;
    const isColdBoot = requestCount === 1;
    const msSinceWake = Date.now() - SW_INIT_TIME;

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. Match in device cache (by request, pathname, or URL)
        const matchStart = performance.now();
        let cached = await cache.match(request);
        if (!cached) {
          cached = (await cache.match(url.pathname)) || (await cache.match(request.url));
        }
        const matchDuration = (performance.now() - matchStart).toFixed(1);

        if (cached) {
          const totalDuration = (performance.now() - fetchStart).toFixed(1);
          console.debug(
            `[SW:Media] ⚡ HIT: ${filename} (${totalDuration}ms, lookup: ${matchDuration}ms)${
              isColdBoot ? ` [SW wake overhead ~${msSinceWake}ms]` : ''
            }`
          );
          return cached;
        }

        // 2. Fetch from network and store in device cache
        console.warn(`[SW:Media] 🌐 MISS: ${filename} (not in device cache, fetching network...)`);
        try {
          const netStart = performance.now();
          const response = await fetch(request);
          const netDuration = (performance.now() - netStart).toFixed(1);

          // Support standard 200 responses as well as opaque CORS responses from foreign origins
          if (response && (response.status === 200 || response.type === 'opaque')) {
            cache.put(request, response.clone());
            if (url.pathname) {
              cache.put(url.pathname, response.clone()).catch(() => {});
            }
            console.debug(`[SW:Media] 💾 Cached fresh copy of ${filename} (${netDuration}ms network)`);
          }
          return response;
        } catch (err) {
          // If network failed (e.g. offline), try matching by URL string as fallback
          const fallback = (await cache.match(url.pathname)) || (await cache.match(request.url));
          if (fallback) {
            console.debug(`[SW:Media] 🔄 Fallback matched for ${filename}`);
            return fallback;
          }
          throw err;
        }
      })
    );
  }
});
