/**
 * Phone number normalization utilities.
 *
 * GoHighLevel's /contacts/upsert returns 422 for 10-digit US numbers
 * without a +1 prefix. Normalize at the boundary so the photographer
 * doesn't have to teach clients to type "+1" before their phone number.
 *
 * Pattern adapted from p2p-react-website/src/lib/phone.ts.
 */

/**
 * Normalize a phone number to E.164 format (best-effort).
 * Returns the original string if normalization can't determine a valid form.
 *
 * @example
 *   normalizePhone("6503219725")    // "+16503219725"
 *   normalizePhone("(650) 321-9725") // "+16503219725"
 *   normalizePhone("+16503219725")   // "+16503219725"
 *   normalizePhone("+447911123456")  // "+447911123456" (UK — unchanged)
 *   normalizePhone("hello")          // "hello" (passthrough)
 */
export function normalizePhone(raw: string): string {
  const normalized = normalizePhoneStrict(raw);
  return normalized ?? raw;
}

/**
 * Strict normalize — returns null when input can't be confidently coerced
 * to E.164. Use when you want a guard before sending to a CRM.
 *
 * Rules:
 *   10 digits                    → +1XXXXXXXXXX  (assume US/CA)
 *   11 digits starting with 1    → +1XXXXXXXXXX
 *   Already has + prefix         → cleaned (digits only) and returned
 *   7+ digits without +          → +XXXXXXX (best guess)
 *   Anything else                → null
 */
export function normalizePhoneStrict(
  raw: string | null | undefined
): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 15) return null;

  if (hasPlus && digits.length >= 7) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 7) return `+${digits}`;
  return null;
}

/**
 * Generate multiple format variants of a phone number for CRM dedup lookups.
 * Useful when checking if a contact already exists in GHL — different intake
 * channels may have stored the number in different formats.
 *
 * @example
 *   phoneLookupCandidates("6503219725")
 *   // [
 *   //   "+16503219725",       (E.164)
 *   //   "6503219725",         (raw input)
 *   //   "650-321-9725",       (dashed)
 *   //   "(650) 321-9725",     (parenthesized)
 *   //   "650.321.9725",       (dotted)
 *   //   "+1 650 321 9725",    (international with spaces)
 *   //   "1 650 321 9725",     (national with country code)
 *   // ]
 */
export function phoneLookupCandidates(
  raw: string | null | undefined
): string[] {
  const trimmed = String(raw ?? "").trim();
  const normalized = normalizePhoneStrict(trimmed);
  if (!trimmed && !normalized) return [];

  const digits = trimmed.replace(/\D/g, "");
  const national =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  const candidates = new Set<string>();
  if (normalized) candidates.add(normalized);
  if (trimmed) candidates.add(trimmed);
  if (digits) candidates.add(digits);
  if (national && national !== digits) candidates.add(national);

  if (national.length === 10) {
    candidates.add(
      `${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}`
    );
    candidates.add(
      `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
    );
    candidates.add(
      `${national.slice(0, 3)}.${national.slice(3, 6)}.${national.slice(6)}`
    );
    candidates.add(
      `+1 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
    );
    candidates.add(
      `1 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
    );
  }

  return [...candidates];
}
