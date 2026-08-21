import "server-only";

// Server-only entry for the rate limiter. The implementation lives in
// ./rate-limit-core (no `server-only`) so it stays unit-testable; this module
// re-exports it behind the server-only guard to keep it out of client bundles.
export {
  rateLimit,
  resolveIp,
  getClientIpFromRequest,
  getClientIpFromHeaders,
} from "./rate-limit-core";
export type { RateLimitConfig, RateLimitResult } from "./rate-limit-core";
