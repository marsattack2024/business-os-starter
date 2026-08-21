// lib/quiz/validate.ts
// Client-side field validation + formatting for the quiz capture steps, plus a
// config-alignment check run at init so a misconfigured SiteQuiz fails loud
// instead of rendering broken. Pure (unit-tested). Phone canonicalization reuses
// lib/phone.ts so the client and the GHL boundary agree on E.164.
import { normalizePhoneStrict } from "../phone";
import { RUNTIME_QUESTION_LIMIT } from "./flow";
import type { QuizTheme, SiteQuiz } from "./types";

// Pragmatic email check: one @, a dot in the domain, no spaces. Not RFC-perfect
// (impossible in a regex) but rejects the realistic mistakes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Format a US number as the visitor types: (555) 123-4567.
 * International numbers (leading +) and anything past 10 digits pass through
 * untouched so non-US visitors aren't fought by the formatter.
 */
export function formatUsPhone(input: string): string {
  if (input.trim().startsWith("+")) return input;
  const d = input.replace(/\D/g, "");
  if (d.length > 10) return input;
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * A phone is valid when it canonicalizes to E.164 AND carries enough digits to
 * be a real number (≥10 — US national length). Looser than the formatter so a
 * pasted +44… international number still passes.
 */
export function isValidPhone(value: string): boolean {
  if (normalizePhoneStrict(value) === null) return false;
  return value.replace(/\D/g, "").length >= 10;
}

/** Canonical E.164 for delivery, or the trimmed input if it can't be coerced. */
export function toE164(value: string): string {
  return normalizePhoneStrict(value) ?? value.trim();
}

/* --------------------- Config-alignment validation --------------------- */

export type SiteQuizValidation = { ok: true } | { ok: false; errors: string[] };

// A theme color override is either a CSS custom-property reference (the
// token-driven default) OR a literal hex. Bare color keywords aren't accepted —
// the design is token-first, so an override should be intentional.
const COLOR_OVERRIDE_RE = /^(var\(--[a-z0-9-]+\)|#[0-9a-f]{3}([0-9a-f]{3})?)$/i;

function checkColorOverride(
  value: string | undefined,
  field: string,
  errors: string[],
): void {
  if (value === undefined) return; // optional — defaults from design tokens
  if (!COLOR_OVERRIDE_RE.test(value.trim())) {
    errors.push(`theme.${field} ("${value}") must be a var(--token) ref or a hex color`);
  }
}

/* --------------------- WCAG contrast (pure) --------------------- */

// A literal hex color: #rgb or #rrggbb (case-insensitive).
const HEX_LITERAL_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Parse a `#rgb` or `#rrggbb` hex literal to sRGB channels (0–255), or null. */
function parseHex(hex: string): [number, number, number] | null {
  const m = HEX_LITERAL_RE.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; // expand shorthand
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * WCAG relative luminance of an sRGB color (0–1). Applies the standard
 * sRGB→linear transfer function per channel, then the Rec. 709 luma weights.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two hex colors, in [1, 21]. Returns NaN if either
 * value isn't a parseable hex literal (callers should guard on hex-ness first).
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return NaN;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// The background scrim is configured as an "R, G, B" string interpolated into
// rgb()/rgba(); a typo'd triple otherwise renders a broken/transparent scrim
// with no warning, so validate it here like the theme colors.
const RGB_TRIPLE_RE = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/;

function checkRgbTriple(value: string | undefined, field: string, errors: string[]): void {
  if (value === undefined) return; // optional — defaults to black/white by mode
  const m = RGB_TRIPLE_RE.exec(value.trim());
  if (!m || [m[1], m[2], m[3]].some((n) => Number(n) > 255)) {
    errors.push(`background.${field} ("${value}") must be an "R, G, B" triple of 0-255 ints`);
  }
}

/**
 * Verify a `SiteQuiz` is internally consistent before it renders. Catches the
 * misconfigurations that otherwise fail silently at render time:
 *  - missing background image
 *  - `statementImages` not index-aligned to the live (capped) questions
 *  - color overrides that are neither a token ref nor a hex
 *  - too few `info_collection.fields` for the email/name/phone/final steps
 *
 * Pure — safe to call at module init (the runner/config can assert on it in dev).
 */
export function validateSiteQuizAlignment(quiz: SiteQuiz): SiteQuizValidation {
  const errors: string[] = [];

  if (!quiz.id?.trim()) errors.push("id is required");
  if (!quiz.background?.imageSrc?.trim()) errors.push("background.imageSrc is required");

  const liveCount = Math.min(
    quiz.content?.main_questions?.length ?? 0,
    RUNTIME_QUESTION_LIMIT,
  );
  if (liveCount < 1) {
    errors.push("content.main_questions needs at least 1 question to render");
  }
  if (quiz.statementImages && quiz.statementImages.length !== liveCount) {
    errors.push(
      `statementImages (${quiz.statementImages.length}) must be index-aligned to the ` +
        `${liveCount} live question(s)`,
    );
  }

  const fields = quiz.content?.info_collection?.fields ?? [];
  if (fields.length < 3) {
    errors.push(`info_collection.fields needs >= 3 entries (got ${fields.length})`);
  }

  const t: QuizTheme | undefined = quiz.theme;
  if (!t?.font?.trim()) errors.push("theme.font is required");
  checkColorOverride(t?.textColor, "textColor", errors);
  checkColorOverride(t?.buttonColor, "buttonColor", errors);
  checkColorOverride(t?.buttonTextColor, "buttonTextColor", errors);
  checkColorOverride(t?.accentColor, "accentColor", errors);
  checkColorOverride(t?.accentTextColor, "accentTextColor", errors);

  // The selected-answer glyph (option letter + checkmark) renders in
  // accentTextColor ON accentColor. That pairing must clear WCAG 3:1 (large
  // text / graphical bound) or the chosen answer is unreadable. Only checkable
  // when BOTH are hex literals — token refs (var(--…)) can't be resolved here.
  const accentBg = t?.accentColor?.trim();
  const accentFg = t?.accentTextColor?.trim();
  if (
    accentBg &&
    accentFg &&
    HEX_LITERAL_RE.test(accentBg) &&
    HEX_LITERAL_RE.test(accentFg)
  ) {
    const ratio = contrastRatio(accentBg, accentFg);
    if (ratio < 3.0) {
      errors.push(
        `accent contrast ${ratio.toFixed(2)}:1 (accentColor "${accentBg}" vs ` +
          `accentTextColor "${accentFg}") is below the 3:1 minimum for the ` +
          `selected-answer glyph`,
      );
    }
  }

  checkRgbTriple(quiz.background?.overlayColor, "overlayColor", errors);
  checkRgbTriple(quiz.background?.overlayColorMobile, "overlayColorMobile", errors);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
