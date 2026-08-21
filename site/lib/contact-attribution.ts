/**
 * Ad-attribution capture for paid-ads-running photographers.
 *
 * On page load, captures click IDs (gclid, fbclid, ttclid, etc.) and UTM
 * params from the URL into first-party cookies with a 90-day TTL. Reads
 * them on form submission and passes through to the CRM so the
 * photographer's GHL contact carries the original ad-click context.
 *
 * Pattern adapted from p2p-react-website/src/lib/contact-prefill.ts —
 * slimmed (no contact-prefill sessionStorage, no booking-widget wiring;
 * that's an upgrade path for forks that run a booking funnel).
 *
 * Privacy note: cookies are first-party, SameSite=Lax, Secure. Platform-
 * owned cookies (_fbp / _fbc) are NEVER written by us — Meta's pixel sets
 * those. We only read them at form submission time when they exist.
 */

const CLICK_ID_COOKIE_DAYS = 90;
const UTM_COOKIE_DAYS = 90;

/* ────────────── Cookie helpers ────────────── */

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return; // SSR no-op
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax; Secure`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null; // SSR no-op
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/* ────────────── Click ID + UTM tracking ────────────── */

/** URL params captured into first-party cookies on landing. */
export const CLICK_ID_PARAMS = [
  "gclid", // Google Ads
  "gbraid", // Google enhanced (iOS web)
  "wbraid", // Google enhanced (other)
  "fbclid", // Meta Ads
  "ttclid", // TikTok Ads
  "msclkid", // Microsoft Ads
  "li_fat_id", // LinkedIn Ads
] as const;

export const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type ClickIdKey = (typeof CLICK_ID_PARAMS)[number];
export type UtmKey = (typeof UTM_PARAMS)[number];

export type AttributionData = Partial<Record<ClickIdKey | UtmKey | "fbp" | "fbc", string>>;

const CLICK_ID_COOKIE_PREFIX = "ph_click_";
const UTM_COOKIE_PREFIX = "ph_utm_";
const ATTRIBUTION_VALUE_MAX = 180;

function sanitizeAttributionValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/[<>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ATTRIBUTION_VALUE_MAX);
  return cleaned || null;
}

/**
 * Read URL params on landing + persist to cookies. Run once on app mount
 * (AttributionTracker mounts in root layout).
 *
 * First-touch attribution: we don't overwrite existing cookies. The
 * very first click ID a visitor lands with wins, even if they later
 * navigate via a different ad. Most ad platforms attribute first-touch.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  for (const key of CLICK_ID_PARAMS) {
    const val = params.get(key);
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal && !getCookie(`${CLICK_ID_COOKIE_PREFIX}${key}`)) {
      setCookie(`${CLICK_ID_COOKIE_PREFIX}${key}`, safeVal, CLICK_ID_COOKIE_DAYS);
    }
  }

  for (const key of UTM_PARAMS) {
    const val = params.get(key);
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal && !getCookie(`${UTM_COOKIE_PREFIX}${key}`)) {
      setCookie(`${UTM_COOKIE_PREFIX}${key}`, safeVal, UTM_COOKIE_DAYS);
    }
  }
}

/**
 * Read all stored attribution + live platform-owned cookies. Call at form
 * submission time.
 */
export function getStoredAttribution(): AttributionData {
  const data: AttributionData = {};

  for (const key of CLICK_ID_PARAMS) {
    const val = getCookie(`${CLICK_ID_COOKIE_PREFIX}${key}`);
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal) data[key] = safeVal;
  }
  for (const key of UTM_PARAMS) {
    const val = getCookie(`${UTM_COOKIE_PREFIX}${key}`);
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal) data[key] = safeVal;
  }

  // Meta's pixel cookies — live read, never cached by us.
  const fbp = getCookie("_fbp");
  const safeFbp = sanitizeAttributionValue(fbp);
  if (safeFbp) data.fbp = safeFbp;
  const fbc = getCookie("_fbc");
  const safeFbc = sanitizeAttributionValue(fbc);
  if (safeFbc) data.fbc = safeFbc;

  return data;
}

/**
 * Serialize attribution as form fields for a `<form>`. Each entry becomes
 * a hidden input the server can read from FormData.
 */
export function attributionToFormFields(): Array<{ name: string; value: string }> {
  const data = getStoredAttribution();
  return Object.entries(data).map(([name, value]) => ({
    name: `attr_${name}`,
    value: String(value),
  }));
}

/**
 * Server-side: extract attribution fields from a FormData. Mirrors the
 * naming convention used by attributionToFormFields().
 */
export function attributionFromFormData(formData: FormData): AttributionData {
  const data: AttributionData = {};
  for (const key of [...CLICK_ID_PARAMS, ...UTM_PARAMS, "fbp", "fbc"] as const) {
    const val = formData.get(`attr_${key}`);
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal) {
      data[key as keyof AttributionData] = safeVal;
    }
  }
  return data;
}

/**
 * Minimal shape of Next's `cookies()` return value. Declared locally (rather
 * than imported from "next/headers") so this file stays framework-light and
 * attributionFromCookies() stays testable with a plain object/Map-backed
 * fake — no Next request context required.
 */
export interface AttributionCookieStore {
  get(name: string): { value: string } | undefined;
}

/**
 * Server-side: extract attribution from the first-party cookies
 * captureAttributionFromUrl() writes (via <AttributionTracker /> mounted in
 * the root layout). Cookies travel with every POST regardless of
 * client-side hydration, so this is the reliability layer for forms whose
 * hidden <AttributionFields /> inputs may not have populated — this repo
 * has had cases where a <form> subtree's effects never fire post-hydration,
 * which would otherwise silently zero out gclid/fbclid/UTM on every
 * submission. Reads the exact same cookie names getStoredAttribution()
 * reads client-side.
 */
export function attributionFromCookies(store: AttributionCookieStore): AttributionData {
  const data: AttributionData = {};

  for (const key of CLICK_ID_PARAMS) {
    const val = store.get(`${CLICK_ID_COOKIE_PREFIX}${key}`)?.value;
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal) data[key] = safeVal;
  }
  for (const key of UTM_PARAMS) {
    const val = store.get(`${UTM_COOKIE_PREFIX}${key}`)?.value;
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal) data[key] = safeVal;
  }

  // Meta's pixel cookies — same live read as getStoredAttribution(), never
  // cached or duplicated by us.
  const fbp = store.get("_fbp")?.value;
  const safeFbp = sanitizeAttributionValue(fbp);
  if (safeFbp) data.fbp = safeFbp;
  const fbc = store.get("_fbc")?.value;
  const safeFbc = sanitizeAttributionValue(fbc);
  if (safeFbc) data.fbc = safeFbc;

  return data;
}

/**
 * Per-key merge of form-borne and cookie-borne attribution: the formData
 * value wins when present (it reflects this exact submission), the cookie
 * value fills in any key formData didn't carry. See attributionFromCookies()
 * for why formData can come up empty even though the visitor's ad-click
 * cookies are sitting right there on the request.
 */
export function mergeAttribution(
  formAttribution: AttributionData,
  cookieAttribution: AttributionData
): AttributionData {
  return { ...cookieAttribution, ...formAttribution };
}

/**
 * Server-side: extract attribution fields from a JSON body. Mirrors the
 * same naming convention so the REST endpoint sees the same shape.
 */
export function attributionFromJson(body: Record<string, unknown>): AttributionData {
  const data: AttributionData = {};
  for (const key of [...CLICK_ID_PARAMS, ...UTM_PARAMS, "fbp", "fbc"] as const) {
    const val = body[`attr_${key}`];
    const safeVal = sanitizeAttributionValue(val);
    if (safeVal) {
      data[key as keyof AttributionData] = safeVal;
    }
  }
  return data;
}
