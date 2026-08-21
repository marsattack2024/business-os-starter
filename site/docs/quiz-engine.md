# Self-Hosted Quiz Engine (template)

A fully self-hosted, Typeform-style **challenge quiz** — no Typeform, no Zapier,
no database, no client admin. Ships in every fork **disabled** with niche-neutral
placeholder copy; you enable + brand it via config.

> **This is the CANONICAL engine reference** (generic + kept in sync with the code).
> Each client site's `docs/quiz-engine.md` holds only client-specific deltas and
> points here. The operating skill is `quiz-engine-customizer` (enable / edit /
> theme / migrate); authoring the quiz *content* is `typeform-quiz-popup-builder`.

---

## What ships

| Area | Files |
|---|---|
| **Surfaces** | `components/quiz/QuizPopup.tsx` (triggered, mounted in `app/(site)/layout.tsx`), `QuizStandalone.tsx` + `QuizStandaloneScreen.tsx` (`/quiz` + `/quiz/[slug]`), `QuizExperience.tsx` (shared overlay: portal, scroll-lock, focus-trap, POST) |
| **Runner** | `QuizRunner.tsx` + `runner/*` + `slides/*` |
| **Logic (pure, tested)** | `lib/quiz/{types,flow,score,frequency,adapt,deliver,deliver-helpers,validate,registry}.ts` (+ `*.test.ts`) |
| **Content** | `lib/quiz.content.ts` (the placeholder `QuizOutput`), `lib/site.config.tsx` (`quiz` / `quizzes[]` block) |
| **Routes** | `app/api/v1/quiz/route.ts` (capture), `app/quiz/page.tsx` (default standalone), `app/quiz/[slug]/page.tsx` (named variations), `app/quiz-thank-you/page.tsx` (outside `(site)` — no full nav/footer/popup, see `docs/TEMPLATE-STANDARDS.md` §11) |
| **Shared infra reused** | `lib/ghl/contacts.ts`, `lib/validators.ts` (`QuizLeadSchema`), `lib/rate-limit.ts` (+ pure `rate-limit-core.ts`), `lib/sanitize.ts`, `lib/contact-attribution.ts`, `lib/logging.ts` |

**Design split (preserve):** Contract (`QuizOutput`) → presentation (`SiteQuiz`)
→ runtime (`QuizRunnerData`) via the pure `adaptQuiz()`. Scoring uses `isBest`
flags from `adapt.bestAnswerSet()`, not string parsing at submit. Secrets are
server-only — the browser only POSTs to `/api/v1/quiz`.

---

## Enabling it (fork checklist)

1. **Author the content.** Replace `lib/quiz.content.ts` with the client's
   `QuizOutput` (4 main + 4 alternate questions, etc.) — author via the
   `typeform-quiz-popup-builder` skill so the client quality gate passes.
2. **Point at a real image.** Set `quiz.background.imageSrc` to a real `/images/*`
   path (no-face / 3-4-length per the hero-image rule), and optionally one
   `quiz.statementImages[i]` per main question.
3. **Brand the thank-you page.** Fill `quiz.thankYouPage` (`headline`, `body`,
   `eyebrow`, `schedulerHeading`, `ctaText`/`ctaHref`) + `schedulerEmbedUrl` /
   `redemptionVideoUrl`. Empty fields fall back to neutral copy.
4. **Keep the opener concise.** `title_slide.headline` should lead with the
   offer, and `title_slide.subhead` should be one short challenge line. Do not
   put a long proof/reassurance paragraph before Q1; those jobs belong in the
   statement slides.
5. **Turn it on.** Set `quiz.enabled: true` (or `NEXT_PUBLIC_QUIZ_ENABLED="true"`).
6. **Configure delivery env** (below).

---

## Multiple quizzes per site (variations)

One site can host **several quiz variations** — different offers per genre /
service page / subdomain — all reusing the same in-site engine. Config is a
**registry**, resolved by the pure `lib/quiz/registry.ts`:

- `quizzes?: SiteQuiz[]` — the registry. Each entry needs a unique **`id`**
  (namespaces frequency caps, CRM tags, analytics) and optionally a **`slug`**
  (its `/quiz/<slug>` URL; defaults to `id`). `quiz?: SiteQuiz` stays as the
  single-variation alias and is used only when `quizzes` is empty.
- Flag one variation `default: true` — it backs `/quiz` and the global (no-`showOn`)
  popup. Give each variation its own `showOn` so the popup arms the right offer
  per page; `getPopupQuizForPath()` prefers an explicit `showOn` match over a
  global one (enabled variations win within each tier).
