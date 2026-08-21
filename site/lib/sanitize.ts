/**
 * Input sanitizers for free-form fields that flow to external systems (GHL,
 * Sentry, etc.). Keep these conservative — the template ships with no
 * server-side HTML rendering, so the threat model is mostly:
 *
 *   1. Injection into downstream CRM notes (Handlebars `{{...}}`, HTML tags)
 *   2. Log poisoning / spoofed source pages
 *   3. Tag-key explosion (slug-unsafe agent names)
 *
 * Treat these helpers as defense-in-depth, not as a substitute for Zod
 * validation upstream.
 */

const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;
const HANDLEBARS_RE = /\{\{[^}]*\}\}/g;
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/g;

/**
 * Strip HTML tags + `{{handlebars}}` + control chars, collapse whitespace,
 * and cap length. Returns `undefined` for empty/non-string inputs so the
 * caller can spread it without producing empty CRM fields.
 */
export function sanitizeFreeText(value: unknown, maxLength = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(HTML_TAG_RE, "")
    .replace(HANDLEBARS_RE, "")
    .replace(CONTROL_CHAR_RE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return cleaned || undefined;
}

const SLUG_SAFE_RE = /[^a-z0-9._-]+/gi;

/**
 * For tag keys / source identifiers that round-trip into CRM tag systems.
 * Lowercased, slug-safe ASCII only, max 80 chars. Empty input → "unknown".
 */
export function sanitizeSlugSafe(value: unknown, maxLength = 80): string {
  if (typeof value !== "string" || !value) return "unknown";
  const cleaned = value.toLowerCase().replace(SLUG_SAFE_RE, "-").replace(/^-+|-+$/g, "").slice(0, maxLength);
  return cleaned || "unknown";
}

const DANGEROUS_BLOCK_RE = /<(script|style|iframe|object|embed|form|input|button)\b[\s\S]*?<\/\1>/gi;
const DANGEROUS_SELF_CLOSING_RE = /<(script|style|iframe|object|embed|form|input|button)\b[^>]*\/?>/gi;
const EVENT_ATTR_RE = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const STYLE_ATTR_RE = /\s+style\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const UNSAFE_URL_ATTR_RE = /\s+(href|src)\s*=\s*(["']?)\s*(javascript:|data:text\/html|vbscript:)[^"'\s>]*\2/gi;

/**
 * Defense-in-depth sanitizer for HTML produced from trusted-ish Markdown
 * imports. It is intentionally conservative and dependency-free: scripts,
 * event handlers, inline styles, unsafe URL protocols, and embed/form tags are
 * removed before the HTML is passed to dangerouslySetInnerHTML.
 */
export function sanitizeRenderedHtml(html: string): string {
  return html
    .replace(DANGEROUS_BLOCK_RE, "")
    .replace(DANGEROUS_SELF_CLOSING_RE, "")
    .replace(EVENT_ATTR_RE, "")
    .replace(STYLE_ATTR_RE, "")
    .replace(UNSAFE_URL_ATTR_RE, "");
}
