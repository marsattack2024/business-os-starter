/**
 * In-memory sliding-window rate limiter — PURE core (no `server-only`), so it is
 * unit-testable under node:test. The server entry `lib/rate-limit.ts` re-exports
 * this behind `import "server-only"` to keep it out of client bundles.
 *
 * Caveats:
 * - In-memory state lives per function instance. Vercel's Fluid Compute reuses
 *   instances aggressively, so this is effective for low-traffic photographer
 *   sites (a single bot from one IP gets rate-limited across requests).
 *   High-traffic / multi-region deploys should swap this for Upstash Redis or
 *   @vercel/kv — the rateLimit() signature stays the same.
 * - First request after a cold start always passes (fresh bucket map). Bounded
 *   and acceptable; worst case a handful of extra requests during a deploy.
 *
 * For a brochure photography site receiving < 100 form submissions / day this is
 * the right tradeoff — zero infra, zero cost, catches abuse from a single source.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  /** Max requests allowed in the window. Default: 5. */
  max?: number;
  /** Window length in ms. Default: 60_000 (1 minute). */
  windowMs?: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Unix ms when the bucket resets. */
  resetAt: number;
  /** Seconds until reset. 0 when ok. Use for Retry-After header. */
  retryAfter: number;
}

/**
 * Check + increment rate limit for a key.
 * Returns ok=false when the bucket is full.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const max = config.max ?? 5;
  const windowMs = config.windowMs ?? 60_000;
  const now = Date.now();

  // Lazy GC: prune expired entries on each call. Cheap when the map is small.
  // For high-traffic, swap to a proper LRU library.
  if (buckets.size > 0) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      remaining: max - 1,
      resetAt: now + windowMs,
      retryAfter: 0,
    };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count++;
  return {
    ok: true,
    remaining: max - bucket.count,
    resetAt: bucket.resetAt,
    retryAfter: 0,
  };
}

/**
 * Resolve the client's IP from proxy headers, preferring the values an attacker
 * cannot spoof. The leftmost `x-forwarded-for` hop is CLIENT-supplied (a caller
 * can set any value and rotate it to evade the limiter), so we never trust it.
 * Order: Vercel-AUTHENTICATED `x-vercel-forwarded-for`, then `x-real-ip`, then
 * the RIGHTMOST `x-forwarded-for` hop — the one the trusted proxy actually
 * appended. Returns "unknown" when no header is present (local dev).
 */
export function resolveIp(get: (k: string) => string | null | undefined): string {
  const xff = get("x-forwarded-for");
  const xffTrusted = xff
    ? xff.split(",").map((s) => s.trim()).filter(Boolean).pop()
    : undefined;
  // Vercel-AUTHENTICATED headers first. x-vercel-forwarded-for is set by the
  // platform and cannot be spoofed by the caller; x-real-ip is the platform's
  // single-value form. Only then the rightmost x-forwarded-for hop.
  //
  // cf-connecting-ip is deliberately NOT consulted: sites forked from this
  // template deploy to Vercel and nothing sits behind Cloudflare, so Vercel
  // neither sets nor strips that header — a caller sends any value and rotates
  // it per request, defeating the limiter exactly like the leftmost
  // x-forwarded-for hop did. Mirrors clientIpFromHeaders in
  // apps/agency-os/lib/log.ts, which never trusted it. If a fork ever DOES sit
  // behind Cloudflare, add cf-connecting-ip there — not here — because the
  // header is only trustworthy where the proxy is proven to strip it.
  return (
    get("x-vercel-forwarded-for") ||
    get("x-real-ip") ||
    xffTrusted ||
    "unknown"
  );
}

export function getClientIpFromRequest(req: Request): string {
  return resolveIp((k) => req.headers.get(k));
}

export function getClientIpFromHeaders(h: Headers): string {
  return resolveIp((k) => h.get(k));
}
