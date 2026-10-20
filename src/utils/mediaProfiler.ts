/**
 * Real-time performance profiling for question image loading.
 *
 * Tracks:
 * 1. Total wall-clock time from question navigation to image paint (`onLoad`).
 * 2. Service Worker cold start / wake-up latency via Resource Timing (`fetchStart - workerStart`).
 * 3. Network / CacheStorage transfer duration.
 * 4. Image decode / rendering overhead.
 *
 * Inspect anytime in DevTools Console:
 *   window.__lidMediaProfile.table()
 *   window.__lidMediaProfile.summary()
 */

export interface ImageProfileRecord {
  questionNum: string;
  src: string;
  totalTimeMs: number;
  swWakeupMs: number;
  transferDurationMs: number;
  transferSize: number;
  deliveryType: string;
  cacheStatus: 'HIT' | 'MISS' | 'MEMORY' | 'UNKNOWN';
  timestamp: string;
}

const history: ImageProfileRecord[] = [];
const pendingStarts = new Map<string, number>();

export function markImageLoadStart(src: string): void {
  pendingStarts.set(src, performance.now());
}

export function markImageLoadEnd(
  src: string,
  questionNum: string,
  onRecord?: (rec: ImageProfileRecord) => void
): void {
  const startTime = pendingStarts.get(src);
  const now = performance.now();
  pendingStarts.delete(src);

  const totalTimeMs = startTime !== undefined ? Math.round(now - startTime) : 0;

  // Wait a tick for PerformanceObserver / ResourceTiming entry to finalize
  setTimeout(() => {
    let swWakeupMs = 0;
    let transferDurationMs = 0;
    let transferSize = -1;
    let deliveryType = 'unknown';
    let cacheStatus: ImageProfileRecord['cacheStatus'] = 'UNKNOWN';

    // Match resource timing entry
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const matching = entries
      .filter((e) => e.name === src || src.endsWith(e.name) || e.name.endsWith(src))
      .pop();

    if (matching) {
      transferDurationMs = Math.round(matching.duration);
      transferSize = matching.transferSize;
      const isFromWorker = Boolean(matching.workerStart && matching.workerStart > 0);

      // If handled by Service Worker:
      // workerStart is the timestamp when the browser started waking/dispatching to the SW.
      // fetchStart is when the SW actually started handling the fetch.
      if (matching.workerStart && matching.workerStart > 0 && matching.fetchStart >= matching.workerStart) {
        swWakeupMs = Math.round(matching.fetchStart - matching.workerStart);
      }

      // Detection heuristic:
      // In Chrome, SW CacheStorage responses have deliveryType="" and transferSize > 0.
      // However, local cache lookup duration is near-instant (< 60ms).
      const isExplicitCache = (matching as any).deliveryType === 'cache' || matching.transferSize === 0;
      const isFastWorkerCache = isFromWorker && transferDurationMs < 75;

      if (totalTimeMs < 20 && transferDurationMs < 15) {
        cacheStatus = 'MEMORY';
        deliveryType = 'memory-cache';
      } else if (isExplicitCache || isFastWorkerCache) {
        cacheStatus = 'HIT';
        deliveryType = isFromWorker ? 'service-worker-cache' : 'http-cache';
      } else {
        cacheStatus = 'MISS';
        deliveryType = 'network';
      }
    } else if (totalTimeMs < 30) {
      // Near-instant load with no network entry means Blink in-memory image cache hit
      cacheStatus = 'MEMORY';
      deliveryType = 'memory-cache';
    }

    const record: ImageProfileRecord = {
      questionNum,
      src: src.split('/').pop() || src,
      totalTimeMs,
      swWakeupMs,
      transferDurationMs,
      transferSize,
      deliveryType,
      cacheStatus,
      timestamp: new Date().toLocaleTimeString(),
    };

    history.push(record);
    if (history.length > 50) history.shift();

    // Console output with color-coded alerts for >500ms
    const isSlow = totalTimeMs > 400;
    const badgeColor = isSlow ? '#ef4444' : '#22c55e';
    const statusNote = swWakeupMs > 200
      ? ` [⚠️ SW cold boot: ${swWakeupMs}ms]`
      : cacheStatus === 'MEMORY'
        ? ` [⚡ MEMORY]`
        : cacheStatus === 'HIT'
          ? ` [⚡ HIT: ${transferDurationMs}ms]`
          : ` [🌐 Network download: ${transferDurationMs}ms]`;

    console.groupCollapsed(
      `%c[ImgProfile]%c Q#${questionNum}: %c${totalTimeMs}ms%c${statusNote}`,
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;',
      `color: ${badgeColor}; font-weight: bold;`,
      'color: #71717a;'
    );
    console.log('Metrics Breakdown:', {
      question: questionNum,
      file: record.src,
      totalLatency: `${totalTimeMs} ms`,
      swColdStartOverhead: `${swWakeupMs} ms`,
      swTransferDuration: `${transferDurationMs} ms`,
      decodeAndRender: `${Math.max(0, totalTimeMs - transferDurationMs)} ms`,
      cacheStatus,
      deliveryType,
    });
    console.groupEnd();

    if (onRecord) onRecord(record);
  }, 50);
}

// Global console helper
if (typeof window !== 'undefined') {
  (window as any).__lidMediaProfile = {
    getHistory: () => history,
    table: () => console.table(history),
    clear: () => {
      history.length = 0;
      console.log('[ImgProfile] Cleared history.');
    },
    summary: () => {
      if (history.length === 0) {
        console.log('[ImgProfile] No images profiled yet.');
        return;
      }
      const avg = Math.round(history.reduce((a, b) => a + b.totalTimeMs, 0) / history.length);
      const max = Math.max(...history.map((r) => r.totalTimeMs));
      const slowColdBoots = history.filter((r) => r.swWakeupMs > 200);
      console.log(
        `%c[ImgProfile Summary]%c Sampled ${history.length} loads | Avg: ${avg}ms | Max: ${max}ms | SW Cold Starts (>200ms): ${slowColdBoots.length}`,
        'color: #3b82f6; font-weight: bold;',
        'color: inherit;'
      );
      console.table(history);
    },
  };
}
