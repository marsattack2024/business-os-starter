import "server-only";

/**
 * GoHighLevel API client — shared constants and request helpers.
 * Pattern adapted from p2p-react-website's lib/crm/ghl-client.ts, slimmed
 * to what a single-tenant brochure site needs (no workspace scoping,
 * no observability layer).
 */

export const GHL_BASE = "https://services.leadconnectorhq.com";
export const GHL_API_VERSION = "2021-07-28";
export const GHL_TIMEOUT_MS = 10_000;

export function ghlHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
    Accept: "application/json",
  };
}

export function withGHLTimeout(init: RequestInit): RequestInit {
  return { ...init, signal: AbortSignal.timeout(GHL_TIMEOUT_MS) };
}
