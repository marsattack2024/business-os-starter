// lib/quiz/registry.ts
// Resolves a site's quiz variations. One site can host MANY quizzes (different
// offers per genre/service page / subdomain), reusing the same in-site engine
// components. Pure — unit-tested. No window/env-at-import; the only env read is
// the public enabled flag, inlined at build time.
import type { SiteQuiz } from "./types";

/** The slice of site config the registry reads. */
export interface QuizRegistryConfig {
  /** Single-variation alias (back-compat). Used only when `quizzes` is empty. */
  quiz?: SiteQuiz;
  /** Multi-variation registry. Takes precedence over `quiz`. */
  quizzes?: SiteQuiz[];
}

/** URL segment for a variation's standalone route: explicit `slug` or its `id`. */
export function quizSlug(q: SiteQuiz): string {
  return q.slug ?? q.id;
}

/** Whether a variation is on (its own flag wins; else the public env flag). */
export function isQuizEnabled(q: SiteQuiz): boolean {
  return q.enabled ?? process.env.NEXT_PUBLIC_QUIZ_ENABLED === "true";
}

/**
 * All configured variations, de-duped by slug (first wins), order preserved.
 * `quizzes` is canonical; `quiz` is the single-variation alias used only when
 * `quizzes` is absent/empty.
 */
export function getQuizzes(config: QuizRegistryConfig): SiteQuiz[] {
  const list =
    config.quizzes && config.quizzes.length > 0
      ? config.quizzes
      : config.quiz
        ? [config.quiz]
        : [];
  const seen = new Set<string>();
  return list.filter((q) => {
    const s = quizSlug(q);
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}

/** The variation backing `/quiz` and the global popup: the one flagged
 *  `default`, else the first configured. */
export function getDefaultQuiz(config: QuizRegistryConfig): SiteQuiz | undefined {
  const all = getQuizzes(config);
  return all.find((q) => q.default) ?? all[0];
}

/**
 * The persistent nav CTA for a site's quiz: the default enabled variation's
 * `navCta` label + the `/quiz` href. Returns null when there is no enabled
 * default quiz or it sets no `navCta`. Lets the Navbar render a standout
 * "claim the offer" link to the standalone quiz — a recovery path for visitors
 * who dismissed the popup (the standalone /quiz ignores caps and always opens).
 */
export function getQuizNavCta(
  config: QuizRegistryConfig,
): { label: string; href: string } | null {
  const q = getDefaultQuiz(config);
  if (!q || !isQuizEnabled(q) || !q.navCta) return null;
  return { label: q.navCta, href: "/quiz" };
}

/** The variation for the standalone route `/quiz/<slug>`. */
export function getQuizBySlug(config: QuizRegistryConfig, slug: string): SiteQuiz | undefined {
  return getQuizzes(config).find((q) => quizSlug(q) === slug);
}

/**
 * The popup variation to arm on `pathname`. A variation whose `showOn` lists the
 * exact path wins (a service/genre page hosts its own offer); otherwise a global
 * variation (no `showOn`) is used. Enabled variations are preferred within each
 * tier so a disabled draft never shadows a live one. Enabled/dev-force gating is
 * left to the trigger hook so localhost preview still works when all are off.
 */
export function getPopupQuizForPath(
  config: QuizRegistryConfig,
  pathname: string,
): SiteQuiz | undefined {
  const all = getQuizzes(config);
  const explicit = all.filter((q) => q.showOn && matchesPath(q.showOn, pathname));
  const global = all.filter((q) => !q.showOn || q.showOn.length === 0);
  const pick = (list: SiteQuiz[]): SiteQuiz | undefined => list.find(isQuizEnabled) ?? list[0];
  return pick(explicit) ?? pick(global);
}

/**
 * `showOn` entries are path PREFIXES: "/branding" matches "/branding" and any
 * "/branding/..." child (and tolerates a trailing slash). This is intentionally
 * prefix-based so a section like "/services" covers its children, and is the
 * documented semantics. (`triggers.blockedPathSegments`, by contrast, is a
 * substring blocklist — a different, narrower concept.)
 */
function matchesPath(showOn: string[], pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return showOn.some((raw) => {
    const p = raw.replace(/\/+$/, "") || "/";
    return path === p || (p !== "/" && path.startsWith(`${p}/`));
  });
}

/** URL-safe slug: lowercase alphanumerics + single hyphens, no leading/trailing. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Cross-variation invariants for a site's quiz registry, enforced at BUILD time
 * (generateStaticParams) — things validateSiteQuizAlignment can't see per-quiz:
 *   - unique `id` (ids namespace frequency caps + CRM tags + analytics)
 *   - unique, URL-safe `slug` (becomes the /quiz/<slug> route segment)
 *   - at most one `default: true`
 * Returns a list of error strings (empty = valid). (No slug↔id cross-check is
 * needed: getQuizBySlug matches on slug only — ids and slugs are separate
 * namespaces, so a slug equal to another variation's id is unambiguous.)
 */
export function validateQuizRegistry(quizzes: SiteQuiz[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  let defaults = 0;

  for (const q of quizzes) {
    if (q.default) defaults += 1;

    if (!q.id?.trim()) {
      errors.push("a quiz variation is missing an id");
    } else if (ids.has(q.id)) {
      errors.push(`duplicate quiz id "${q.id}": ids must be unique (they namespace frequency caps + CRM tags)`);
    } else {
      ids.add(q.id);
    }

    const slug = quizSlug(q);
    if (!SLUG_RE.test(slug)) {
      errors.push(`quiz slug "${slug}" (id "${q.id}") must be a URL-safe slug ([a-z0-9] + single hyphens)`);
    }
    if (slugs.has(slug)) {
      errors.push(`duplicate quiz slug "${slug}": each variation needs a distinct /quiz/<slug>`);
    } else {
      slugs.add(slug);
    }
  }

  if (defaults > 1) {
    errors.push(`only one quiz variation may set default:true (found ${defaults})`);
  }
  return errors;
}
