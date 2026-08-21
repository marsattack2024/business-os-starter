// lib/quiz/types.ts
// Quiz contract (agency-os/quiz/output) + renderer + per-site config types.
// Contract counts mirror .claude/skills/typeform-quiz-popup-builder/references/output-schema.json
// (enforced by scripts/client-quality-gate.mjs). Keep in sync.

/* ------------------------- Contract (authoring) ------------------------- */
export type ReadinessLabel = "launch_ready" | "review_draft" | "source_limited";
export type AnswerFormat =
  | "multiple_choice"
  | "select_all"
  | "true_false"
  | "all_of_the_above";

export interface ContractQuestion {
  question: string;
  answer_format: AnswerFormat;
  options: string[]; // >= 3
  best_answer: string; // comma-joined for select_all / all_of_the_above
  statement: string; // 150–220 words
}

/** Semver of the quiz authoring contract. Bump on breaking schema changes so
 *  delivery/analytics consumers can branch safely. Optional for back-compat;
 *  unset is treated as the original "1.0" contract. */
export type QuizContractVersion = "1.0";

export interface QuizOutput {
  /** Authoring-contract version (semver). Defaults to "1.0" when omitted. */
  contract_version?: QuizContractVersion;
  client_id: string;
  readiness_label: ReadinessLabel;
  /** Carries the offer + the challenge hook ("Claim $X ... — can you get 4/4 right?"). */
  title_slide: { headline: string; subhead?: string };
  main_questions: ContractQuestion[]; // exactly 4 live
  offer_slide: { headline: string; benefit_bullets: string[]; button_text: string }; // 3 bullets
  fair_enough_slide: { headline: string; paragraph: string; second_chance_cta: string };
  info_collection: { fields: string[] }; // >= 3 descriptive strings
  alternate_questions: ContractQuestion[]; // 4 (not rendered live)
  thank_you: { headline: string; lines: string[] }; // 2–4
  follow_up_email: { subject: string; body: string }; // not rendered (CRM/email)
}

/* ------------------------- Per-site presentation ------------------------- */
/**
 * Localizable CHROME strings — the engine's UI furniture (buttons, hints,
 * placeholders, validation messages, aria-labels) that is NOT authored as slide
 * content. Every field is OPTIONAL; unset fields fall back to the English
 * DEFAULTS in `adapt.ts`. A non-English client (e.g. a US studio serving a
 * Spanish-speaking community) sets these to translate the chrome while still
 * authoring slide content in their own language.
 *
 * Strings with `{token}` placeholders are interpolated at render:
 *   - questionProgress: `{current}` and `{total}`
 *   - selectedHint: `{count}`
 */
export interface QuizLabels {
  /** Welcome-slide start CTA. Default "Take the quiz". */
  start?: string;
  /** Offer-gate decline option. Default "Not yet". */
  decline?: string;
  /** Fair-enough reconsider (go back) CTA. Default "Go back". */
  reconsider?: string;
  /** Generic advance button (explanation, multi-select, name/phone). Default "Continue". */
  continue?: string;
  /** Final-question submit button. Default "Submit". */
  submit?: string;
  /** In-flight submit button text. Default "Saving…". */
  saving?: string;
  /** Offer-choice eyebrow. Default "Almost there". */
  offerEyebrow?: string;
  /** Question counter. `{current}`/`{total}`. Default "Question {current} of {total}". */
  questionProgress?: string;
  /** Multi-select hint, 0 selected. Default "Select all that apply, then continue.". */
  selectAllHint?: string;
  /** Multi-select hint, >0 selected. `{count}`. Default "{count} selected — pick all that apply, then continue.". */
  selectedHint?: string;
  /** Email field sr-only label. Default "Email address". */
  emailLabel?: string;
  /** Email input placeholder. Default "you@example.com". */
  emailPlaceholder?: string;
  /** Empty-email validation. Default "Please enter your email address.". */
  emailRequired?: string;
  /** Invalid-email validation. Default "Please enter a valid email address.". */
  emailInvalid?: string;
  /** Name input placeholder. Default "Your name". */
  namePlaceholder?: string;
  /** Empty-name validation. Default "Please enter your name.". */
  nameRequired?: string;
  /** Phone input placeholder. Default "(555) 123-4567". */
  phonePlaceholder?: string;
  /** Empty-phone validation (when required). Default "Please enter your phone number.". */
  phoneRequired?: string;
  /** Invalid-phone validation. Default "Please enter a valid phone number.". */
  phoneInvalid?: string;
  /** Final-question textarea placeholder. Default "Tell us a bit…". */
  whyPlaceholder?: string;
  /** Close (X) button aria-label. Default "Close quiz". */
  close?: string;
  /** Back arrow aria-label (mobile + desktop "previous"). Default "Previous". */
  back?: string;
  /** Desktop "next" arrow aria-label. Default "Next". */
  next?: string;
}

/** Light = dark text on a light scrim; dark = light text on a dark scrim. */
export type QuizMode = "light" | "dark";

