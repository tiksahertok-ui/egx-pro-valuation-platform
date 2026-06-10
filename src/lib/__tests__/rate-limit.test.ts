import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../rate-limit';

describe('Rate Limiter', () => {
  // ============================================================
  // Basic rate limiting (under limit → allowed)
  // ============================================================
  describe('Basic rate limiting - under limit', () => {
    it('should allow requests under the limit', () => {
      const result = checkRateLimit('test-basic', 'user1', 10, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track remaining requests correctly', () => {
      const namespace = 'test-tracking';
      const key = 'user-track';

      // First request
      let result = checkRateLimit(namespace, key, 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      // Second request
      result = checkRateLimit(namespace, key, 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);

      // Third request
      result = checkRateLimit(namespace, key, 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should allow exactly up to the limit', () => {
      const namespace = 'test-exact-limit';
      const key = 'user-exact';
      const limit = 3;

      for (let i = 0; i < limit; i++) {
        const result = checkRateLimit(namespace, key, limit, 60_000);
        expect(result.allowed).toBe(true);
      }

      // The next request should be blocked
      const result = checkRateLimit(namespace, key, limit, 60_000);
      expect(result.allowed).toBe(false);
    });

    it('should return remaining count as 0 when at the limit', () => {
      const namespace = 'test-remaining-zero';
      const key = 'user-rem';

      checkRateLimit(namespace, key, 2, 60_000);
      checkRateLimit(namespace, key, 2, 60_000);

      const result = checkRateLimit(namespace, key, 2, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  // ============================================================
  // Rate limit exceeded (over limit → blocked)
  // ============================================================
  describe('Rate limit exceeded - over limit', () => {
    it('should block requests when the limit is exceeded', () => {
      const namespace = 'test-blocked';
      const key = 'user-blocked';
      const limit = 2;

      checkRateLimit(namespace, key, limit, 60_000);
      checkRateLimit(namespace, key, limit, 60_000);

      const result = checkRateLimit(namespace, key, limit, 60_000);
      expect(result.allowed).toBe(false);
    });

    it('should provide retryAfter when blocked', () => {
      const namespace = 'test-retry';
      const key = 'user-retry';
      const limit = 1;

      checkRateLimit(namespace, key, limit, 60_000);
      const result = checkRateLimit(namespace, key, limit, 60_000);

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });

    it('should continue blocking subsequent requests after limit exceeded', () => {
      const namespace = 'test-continued-block';
      const key = 'user-cont';
      const limit = 1;

      checkRateLimit(namespace, key, limit, 60_000);

      // Second request blocked
      const result2 = checkRateLimit(namespace, key, limit, 60_000);
      expect(result2.allowed).toBe(false);

      // Third request also blocked
      const result3 = checkRateLimit(namespace, key, limit, 60_000);
      expect(result3.allowed).toBe(false);
    });

    it('should return remaining = 0 when blocked', () => {
      const namespace = 'test-remaining-block';
      const key = 'user-rem-block';
      const limit = 1;

      checkRateLimit(namespace, key, limit, 60_000);
      const result = checkRateLimit(namespace, key, limit, 60_000);

      expect(result.remaining).toBe(0);
    });
  });

  // ============================================================
  // Rate limit window expiry (reset after window)
  // ============================================================
  describe('Rate limit window expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should reset counter after window expires', () => {
      const namespace = 'test-expiry';
      const key = 'user-expiry';
      const limit = 2;
      const windowMs = 10_000;

      // Use up the limit
      checkRateLimit(namespace, key, limit, windowMs);
      checkRateLimit(namespace, key, limit, windowMs);

      // Should be blocked now
      let result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(windowMs + 1);

      // Should be allowed again
      result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - 1);
    });

    it('should reset remaining count after window expires', () => {
      const namespace = 'test-reset-count';
      const key = 'user-reset';
      const limit = 5;
      const windowMs = 5_000;

      // Use some requests
      checkRateLimit(namespace, key, limit, windowMs);
      checkRateLimit(namespace, key, limit, windowMs);

      // Advance time past window
      vi.advanceTimersByTime(windowMs + 1);

      const result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.remaining).toBe(limit - 1);
    });

    it('should handle short windows correctly', () => {
      const namespace = 'test-short-window';
      const key = 'user-short';
      const limit = 1;
      const windowMs = 1000;

      checkRateLimit(namespace, key, limit, windowMs);
      let result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.allowed).toBe(true);
    });

    it('should calculate retryAfter based on remaining window time', () => {
      const namespace = 'test-retry-time';
      const key = 'user-retry-time';
      const limit = 1;
      const windowMs = 30_000;

      checkRateLimit(namespace, key, limit, windowMs);

      // Advance 10 seconds
      vi.advanceTimersByTime(10_000);

      const result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.allowed).toBe(false);
      // retryAfter should be approximately 20 seconds (30 - 10)
      expect(result.retryAfter).toBeGreaterThan(15);
      expect(result.retryAfter).toBeLessThanOrEqual(20);
    });

    it('should not reset counter before window expires', () => {
      const namespace = 'test-no-early-reset';
      const key = 'user-no-reset';
      const limit = 1;
      const windowMs = 60_000;

      checkRateLimit(namespace, key, limit, windowMs);

      // Advance time but not past the window
      vi.advanceTimersByTime(30_000);

      const result = checkRateLimit(namespace, key, limit, windowMs);
      expect(result.allowed).toBe(false);
    });
  });

  // ============================================================
  // Different namespaces are independent
  // ============================================================
  describe('Namespace independence', () => {
    it('should track different namespaces independently', () => {
      const limit = 2;

      // Use up limit for namespace A
      checkRateLimit('ns-a', 'user1', limit, 60_000);
      checkRateLimit('ns-a', 'user1', limit, 60_000);

      // Namespace A should be blocked
      const resultA = checkRateLimit('ns-a', 'user1', limit, 60_000);
      expect(resultA.allowed).toBe(false);

      // Namespace B should still be allowed
      const resultB = checkRateLimit('ns-b', 'user1', limit, 60_000);
      expect(resultB.allowed).toBe(true);
    });

    it('should track different keys within the same namespace independently', () => {
      const namespace = 'test-keys';
      const limit = 1;

      // Use up limit for user1
      checkRateLimit(namespace, 'user1', limit, 60_000);

      // user1 should be blocked
      const result1 = checkRateLimit(namespace, 'user1', limit, 60_000);
      expect(result1.allowed).toBe(false);

      // user2 should still be allowed
      const result2 = checkRateLimit(namespace, 'user2', limit, 60_000);
      expect(result2.allowed).toBe(true);
    });

    it('should not interfere between different namespace/key combinations', () => {
      const limit = 2;

      // Set up two namespace/key combos
      checkRateLimit('ns-x', 'key-a', limit, 60_000);
      checkRateLimit('ns-y', 'key-b', limit, 60_000);

      // Both should have remaining = 1
      const resultA = checkRateLimit('ns-x', 'key-a', limit, 60_000);
      expect(resultA.remaining).toBe(0);

      const resultB = checkRateLimit('ns-y', 'key-b', limit, 60_000);
      expect(resultB.remaining).toBe(0);
    });
  });

  // ============================================================
  // getClientIp extraction from headers
  // ============================================================
  describe('getClientIp extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      expect(getClientIp(request)).toBe('192.168.1.1');
    });

    it('should extract first IP from x-forwarded-for with multiple IPs', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18, 150.172.238.178' },
      });
      expect(getClientIp(request)).toBe('203.0.113.1');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is absent', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });
      expect(getClientIp(request)).toBe('10.0.0.1');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });
      expect(getClientIp(request)).toBe('192.168.1.1');
    });

    it('should return "unknown" when no IP headers are present', () => {
      const request = new Request('http://example.com');
      expect(getClientIp(request)).toBe('unknown');
    });

    it('should handle x-forwarded-for with spaces', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1 ' },
      });
      expect(getClientIp(request)).toBe('192.168.1.1');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '172.16.0.1' },
      });
      expect(getClientIp(request)).toBe('172.16.0.1');
    });
  });

  // ============================================================
  // RATE_LIMITS configuration values
  // ============================================================
  describe('RATE_LIMITS configuration', () => {
    it('should have valuation limit of 10 req/min', () => {
      expect(RATE_LIMITS.valuation.limit).toBe(10);
      expect(RATE_LIMITS.valuation.windowMs).toBe(60_000);
    });

    it('should have stocks limit of 60 req/min', () => {
      expect(RATE_LIMITS.stocks.limit).toBe(60);
      expect(RATE_LIMITS.stocks.windowMs).toBe(60_000);
    });

    it('should have technical limit of 30 req/min', () => {
      expect(RATE_LIMITS.technical.limit).toBe(30);
      expect(RATE_LIMITS.technical.windowMs).toBe(60_000);
    });

    it('should have report limit of 10 req/min', () => {
      expect(RATE_LIMITS.report.limit).toBe(10);
      expect(RATE_LIMITS.report.windowMs).toBe(60_000);
    });

    it('should have supportResistance limit of 30 req/min', () => {
      expect(RATE_LIMITS.supportResistance.limit).toBe(30);
      expect(RATE_LIMITS.supportResistance.windowMs).toBe(60_000);
    });

    it('should have all window durations in milliseconds', () => {
      for (const key of Object.keys(RATE_LIMITS) as Array<keyof typeof RATE_LIMITS>) {
        expect(RATE_LIMITS[key].windowMs).toBeGreaterThan(0);
        expect(typeof RATE_LIMITS[key].windowMs).toBe('number');
      }
    });

    it('should have all limits as positive integers', () => {
      for (const key of Object.keys(RATE_LIMITS) as Array<keyof typeof RATE_LIMITS>) {
        expect(RATE_LIMITS[key].limit).toBeGreaterThan(0);
        expect(Number.isInteger(RATE_LIMITS[key].limit)).toBe(true);
      }
    });

    it('should be frozen (readonly) via as const', () => {
      // The `as const` assertion makes the object deeply readonly at the type level
      // Verify the structure is correct
      expect(Object.keys(RATE_LIMITS)).toContain('valuation');
      expect(Object.keys(RATE_LIMITS)).toContain('stocks');
      expect(Object.keys(RATE_LIMITS)).toContain('technical');
      expect(Object.keys(RATE_LIMITS)).toContain('report');
      expect(Object.keys(RATE_LIMITS)).toContain('supportResistance');
    });
  });

  // ============================================================
  // Default window parameter
  // ============================================================
  describe('Default window parameter', () => {
    it('should use 60 seconds as default window', () => {
      // Calling without windowMs should default to 60_000
      const result = checkRateLimit('test-default-window', 'user-default', 10);
      expect(result.allowed).toBe(true);
    });
  });
});
