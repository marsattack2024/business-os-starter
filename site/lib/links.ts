/**
 * Internal Next.js route detector — a relative path starting with `/` that
 * doesn't end in a file extension (.xml, .pdf, .txt, .json, …). Those, plus
 * external hrefs (http://, mailto:, tel:, #), should hard-load instead of
 * SPA-navigating via <Link>. Shared by Footer + Button so the heuristic lives
 * in one place.
 */
export function isInternalRoute(href: string): boolean {
  if (!href.startsWith("/")) return false;
  // Match `.xml`, `.txt`, `.pdf`, `.json`, etc. at the end of the path
  if (/\.[a-z0-9]{2,5}(\?|#|$)/i.test(href)) return false;
  return true;
}

/** Build a `tel:` href from a display phone number (digits + leading +). */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  return digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`;
}

/**
 * Build a `mailto:` href with a pre-filled subject.
 *
 * A blank compose window makes the visitor invent a subject line before they
 * can write the thing they actually wanted to say, and plenty of them abandon
 * there. Pre-filling turns the click into an already-started message.
 *
 * The subject is encodeURIComponent'd, not passed raw: an unescaped `&` or `#`
 * in a studio's subject line would silently truncate the mailto or spill into
 * a bogus parameter.
 */
export function mailtoHref(email: string, subject?: string): string {
  const trimmed = subject?.trim();
  if (!trimmed) return `mailto:${email}`;
  return `mailto:${email}?subject=${encodeURIComponent(trimmed)}`;
}
