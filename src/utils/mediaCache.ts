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
      navigator.serviceWorker.register(swUrl.href, { scope: swScope }).catch((err) => {
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
 * - Downloads are executed lazily in the background without affecting app responsiveness.
 */
export async function cacheQuestionImagesOnDevice(questions: Question[]): Promise<void> {
  if (typeof window === 'undefined') return;

  // Run in idle callback or setTimeout to avoid competing with initial UI render
  const schedule = (window as any).requestIdleCallback
    ? (fn: () => void) => (window as any).requestIdleCallback(fn, { timeout: 3000 })
    : (fn: () => void) => setTimeout(fn, 1000);

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

    const seen = new Set<string>();

    for (const q of questions) {
      const primaryPath = resolveQuestionImageSrc(q.image);
      if (!primaryPath || seen.has(primaryPath)) continue;
      seen.add(primaryPath);

      const backupOrigin = q.imageBackup || getBackupImageUrl(q.image) || null;

      if (cache) {
        try {
          // 1. Check if the device already has this image cached under primary path
          const hasPrimary = await cache.match(primaryPath);
          if (hasPrimary) {
            continue; // Already on device, skip!
          }

          // 2. Check if the device already has it from the specified origin URL
          if (backupOrigin) {
            const hasOrigin = await cache.match(backupOrigin);
            if (hasOrigin) {
              // Image was already cached from origin!
              // Clone into primary path so local queries succeed without network download.
              try {
                await cache.put(primaryPath, hasOrigin.clone());
              } catch {
                // Ignore opaque origin put errors
              }
              continue; // Do not redo the cache / do not re-download!
            }
          }

          // 3. Not in cache yet: try downloading primary source first
          try {
            const res = await fetch(primaryPath, { cache: 'default' });
            if (res && res.ok) {
              await cache.put(primaryPath, res.clone());
              continue;
            }
          } catch {
            // Primary local fetch failed, try fallback origin
          }

          // 4. Fallback to origin if primary failed and origin is available
          if (backupOrigin) {
            try {
              const resBackup = await fetch(backupOrigin, { cache: 'default' });
              if (resBackup && resBackup.ok) {
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
    }
  });
}