- Routing: `/quiz` → the default; `/quiz/[slug]` → each named variation. Only
  **enabled** variations get a live page (a disabled placeholder fork serves no
  funnel — `/quiz` redirects, `/quiz/<slug>` 404s; dev preview still renders), and
  the funnel surfaces are `robots` Disallowed. `showOn` is **prefix-matched** (a
  `/services` entry covers its children).
- Build-time gate (`generateStaticParams`): per-variation `validateSiteQuizAlignment`
  (bg image, statementImages, color/overlay overrides, accent ≥3:1, ≥1 question)
  **plus** cross-variation `validateQuizRegistry` (unique id + slug, URL-safe slugs,
  one `default`, no slug↔id collision). A misconfigured set fails `next build`.
- Isolation: frequency caps key on `quiz_<id>`, analytics carry `quiz_id`, and
  `/api/v1/quiz` resolves the variation by `quizId` to route its **own** delivery
  policy + CRM source name. Variations never collide.

A single-quiz site keeps using `quiz: {...}` and ignores all of the above.

---

## Theming (token-driven)

Colors come from the site's CSS design tokens — **never hardcoded hex**. The
quiz depends on `--color-ink`, `--color-cream`, `--color-accent` existing in
`globals.css @theme` (they do, in this template). `QuizRunner` resolves final
colors per-viewport from `theme.mode`:

| mode | text | button bg | button text | accent | accent text |
|---|---|---|---|---|---|
| light | `--color-ink` | `--color-ink` | `--color-cream` | `--color-accent` | `--color-cream` |
| dark | `--color-cream` | `--color-cream` | `--color-ink` | `--color-accent` | `--color-cream` |

So a typical config is just `mode: "light", modeMobile: "dark"`. Every color
field is an optional override (a `var(--token)` ref OR a hex — validated by
`validateSiteQuizAlignment`). Validation/error text is **also** token-driven and
resolved per-viewport — `--color-error` on light, `--color-error-on-dark` on dark
— so an invalid-email message clears WCAG AA on both scrims (never a
theme-agnostic Tailwind red). Both `globals.css` must define the error tokens.

