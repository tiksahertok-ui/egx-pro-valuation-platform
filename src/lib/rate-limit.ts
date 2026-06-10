/**
 * In-Memory Rate Limiter
 *
 * P1.3: Token-bucket rate limiting for API routes.
 * Uses IP-based tracking with configurable limits per route.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimiters = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Check if a request should be rate-limited.
 *
 * @param namespace - Rate limit namespace (e.g. 'api/valuation')
 * @param key - Unique key (typically IP address)
 * @param limit - Maximum requests per window
 * @param windowMs - Window duration in milliseconds
 * @returns Object with allowed flag and optional retryAfter seconds
 */
export function checkRateLimit(
  namespace: string,
  key: string,
  limit: number,
  windowMs: number = 60_000,
): { allowed: boolean; retryAfter?: number; remaining: number } {
  if (!rateLimiters.has(namespace)) {
    rateLimiters.set(namespace, new Map());
  }

  const nsMap = rateLimiters.get(namespace)!;
  const now = Date.now();
  const entry = nsMap.get(key);

  if (!entry || now > entry.resetAt) {
    nsMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

/** Pre-configured rate limits for different API routes */
export const RATE_LIMITS = {
  valuation: { limit: 10, windowMs: 60_000 },    // 10 req/min
  stocks: { limit: 60, windowMs: 60_000 },        // 60 req/min
  technical: { limit: 30, windowMs: 60_000 },     // 30 req/min
  report: { limit: 10, windowMs: 60_000 },         // 10 req/min
  supportResistance: { limit: 30, windowMs: 60_000 }, // 30 req/min
} as const;