/**
 * Theme is DESIGN-TOKEN-DRIVEN: colors default from the site's CSS custom
 * properties (`--color-ink`, `--color-cream`, `--color-accent`) by `mode`, so a
 * quiz inherits each client's palette with zero color config and no hex
 * duplication. Every color field is an optional override (token ref or hex).
 */
export interface QuizTheme {
  /** CSS font-family value, e.g. "var(--font-playfair), serif". */
  font: string;
  /** "light" (default) or "dark" — drives text/surface contrast + defaults. */
  mode?: QuizMode;
  /** Optional per-viewport mode (e.g. light desktop, dark mobile). */
  modeMobile?: QuizMode;
  /** Selected-answer accent. Default `var(--color-accent)`. */
  accentColor?: string;
  /** Text/icon color ON the accent chip. Default `var(--color-cream)`. */
  accentTextColor?: string;
  /** Optional explicit overrides. Default by mode: light → ink text / ink
   *  button / cream button-text; dark → the inverse (all via design tokens). */
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

export interface QuizBackground {
  /** Local /public path, served via next/image. */
  imageSrc: string;
  /** Optional portrait image used on mobile instead of imageSrc. */
  imageSrcMobile?: string;
  /** 0..1; the layer floor is black. Default 0.85. */
  opacity?: number;
  /** -100..100; negative=dark wash, positive=light wash, 0=none. Default -45. */
  overlayStrength?: number;
  /** Mobile override for overlayStrength (e.g. a dark wash on a phone). */
  overlayStrengthMobile?: number;
  /** Overlay tint as an "R, G, B" triple. Defaults to black (dark) / white
   *  (light) by the sign of overlayStrength. e.g. "241, 236, 227" for cream. */
  overlayColor?: string;
  /** Mobile override for overlayColor. */
  overlayColorMobile?: string;
  /** Render the overlay as a readability gradient (denser at the title + CTA
   *  ends, lighter mid to reveal the photo) instead of a flat scrim. */
  gradientOverlay?: boolean;
  bgFocalXDesktop?: number; // 0..100
  bgFocalYDesktop?: number;
  bgFocalXMobile?: number;
  bgFocalYMobile?: number;
}

export interface QuizTriggers {
  exitIntent?: boolean;
  delaySeconds?: number | null; // null/undefined = no time-delay trigger
  scrollDepthPct?: number | null; // e.g. 50
  /** Max times the popup may auto-show in one local calendar day. Default 2. */
  maxShowsPerDay?: number;
  /** Optional extra cooldown between auto-shows, in days. Default 0 (off) — the
   *  per-day cap governs on its own. Set this to also enforce a multi-day gap. */
  seenCooldownDays?: number;
  /** Don't show within this many days of a completed submission. Default 30. */
  submittedCooldownDays?: number;
  /** Path substrings the popup must never auto-open on. Default the redirect +
   *  thank-you routes. */
  blockedPathSegments?: string[];
}

export interface SiteQuiz {
  /** Stable id; namespaces localStorage + CRM tags + analytics. Unique per
   *  variation so multiple quizzes on one site never share frequency caps. */
  id: string;
  /** URL segment for the standalone route `/quiz/<slug>`. Defaults to `id`.
   *  Lets a site host several variations (different offers per genre/service
   *  page) at distinct URLs. */
  slug?: string;
  /** Marks the variation backing `/quiz` and the global (no-`showOn`) popup when
   *  a site configures several. If none is flagged, the first in `quizzes[]`
   *  wins. */
  default?: boolean;
  /** Overrides NEXT_PUBLIC_QUIZ_ENABLED. */
  enabled?: boolean;
  content: QuizOutput;
  theme: QuizTheme;
  /** Optional overrides for the engine's chrome strings (localization). Every
   *  field is optional; unset fields use the English defaults. */
  labels?: QuizLabels;
  background: QuizBackground;
  /** One image per main question (index-aligned); local /public paths. */
  statementImages?: (string | null)[];
  /** Pathnames the popup may auto-trigger on. The /quiz route ignores this. */
  showOn?: string[];
  triggers?: QuizTriggers;
  /** Capture fields to make OPTIONAL. By DEFAULT every field (email, name, phone,
   *  the final question) is REQUIRED — full lead data is the studio default. List
   *  a field here only to relax it for a specific client. */
  optionalFields?: ("phone" | "why")[];
  /** Standalone /quiz backdrop. Template default "image" (config bg). */
  standalone?: { backdrop?: "home" | "image" | "none" };
  /** Where completion redirects. Default "/thank-you". */
  redirectTo?: string;
  /** Standout nav label linking to the standalone /quiz (e.g. "Claim $100 Off").
   *  When set on an enabled default quiz, the Navbar renders a persistent CTA —
   *  a recovery path for visitors who dismissed the popup (the standalone /quiz
   *  ignores caps and always opens). Omit to hide. */
  navCta?: string;
  /** Lead delivery targets (shape mirrors DeliveryPolicy in deliver-helpers).
   *  `ghl`/`webhook` both default on, each still gated on its env vars.
   *  `partials: true` also sends the email-only (abandoned) quiz stage to GHL,
   *  tagged `quiz-abandoned`, for an abandoner nudge workflow. Default off. */
  delivery?: { ghl?: boolean; webhook?: boolean; partials?: boolean };
  /**
   * Config-driven copy + embeds for a generic `/quiz-thank-you` page, so the
   * template ships a real confirmation surface with NO client-specific copy.
   * Every field is optional with a neutral fallback.
   */
  thankYouPage?: QuizThankYouPage;
  /** GoHighLevel booking-widget URL embedded on the quiz thank-you page so a
   *  completer can book and redeem the offer. Empty → a placeholder is shown.
   *  Shorthand for `thankYouPage.schedulerEmbedUrl`. */
  schedulerEmbedUrl?: string;
  /** Optional video URL (mp4 or embeddable) for the quiz thank-you page.
   *  Shorthand for `thankYouPage.redemptionVideoUrl`. */
  redemptionVideoUrl?: string;
}

/** Config-driven copy/embeds for the generic `/quiz-thank-you` page. */
export interface QuizThankYouPage {
  eyebrow?: string;
  headline?: string;
  /** Body paragraph below the headline. */
  body?: string;
  /** Caption shown over the empty video placeholder. */
  videoPlaceholder?: string;
  /** Heading above the scheduler embed. */
  schedulerHeading?: string;
  /** Booking-widget URL. Falls back to `quiz.schedulerEmbedUrl`. */
  schedulerEmbedUrl?: string;
  /** Video URL. Falls back to `quiz.redemptionVideoUrl`. */
  redemptionVideoUrl?: string;
  /** Fallback CTA label when no scheduler URL is set. */
  ctaText?: string;
  /** Fallback CTA href when no scheduler URL is set. Default "/#contact". */
  ctaHref?: string;
}

/* ------------------------- Renderer (runtime) ------------------------- */
export type QuizScreen =
  | "welcome"
  | `q${number}`
  | `e${number}`
  | "offer"
  | "email"
  | "fair-enough"
  | "name"
  | "phone"
  | "final-question"
  | "thank-you";

export interface RunnerAnswerOption {
  label: string; // "A".."E"
  text: string;
  isBest: boolean;
  imageSrc?: string | null; // optional answer image (off by default)
}

export interface RunnerQuestion {
  question: string;
  format: AnswerFormat;
  options: RunnerAnswerOption[];
  statementTitle: string; // short bolded headline-style transition
  statementBody: string;
  statementImageSrc?: string | null;
}

/** Fully-resolved, final colors the runner computes per-viewport and passes to
 *  slides (values are token refs like `var(--color-ink)` or hex overrides). */
export interface ResolvedQuizTheme {
  font: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
  accentTextColor: string;
  /** Validation/error text color, resolved per-viewport so errors clear WCAG AA
   *  on BOTH the light and dark scrim (never a theme-agnostic Tailwind red). */
  dangerColor: string;
}

/** Fully-resolved chrome strings — every field present (config override merged
 *  over the English defaults). Slides read from this directly. */
export type ResolvedQuizLabels = Required<QuizLabels>;

export interface QuizRunnerData {
  id: string;
  /** Raw config theme; the runner resolves it per-viewport (light/dark). */
  theme: QuizTheme;
  /** Resolved chrome strings (config overrides merged over English defaults). */
  labels: ResolvedQuizLabels;
  background: QuizBackground;
  welcome: { headline: string; subheadline?: string; startLabel: string };
  questions: RunnerQuestion[];
  offerGate: { question: string; yesLabel: string; noLabel: string };
  email: { offerHeadline: string; benefits: string[]; cta: string };
  fairEnough: { headline: string; body: string; continueLabel: string; reconsiderLabel: string };
  nameLabel: string;
  phoneLabel: string;
  finalQuestion: string;
  /** Whether phone / the final question must be filled to advance (default true). */
  phoneRequired: boolean;
  whyRequired: boolean;
  thankYou: { headline: string; lines: string[] };
  redirectTo: string;
}

export interface RecordedAnswer {
  questionIndex: number;
  selected: string[]; // labels chosen
  isCorrect: boolean;
}

/** Payload sent from the runner to /api/v1/quiz (progressive capture). */
export interface QuizSubmitPayload {
  stage: "email" | "complete";
  email: string;
  name?: string;
  phone?: string;
  why?: string;
  /** Human-readable prompt for `why`, stored in CRM notes above the answer. */
  whyQuestion?: string;
  quizId: string;
  /** Opaque per-session id (no PII) so the email-stage + complete-stage posts of
   *  one lead correlate in server logs — a dropped lead is debuggable end-to-end. */
  sessionId?: string;
  resultKey?: string;
  score?: number;
  answers?: { q: string; a: string }[];
}
