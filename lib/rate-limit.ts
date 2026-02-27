/**
 * lib/rate-limit.ts
 *
 * In-memory sliding-window rate limiter.
 *
 * Works in a single-process environment (development, single-instance server).
 * For multi-instance production deployments, swap the store for Redis/Upstash.
 *
 * Usage:
 *   const result = await rateLimit(identifier, { limit: 10, windowMs: 60_000 });
 *   if (!result.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
 */

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number;
  /** Rolling window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** Requests remaining in current window */
  remaining: number;
  /** Epoch ms when the oldest request in the window expires */
  reset: number;
}

// Simple in-memory store: key → array of request timestamps
const store = new Map<string, number[]>();

// Periodically clean up expired entries to avoid memory leaks (every 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      // If all timestamps are older than 1 hour, remove the entry
      if (timestamps.every((t) => now - t > 60 * 60 * 1000)) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check and record a request for `identifier` against the given limits.
 * @param identifier - Usually IP address or `userId:endpoint`
 */
export function rateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps, removing those outside the window
  const timestamps = (store.get(identifier) || []).filter((t) => t > windowStart);
  timestamps.push(now);
  store.set(identifier, timestamps);

  const remaining = Math.max(0, limit - timestamps.length);
  const success = timestamps.length <= limit;
  const reset = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;

  return { success, remaining, reset };
}

// ── Pre-defined rate limit configurations ──────────────────────────────────

/** Strict limit for auth endpoints: 10 attempts per 15 minutes */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  limit: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/** Standard API write limit: 60 mutations per minute */
export const WRITE_RATE_LIMIT: RateLimitOptions = {
  limit: 60,
  windowMs: 60 * 1000, // 1 minute
};

/** Generous read limit: 300 reads per minute */
export const READ_RATE_LIMIT: RateLimitOptions = {
  limit: 300,
  windowMs: 60 * 1000, // 1 minute
};

/** HealthKit sync (can be high-volume): 30 syncs per hour */
export const HEALTHKIT_RATE_LIMIT: RateLimitOptions = {
  limit: 30,
  windowMs: 60 * 60 * 1000, // 1 hour
};
