/**
 * Simple in-memory sliding-window rate limiter.
 * For single-instance deployments (Vercel serverless has per-instance memory,
 * so this provides per-instance protection — enough to stop casual abuse).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

/**
 * Check rate limit for a given key (usually IP or userId).
 * Returns { success: true } if allowed, or { success: false, retryAfterSec } if blocked.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): { success: true } | { success: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return { success: true };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { success: true };
}

/**
 * Extract client IP from request headers (works on Vercel).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/** Helper to return a 429 JSON response */
export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
