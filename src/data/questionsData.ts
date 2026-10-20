import { LOCAL_IMAGE_CACHE } from './bundeslaender';

/**
 * Resolves a raw question image path to its correct local or remote asset URL.
 * - Primary source: local cached assets (`assets/cache/...`)
 * - Legacy fallback: maps known origin URLs to local cache equivalents
 * - Coat of arms fallback: `assets/coats/{code}.png`
 */
export function resolveQuestionImageSrc(imageRaw?: string): string | null {
  if (!imageRaw || imageRaw === '-' || imageRaw.trim() === '') return null;
  const trimmed = imageRaw.trim();

  // 1. Local asset reference (primary source)
  if (trimmed.startsWith('assets/') || trimmed.startsWith('/assets/')) {
    return trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  }

  // 2. Check local cache mapping (fallback for legacy origin URLs)
  if (LOCAL_IMAGE_CACHE[trimmed]) {
    return LOCAL_IMAGE_CACHE[trimmed];
  }

  // 3. HTTP/HTTPS url
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  let fileName = trimmed;
  if (!fileName.includes('.')) fileName += '.png';
  return `assets/coats/${fileName}`;
}
