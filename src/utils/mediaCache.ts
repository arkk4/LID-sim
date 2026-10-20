import { Question } from '../types';
import { getBackupImageUrl } from '../data/bundeslaender';
import { resolveQuestionImageSrc } from '../data/questionsData';

export const MEDIA_CACHE_NAME = 'lid-sim-media-v1';

/**
 * Register lightweight media caching service worker if supported
 */
export function registerMediaServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Wait until window load so critical rendering is never blocked
  window.addEventListener('load', () => {
    try {
      // Explicitly anchor SW URL and scope to baseURI for GitHub Pages repo subpaths (e.g. /LID-sim/)
      const swUrl = new URL('sw.js', document.baseURI || window.location.href);
      const swScope = new URL('./', swUrl).pathname;
      navigator.serviceWorker.register(swUrl.href, { scope: swScope, updateViaCache: 'none' }).catch((err) => {
        console.debug('ServiceWorker registration skipped:', err);
      });
    } catch (err) {
      console.debug('ServiceWorker setup error:', err);
    }
  });
}

/**
 * Pre-cache all question images onto the device.
 * Smart behavior:
 * - If already cached on the device (either under local path or the backup origin),
 *   it avoids re-downloading or re-doing the cache.
 * - Downloads are executed in small parallel batches (4 concurrent) in idle time
 *   to complete within ~1 second without degrading UI responsiveness.
 */
export async function cacheQuestionImagesOnDevice(questions: Question[]): Promise<void> {
  if (typeof window === 'undefined') return;

  // Run in idle callback or setTimeout to avoid competing with initial UI render
  const schedule = (window as any).requestIdleCallback
    ? (fn: () => void) => (window as any).requestIdleCallback(fn, { timeout: 3000 })
    : (fn: () => void) => setTimeout(fn, 800);

  schedule(async () => {
    const hasCacheStorage = 'caches' in window;
    let cache: Cache | null = null;
    if (hasCacheStorage) {
      try {
        cache = await caches.open(MEDIA_CACHE_NAME);
      } catch (e) {
        console.debug('CacheStorage unavailable:', e);
      }
    }

    const uniqueItems: { primaryPath: string; backupOrigin: string | null }[] = [];
    const seen = new Set<string>();

    for (const q of questions) {
      const primaryPath = resolveQuestionImageSrc(q.image);
      if (!primaryPath || seen.has(primaryPath)) continue;
      seen.add(primaryPath);
      const backupOrigin = q.imageBackup || getBackupImageUrl(q.image) || null;
      uniqueItems.push({ primaryPath, backupOrigin });
    }

    const CONCURRENCY = 4;
    for (let i = 0; i < uniqueItems.length; i += CONCURRENCY) {
      const batch = uniqueItems.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async ({ primaryPath, backupOrigin }) => {
          if (cache) {
            try {
              // 1. Check if the device already has this image cached under primary path
              const hasPrimary = await cache.match(primaryPath);
              if (hasPrimary) return;

              // 2. Check if the device already has it from the specified origin URL
              if (backupOrigin) {
                const hasOrigin = await cache.match(backupOrigin);
                if (hasOrigin) {
                  try {
                    await cache.put(primaryPath, hasOrigin.clone());
                  } catch {
                    // Ignore opaque origin put errors
                  }
                  return;
                }
              }

              // 3. Not in cache yet: try downloading primary source first
              try {
                const res = await fetch(primaryPath, { cache: 'default' });
                if (res && res.ok) {
                  await cache.put(primaryPath, res.clone());
                  return;
                }
              } catch {
                // Primary local fetch failed, try fallback origin
              }

              // 4. Fallback to origin if primary failed and origin is available
              if (backupOrigin) {
                try {
                  const resBackup = await fetch(backupOrigin, { cache: 'default' });
                  if (resBackup && (resBackup.ok || resBackup.type === 'opaque')) {
                    await cache.put(primaryPath, resBackup.clone());
                    await cache.put(backupOrigin, resBackup.clone());
                  }
                } catch {
                  // Network error, will retry on next session
                }
              }
            } catch (err) {
              console.debug('Failed to cache image on device:', primaryPath, err);
            }
          } else {
            // Fallback when CacheStorage is disabled/unsupported: warm browser HTTP cache
            const img = new Image();
            img.src = primaryPath;
          }
        })
      );
    }
  });
}

/**
 * Preloads surrounding images in the active question pool into the browser's in-memory cache
 * (both 1 behind and 3 ahead). When the user navigates, the image renders immediately from RAM (0-5ms),
 * completely bypassing Service Worker sleep / cold start latency.
 */
const memoryWarmedUrls = new Set<string>();

export function preloadUpcomingImages(questions: Question[], currentIndex: number): void {
  if (typeof window === 'undefined' || !questions || !questions.length) return;

  const offsets = [-1, 1, 2, 3];
  for (const offset of offsets) {
    const idx = currentIndex + offset;
    if (idx < 0 || idx >= questions.length) continue;
    const q = questions[idx];
    if (!q) continue;

    const src = resolveQuestionImageSrc(q.image);
    if (src && !memoryWarmedUrls.has(src)) {
      memoryWarmedUrls.add(src);
      const img = new Image();
      img.src = src;
    }
  }
}
