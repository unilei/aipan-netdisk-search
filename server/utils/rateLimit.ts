/**
 * Shared rate limiter with automatic GC for expired entries.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });
 *   if (limiter.isLimited(clientIp)) { ... }
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60 000) */
  windowMs?: number;
  /** Max requests per window (default: 20) */
  maxRequests?: number;
  /** Run GC every N calls to isLimited (default: 100) */
  gcInterval?: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 20;
  const gcInterval = options.gcInterval ?? 100;

  const requests = new Map<string, RateLimitEntry>();
  let callCount = 0;

  /** Remove entries whose resetTime has passed. */
  function gc() {
    const now = Date.now();
    for (const [key, entry] of requests) {
      if (now > entry.resetTime) {
        requests.delete(key);
      }
    }
  }

  /**
   * Returns `true` when the given key has exceeded the rate limit.
   * Automatically cleans up stale entries every `gcInterval` calls.
   */
  function isLimited(key: string): boolean {
    callCount += 1;
    if (callCount % gcInterval === 0) {
      gc();
    }

    const now = Date.now();
    const current = requests.get(key);

    if (!current || now > current.resetTime) {
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return false;
    }

    if (current.count >= maxRequests) {
      return true;
    }

    current.count += 1;
    return false;
  }

  return { isLimited };
}