**Fully tokenized — no hardcoded color.** Even the translucent scrim surfaces
(option chips, inputs, borders, progress track, error state) read from `--quiz-*`
CSS variables the runner sets on its root via `color-mix` of the site's own
`--color-cream` / `--color-ink` (so they follow each brand's palette, per-viewport),
with `--quiz-danger` driving error borders. A grep for `bg-black/`, `bg-white/`,
`text-red-`, or `rgba(` in `components/quiz/**` returns nothing.

**Accessibility built in:** ARIA dialog + Tab focus-trap + focus restore + Esc;
a polite `aria-live` region announces each step and focus moves to the new slide
on advance; `role="progressbar"` with `aria-valuenow`; reduced-motion honored
globally.

**Analytics:** events route through `trackQuizEvent` (`lib/quiz/analytics.ts`),
which uses `sendGTMEvent` on a GTM-configured site (the common path — `sendGAEvent`
silently no-ops there) and `sendGAEvent` on a GA-only site. Events:
`quiz_viewed`, `quiz_shown`, `quiz_question_answered` (de-duped per step),
`quiz_email_submitted`, `quiz_closed` (abandonment), `quiz_completed` — all tagged
with `quiz_id` (= the variation id). Telemetry is wrapped in try/catch — it can
never break the UI.

**Localizable chrome:** every engine string (start/continue/submit, the progress
+ select-all hints, placeholders, validation messages, nav/close aria-labels)
resolves from an optional `quiz.labels` block, defaulting to `DEFAULT_QUIZ_LABELS`
(`lib/quiz/adapt.ts`) — the single home for the English copy. A non-English fork
overrides any subset; `{current}`/`{total}`/`{count}` are interpolated. (Full RTL
layout is a deliberate out-of-scope decision for this LTR template.)

**Capture:** **every field is REQUIRED by default** (email, name, phone, the final
question) — full lead data is the studio default. A client can relax a field with
`quiz.optionalFields: ["phone"]` / `["why"]`; the email is still captured
progressively at the email step. Resilience: a route error boundary
(`app/quiz/error.tsx`) + a fail-closed component boundary around the
layout-mounted popup mean a quiz error never white-screens the host page.

---

## Delivery, security & env

**Capture** `app/api/v1/quiz/route.ts`: CORS-open for discovery but the POST
rejects `Sec-Fetch-Site: cross-site` (CSRF guard); honeypot; 16 KB **byte-accurate**
body cap; Zod (`QuizLeadSchema`); per-IP rate-limit (`quiz:${ip}`, 10/min —
progressive capture posts twice; IP is the non-spoofable hop, see Gotchas);
prod-suppressed validation errors. Resolves the posting variation by `quizId` and
calls `deliverQuizLead` with **that variation's** delivery policy + source name.

**`deliverQuizLead`** (`lib/quiz/deliver.ts`, server-only): parallel fan-out to
**GHL** on the completion stage only (`upsertContact`: quiz tag + an
operator-readable note) and/or an optional **webhook**. The GHL note is ordered
for follow-up, not scoring: final free-text answer first, source page/UTM context
next, then multiple-choice answers as backup context. Quiz score/result values
may still exist in analytics/backup payloads, but they do not render into GHL
notes.
Any success ⇒ `ok:true`; nothing configured ⇒ `integration_not_configured`;
all-fail ⇒ `all_targets_failed`. Orchestration is the pure `runDelivery()` in
`deliver-helpers.ts` (tested in `deliver.test.ts`).

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_QUIZ_ENABLED` | `"true"` (exactly) to enable, or set `quiz.enabled`. |
| `GHL_PIT_TOKEN`, `GHL_LOCATION_ID` | GoHighLevel (shared with the contact form). |
| `QUIZ_WEBHOOK_URL`, `QUIZ_WEBHOOK_SECRET` | Optional webhook fan-out (secret ≥32 chars → `Authorization: Bearer`). |

**Rate limit** is in-memory per-instance — a deliberate no-infra tradeoff (no
Upstash/Redis/KV). Fine for single-region; revisit only if a fork needs
multi-region Fluid compute.

---

## Dual word-count contract (important)

The **authoring deliverable** (the client-folder markdown the quality gate
validates) requires **150–220-word statements**. The **rendered**
`lib/quiz.content.ts` deliberately carries **condensed (~80–100-word)**
statements — long statements read as "too many words" in the popup UI. Two
artifacts, two contracts: the gate validates the deliverable; the runtime renders
the condensed copy. Keep them separate — do **not** point the gate at
`lib/quiz.content.ts`.

---

## Gotchas

- `NEXT_PUBLIC_QUIZ_ENABLED` must be **exactly** `"true"`.
- **LazyMotion `strict`** (set in `app/layout.tsx`) breaks framer variant-label
  propagation — each slide **self-fades** with direct props; the keyed wrapper is
  a plain `<div>`; **no `AnimatePresence`**.
- The standalone `/quiz` + `/quiz/[slug]` ignore triggers/caps/`enabled` (ads
  landing surfaces) and are `noindex`. Default backdrop is the config background.
- `alternate_questions` are authoring-only (never rendered) — a feature-flagged
  A/B path is a future decision.
- Multiple variations per site via `quizzes[]` (see above); a single-quiz site
  uses `quiz: {...}`. Mobile autofocus is gated to ≥768px (`useDesktopAutoFocus`)
  so the keyboard doesn't pop on phones.
- **Rate-limit IP** is taken from `cf-connecting-ip` / `x-real-ip` / the
  **rightmost** `x-forwarded-for` hop — never the spoofable leftmost one.
- **Frequency caps** fall back to an in-memory `Map` when `localStorage` is
  blocked (Safari private), so the popup still caps within a session.
- The pure logic is unit-tested (`adapt`, `score`, `flow`, `frequency`,
  `validate`, `registry`, `rate-limit-core`, `deliver-helpers`) and **wired into
  CI** via the `npm test` check in `workspace-topology.json`.

---

## Homepage-popup standard, nav CTA & per-funnel thank-you

- **`triggers.maxShowsPerDay`** (default **2**) is the homepage-popup standard:
  the popup auto-shows at most twice per LOCAL calendar day, then rests
  `submittedCooldownDays` (default 30) after a completed submission.
  `seenCooldownDays` is now an OPTIONAL extra cooldown (default off) — the per-day
  cap governs on its own. Pair with `showOn: ["/"]` (exact homepage match — never
  funnel / thank-you / promo pages) plus `delaySeconds` and/or `exitIntent`.
- **`quiz.navCta`** (e.g. `"Claim $100 Off"`) → the Navbar renders a standout link
  to the standalone `/quiz` via `getQuizNavCta(siteConfig)` — a recovery path for
  visitors who dismissed the popup (the standalone `/quiz` ignores caps and always
  opens). Omit to hide.
- The **Fair-Enough slide renders ONE forward CTA** (no "go back" / reconsider
  button) — a second suggestion only adds friction; the global nav arrow still
  allows returning.
- **Per-funnel thank-you:** the quiz redirects via `quiz.redirectTo` (default
  `/quiz-thank-you`); site forms follow the `<page-slug>-thank-you` convention —
  see `docs/thank-you-convention.md`. Contact-section + footer-NAP standard:
  `docs/contact-standard.md`.
