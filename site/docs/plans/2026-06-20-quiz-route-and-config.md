# Self-Hosted Quiz Popup + `/quiz` Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. When building UI, also load `@templates/new-build:frontend-design` + `@templates/new-build:react-best-practices`; for live QA load `@templates/new-build:webapp-testing` + `@templates/new-build:visual-qa`; for the Mayberry port use `@sites/mayberry-and-stone:*` scoped variants; to deploy use `@templates/new-build:deploy`.

**Goal:** Add a fully self-hosted, Typeform-style quiz to the `new-build` template (and instantiate it live for Mayberry & Stone) — a multi-step quiz that renders the agency's enforced quiz contract, shows as a triggered popup (exit-intent + time-delay + scroll-depth, frequency-capped) on any page, AND lives as a standalone `/quiz` page that opens instantly and exits to the homepage, capturing leads to GoHighLevel and/or a generic webhook — with no Typeform, no new database, and no client-facing admin.

**Architecture:** Lift the proven p2p-react quiz **runner UI** (slides, background/focal-point layer, nav chrome, motion) into the template as same-site React components — stripping the iframe/postMessage/Supabase coupling — and drive it from the agency's canonical `QuizOutput` contract JSON (the same shape the skills emit and the quality gate enforces) merged with a per-site **presentation/media** config (background image w/ mobile+desktop focal points, per-statement images, brand theme, triggers, frequency, delivery target). Lead capture mirrors the existing `/api/v1/inquiry` → `upsertContact` (GHL) pipeline exactly, adding an optional server-side webhook. The quiz renders two ways from one engine: a **triggered popup overlay** mounted in the site layout, and a **standalone `/quiz` route** that force-opens over a homepage backdrop and redirects home on close.

**Tech Stack:** Next.js 16 App Router (React 19), TypeScript, Tailwind v4 (CSS-first `@theme` tokens), `motion` (framer-motion successor, `motion/react`), Zod (validation), GoHighLevel REST (`upsertContact`), `@next/third-parties/google` (`sendGAEvent`), `node:test` (new — zero-dependency test runner). No database. No new proxy.

---

## Source-of-truth references (read these before coding)

| What | Path |
|---|---|
| p2p runner to lift | `/Users/Humberto/Documents/GitHub/003. p2p-react-website/p2p-react-website/src/components/quiz/` |
| p2p popup/frequency loader | `…/p2p-react-website/src/lib/quiz/embed-script.ts` |
| p2p exit-intent to model | `…/p2p-react-website/src/app/components/FunnelForm.tsx` (`FunnelExitModal`) |
| Enforced quiz schema | `.claude/skills/typeform-quiz-popup-builder/references/output-schema.json` |
| Quiz doctrine / slide order | `.claude/skills/deliver-quiz-funnel/SKILL.md`, `.claude/skills/typeform-quiz-popup-builder/SKILL.md` |
| Mayberry quiz content | `clients/mayberry-and-stone/drafts/quiz-funnel-2026-06-18.md` (`## Output JSON Contract`, lines 679–832) |
| Inquiry route to mirror | `templates/new-build/app/api/v1/inquiry/route.ts` |
| GHL upsert | `templates/new-build/lib/ghl/contacts.ts` |
| Rate-limit / validators / sanitize / logging | `templates/new-build/lib/{rate-limit,validators,sanitize,logging}.ts` |
| Config single-source-of-truth | `templates/new-build/lib/site.config.tsx`, `lib/content.config.ts` |
| Route registry (SEO/llms) | `templates/new-build/lib/public-routes.ts` |
| Proxy (do not edit matcher) | `templates/new-build/proxy.ts` |

**Hard constraints (from `CLAUDE.md` / `TEMPLATE-STANDARDS.md`):** single source of truth (quiz content+flags live in config, never hardcoded in components); ONE sanctioned proxy (no new proxy — the quiz submit is an `/api/` route, excluded from negotiation); `next/image` + `next/font` only, no raw `<img>`/`<link>` in app code (the lifted slide `<img>` becomes `next/image` or is justified as a runner-internal exception — see Task 4); local images under `public/`; never put secrets in code/markdown; semantic `--color-*` tokens only (no raw hex).

---

## Architecture decisions (resolved during the deep dive)

1. **Content vs presentation split.** The `QuizOutput` contract (Mayberry's quiz, verbatim) is the *content* and carries NO images, theme, or triggers. A separate `quiz` config block carries *presentation*: `background` (image + mobile/desktop focal points), `statementImages[]` (one per main question), `theme` (brand colors/fonts), `triggers`, `frequency`, `delivery`, `enabled`, `showOn`, `standalone.backdrop`, `redirectTo`. An **adapter** (`lib/quiz/adapt.ts`) merges them into the renderer's `QuizRunnerData` shape.
2. **One engine, two surfaces.** `QuizExperience` = the overlay (portal, scroll-lock, reduced-motion). `QuizPopup` (in `app/(site)/layout.tsx`) arms triggers on `showOn` pages. `app/quiz/page.tsx` force-opens the same `QuizExperience` over a backdrop and redirects to `/` on close.
3. **Lift, don't rebuild.** ~13 p2p files copy near-verbatim (slides, background, nav, flow, theme, motion). Only `QuizRunner` (strip network/iframe), `QuizCloseButton` (rewire close), and the data source are rewritten. Net-new: `ClaimSlide` (contract has `claim_slide`, p2p doesn't), `QuestionSlide` answer-format extension (4 formats + scoring + optional answer image), `ThankYouSlide`.
4. **Capture mirrors inquiry.** `POST /api/v1/quiz` → `deliverQuizLead()`: GHL upsert on completion only (`quiz` tag + answers/result/score note) when `GHL_*` set, AND webhook POST when `QUIZ_WEBHOOK_URL` set — both server-side (zero CSP change). Progressive capture still posts on the email step (`stage:"email"`) for backup/webhook and on completion (`stage:"complete"`) for the full CRM lead.
5. **Triggers + caps.** `useQuizTriggers` arms exit-intent (`mouseout` + `clientY<=30` + `!relatedTarget`), time-delay (`setTimeout`), and scroll-depth (rAF-throttled), first-wins. Frequency caps via `localStorage["quiz_<id>"]` with the exact p2p schema (`once_per_day`/`twice_per_day`/`once_ever`/`always` + sticky `submitted`). Caps DON'T apply to the standalone `/quiz` route (it always opens).
6. **Preview.** `/quiz` is the canonical live preview (opens instantly in dev). Plus `?quizPreview=1` force-opens the popup on any page ignoring caps; and a dev-localhost gate (like `TweaksPanel`) lets the popup run regardless of `enabled`.
7. **No database, no admin.** Lead data lives in GHL/the webhook target. The agency authors quizzes via the existing skills (which emit the contract) and drops the JSON + media into config. The "admin" (connect Google Ads, view data) is the already-built agency-os portal — out of scope here.
8. **`/quiz` is `noindex` by default** (thin funnel page) but registered in `public-routes.ts` with a markdown view; configurable.

### File structure (template — `templates/new-build/`)

```
lib/quiz/
  types.ts        # QuizOutput contract types + QuizRunnerData renderer types + SiteQuiz config types
  flow.ts         # buildFlow/nextScreen/prevScreen/screenToQuestionIndex (lifted + claim screen)
  theme.ts        # isLightColor, deriveButtonTextColor (lifted)
  frequency.ts    # PURE gate + record fns (extracted from embed-script) — unit-tested
  score.ts        # scoreQuiz(answers, questions) vs best_answer — unit-tested
  adapt.ts        # QuizOutput + SiteQuiz → QuizRunnerData — unit-tested
  deliver.ts      # server-only: GHL + webhook fan-out — unit-tested (target selection)
lib/motion.ts     # fadeUp / staggerContainer (lifted)
components/quiz/
  QuizExperience.tsx     # client overlay portal (mounts QuizRunner; scroll-lock; reduced-motion)
  QuizPopup.tsx          # client; useQuizTriggers → opens QuizExperience on showOn pages
  QuizRunner.tsx         # rewritten state machine (render/nav core lifted, I/O stripped)
  useQuizTriggers.ts     # exit + delay + scroll + frequency (uses frequency.ts)
  runner/{QuizRunnerBackground,QuizProgressBar,QuizBackArrow,QuizDesktopNavArrows,QuizCloseButton}.tsx
  slides/{Welcome,Claim,Question,Explanation,OfferChoice,Email,FairEnough,Name,Phone,FinalQuestion,ThankYou}Slide.tsx + index.ts
components/HomeContent.tsx          # extracted homepage body (backdrop reuse)
app/quiz/page.tsx                   # standalone /quiz route
app/api/v1/quiz/route.ts           # capture endpoint
lib/site.config.tsx                # + quiz?: SiteQuiz
lib/quiz.content.ts                # the QuizOutput for this site (template = generic example)
lib/public-routes.ts               # + /quiz entry
lib/llms/page-markdown.ts          # + buildQuizMarkdown
app/md/[[...slug]]/route.ts        # + "quiz" in PAGE_MARKDOWN
app/api/openapi.json/route.ts + app/.well-known/api-catalog/route.ts  # + /api/v1/quiz
scripts/route-smoke.mjs            # + /quiz + /api/v1/quiz assertions
.env.example                       # + QUIZ block
package.json                       # + "test": "node --test 'lib/**/*.test.mjs'"
```

For Mayberry (`sites/mayberry-and-stone/`): the same engine files are **copied** (forks don't sync), then `lib/quiz.content.ts` gets Carly's contract, config gets her brand theme + image assignments, and `enabled` is turned on.

---

## Task 0: Scaffolding — test runner, env, config types

**Files:**
- Modify: `templates/new-build/package.json`
- Modify: `templates/new-build/.env.example`
- Modify: `templates/new-build/lib/site.config.tsx`
- Create: `templates/new-build/lib/quiz/types.ts`

- [ ] **Step 1: Add the test runner (final decision — `tsx` + `node:test`, TypeScript tests).** The template has no test runner today. Pure-logic tests must import the `.ts` modules directly, so use `tsx` as the loader (a `.mjs` test cannot import `.ts` without one). Add `tsx` as a devDependency and add the script:
```bash
cd templates/new-build && npm install -D tsx
```
In `package.json` `scripts`, add:
```json
"test": "node --import tsx --test \"lib/**/*.test.ts\""
```
All test files in this plan are `*.test.ts` importing the sibling `.ts` module by extensionless path (e.g. `import { scoreQuiz } from "./score"`). Note: `tsx` is a **test-only** devDep — it does not touch `next.config.ts`, so the ESM-safe-config rule is unaffected.

- [ ] **Step 2: Verify the runner works.** Run: `cd templates/new-build && npm test`
Expected: exits 0 with "tests 0 / pass 0" (no test files yet — the glob matches nothing). Confirms `node --import tsx --test` is wired.

- [ ] **Step 3: Add the QUIZ env block to `.env.example`** (mirror the ANALYTICS block's comment style):
```bash
# ---- QUIZ (self-hosted quiz popup) ----
# Master on/off override. siteConfig.quiz.enabled takes precedence; this is the
# per-environment fallback. Client-visible, so it MUST be NEXT_PUBLIC_.
NEXT_PUBLIC_QUIZ_ENABLED=false
# Optional generic webhook (Zapier/Make/Mailchimp) for quiz leads. Server-side only.
# When set, every completed quiz lead is POSTed here as JSON (in addition to GHL).
QUIZ_WEBHOOK_URL=
# Optional bearer token sent as Authorization on the webhook POST.
QUIZ_WEBHOOK_SECRET=
```

- [ ] **Step 4: Create `lib/quiz/types.ts`** — the contract types (1:1 with `output-schema.json`), the renderer types, and the config types. Full file:
```ts
// lib/quiz/types.ts
// Quiz contract (agency-os/quiz/output) + renderer + per-site config types.
// Contract counts are enforced by scripts/client-quality-gate.mjs — keep in sync
// with .claude/skills/typeform-quiz-popup-builder/references/output-schema.json.

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
export interface QuizOutput {
  client_id: string;
  readiness_label: ReadinessLabel;
  title_slide: { headline: string; subhead?: string };
  claim_slide: { headline: string; bullets: string[] }; // 2–4
  main_questions: ContractQuestion[]; // exactly 4 live
  offer_slide: { headline: string; benefit_bullets: string[]; button_text: string }; // 3 bullets
  fair_enough_slide: { headline: string; paragraph: string; second_chance_cta: string };
  info_collection: { fields: string[] }; // >= 3 descriptive strings
  alternate_questions: ContractQuestion[]; // 4 (not rendered live)
  thank_you: { headline: string; lines: string[] }; // 2–4
  follow_up_email: { subject: string; body: string }; // not rendered (CRM/email)
}

/* ------------------------- Per-site presentation ------------------------- */
export interface QuizTheme {
  font: string;             // CSS font-family name (e.g. "Playfair Display")
  textColor: string;        // hex; drives isDark contrast
  buttonColor: string;      // hex
  buttonTextColor?: string; // hex; derived if absent
}
export interface QuizBackground {
  /** Local /public path, served via next/image. */
  imageSrc: string;
  /** 0..1; floor is black. */
  opacity?: number;
  /** -100..100; negative=black wash, positive=white wash, 0=none. */
  overlayStrength?: number;
  bgFocalXDesktop?: number; // 0..100
  bgFocalYDesktop?: number;
  bgFocalXMobile?: number;
  bgFocalYMobile?: number;
}
export type Frequency = "once_per_day" | "twice_per_day" | "once_ever" | "always";
export interface QuizTriggers {
  exitIntent?: boolean;
  delaySeconds?: number | null; // null/undefined = no delay trigger
  scrollDepthPct?: number | null; // e.g. 50
}
export interface SiteQuiz {
  /** Stable id; namespaces localStorage + tags + analytics. */
  id: string;
  enabled?: boolean; // overrides NEXT_PUBLIC_QUIZ_ENABLED
  content: QuizOutput;
  theme: QuizTheme;
  background: QuizBackground;
  /** One image per main question (index-aligned); local /public paths. */
  statementImages?: (string | null)[];
  /** Pathnames the popup may auto-trigger on. The /quiz route ignores this. */
  showOn?: string[];
  triggers?: QuizTriggers;
  frequency?: Frequency; // default "once_per_day"
  /** Standalone /quiz backdrop. */
  standalone?: { backdrop?: "home" | "image" | "none" };
  /** Where completion redirects (default "/thank-you"). */
  redirectTo?: string;
  delivery?: { ghl?: boolean; webhook?: boolean };
}

/* ------------------------- Renderer (runtime) ------------------------- */
export type QuizScreen =
  | "welcome" | "claim"
  | `q${number}` | `e${number}`
  | "offer" | "email" | "fair-enough" | "name" | "phone" | "final-question" | "thank-you";

export interface RunnerAnswerOption {
  label: string; // "A".."E"
  text: string;
  isBest: boolean;
  imageSrc?: string | null; // optional answer image (defaults off)
}
export interface RunnerQuestion {
  question: string;
  format: AnswerFormat;
  options: RunnerAnswerOption[];
  statementTitle: string; // first sentence/clause of the statement, bolded
  statementBody: string;
  statementImageSrc?: string | null;
}
export interface QuizRunnerData {
  id: string;
  theme: Required<QuizTheme>;
  background: QuizBackground;
  welcome: { headline: string; subheadline?: string; startLabel: string };
  claim: { headline: string; bullets: string[] };
  questions: RunnerQuestion[];
  offerGate: { question: string; yesLabel: string; noLabel: string };
  email: { offerHeadline: string; benefits: string[]; cta: string };
  fairEnough: { headline: string; body: string; continueLabel: string; reconsiderLabel: string };
  nameLabel: string;
  phoneLabel: string;
  finalQuestion: string;
  thankYou: { headline: string; lines: string[] };
  redirectTo: string;
}
export interface RecordedAnswer {
  questionIndex: number;
  selected: string[]; // labels chosen
  isCorrect: boolean;
}
```

- [ ] **Step 5: Add `quiz?: SiteQuiz` to the `SiteConfig` interface** in `site.config.tsx` (after `analytics?`), and import the type:
```ts
import type { SiteQuiz } from "@/lib/quiz/types";
// inside interface SiteConfig:
  quiz?: SiteQuiz;
```
(Leave the `siteConfig` literal's `quiz` unset for now — the template wires a real example in Task 11.)

- [ ] **Step 6: Typecheck + commit.** Run: `npm run typecheck` → expect PASS. Then (include `package-lock.json` from the `tsx` install):
```bash
git add templates/new-build/package.json templates/new-build/package-lock.json templates/new-build/.env.example templates/new-build/lib/site.config.tsx templates/new-build/lib/quiz/types.ts templates/new-build/docs/plans/2026-06-20-quiz-route-and-config.md
git commit -m "feat(quiz): scaffold quiz config types, test runner, env block"
```

---

## Task 1: Pure renderer modules — flow, theme, motion (lift)

**Files:**
- Create: `templates/new-build/lib/quiz/flow.ts`
- Create: `templates/new-build/lib/quiz/theme.ts`
- Create: `templates/new-build/lib/motion.ts`

- [ ] **Step 1: Lift `lib/motion.ts`** verbatim from the p2p `src/lib/motion.ts` (`fadeUp`, `staggerContainer`), changing the import to `motion/react`. Full file:
```ts
import type { Variants } from "motion/react";
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } },
};
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
};
```

- [ ] **Step 2: Lift `lib/quiz/theme.ts`** from p2p `src/components/quiz/runner/quiz-runner-theme.ts` — `isLightColor(hex)` (luminance `r*0.299 + g*0.587 + b*0.114 > 128`) and `deriveButtonTextColor`. Copy as-is (pure, no coupling).

- [ ] **Step 3: Create `lib/quiz/flow.ts`** — lifted from p2p `quiz-runner-flow.ts` but ADD the `claim` screen after `welcome`, and key off `QuizScreen` from our `types.ts`:
```ts
import type { QuizScreen } from "./types";
export const RUNTIME_QUESTION_LIMIT = 4;
export function buildFlow(questionCount: number): QuizScreen[] {
  const capped = Math.min(questionCount, RUNTIME_QUESTION_LIMIT);
  const flow: QuizScreen[] = ["welcome", "claim"];
  for (let i = 1; i <= capped; i += 1) flow.push(`q${i}` as QuizScreen, `e${i}` as QuizScreen);
  flow.push("offer", "email", "fair-enough", "name", "phone", "final-question", "thank-you");
  return flow;
}
export function screenToQuestionIndex(screen: QuizScreen): number {
  const m = /^[qe](\d+)$/.exec(screen);
  return m ? Number(m[1]) - 1 : -1;
}
export function nextScreen(screen: QuizScreen, flow: QuizScreen[]): QuizScreen {
  const i = flow.indexOf(screen);
  return flow[Math.min(i + 1, flow.length - 1)];
}
export function prevScreen(screen: QuizScreen, flow: QuizScreen[]): QuizScreen {
  const i = flow.indexOf(screen);
  return flow[Math.max(i - 1, 0)];
}
```

- [ ] **Step 4: Typecheck + commit.**
Run: `npm run typecheck` → PASS.
```bash
git add templates/new-build/lib/quiz/flow.ts templates/new-build/lib/quiz/theme.ts templates/new-build/lib/motion.ts
git commit -m "feat(quiz): lift pure flow/theme/motion modules"
```

---

## Task 2: Scoring module (TDD)

**Files:**
- Create: `templates/new-build/lib/quiz/score.ts`
- Test: `templates/new-build/lib/quiz/score.test.ts`

- [ ] **Step 1: Write the failing test.** `score.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { isAnswerCorrect, scoreQuiz } from "./score";

test("single-select correct", () => {
  assert.equal(isAnswerCorrect(["A"], "Right answer", [{ label: "A", text: "Right answer" }]), true);
});
test("single-select wrong", () => {
  assert.equal(isAnswerCorrect(["B"], "Right answer", [
    { label: "A", text: "Right answer" }, { label: "B", text: "Nope" },
  ]), false);
});
test("select_all matches the full comma-joined set, order-insensitive", () => {
  const opts = [
    { label: "A", text: "one" }, { label: "B", text: "two" },
    { label: "C", text: "three" }, { label: "D", text: "four" },
  ];
  assert.equal(isAnswerCorrect(["C", "A", "B"], "one, two, three", opts), true);
  assert.equal(isAnswerCorrect(["A", "B"], "one, two, three", opts), false);
});
test("scoreQuiz counts correct of total", () => {
  const questions = [
    { options: [{ label: "A", text: "x", isBest: true }, { label: "B", text: "y", isBest: false }] },
    { options: [{ label: "A", text: "x", isBest: false }, { label: "B", text: "y", isBest: true }] },
  ];
  const recorded = [{ questionIndex: 0, selected: ["A"] }, { questionIndex: 1, selected: ["A"] }];
  assert.deepEqual(scoreQuiz(recorded, questions), { correct: 1, total: 2 });
});
```

- [ ] **Step 2: Run → fail.** Run: `npm test` → FAIL ("Cannot find module './score'").

- [ ] **Step 3: Implement `lib/quiz/score.ts`:**
```ts
import type { RunnerQuestion } from "./types";

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}
/** options: objects with at least { label, text }. */
export function isAnswerCorrect(
  selectedLabels: string[],
  bestAnswer: string,
  options: { label: string; text: string }[],
): boolean {
  const selectedTexts = new Set(
    selectedLabels.map((l) => norm(options.find((o) => o.label === l)?.text ?? "")),
  );
  const bestTexts = new Set(
    bestAnswer.split(",").map((s) => norm(s)).filter(Boolean),
  );
  if (selectedTexts.size !== bestTexts.size) return false;
  for (const t of bestTexts) if (!selectedTexts.has(t)) return false;
  return true;
}
export function scoreQuiz(
  recorded: { questionIndex: number; selected: string[] }[],
  questions: Pick<RunnerQuestion, "options">[],
): { correct: number; total: number } {
  let correct = 0;
  for (const r of recorded) {
    const q = questions[r.questionIndex];
    if (!q) continue;
    const bestSet = new Set(q.options.filter((o) => o.isBest).map((o) => o.label));
    const selSet = new Set(r.selected);
    if (bestSet.size === selSet.size && [...bestSet].every((l) => selSet.has(l))) correct += 1;
  }
  return { correct, total: questions.length };
}
```
(The test toolchain — `tsx` + `node --import tsx --test` + `.test.ts` files — was set in Task 0 Step 1, so no per-task reconciliation is needed.)

- [ ] **Step 4: Run → pass.** Run: `npm test` → PASS (4 tests).

- [ ] **Step 5: Commit.** (`package.json`/`tsx` already committed in Task 0 — only the score files here.)
```bash
git add templates/new-build/lib/quiz/score.ts templates/new-build/lib/quiz/score.test.ts
git commit -m "feat(quiz): scoring (single + multi-select), TDD"
```

---

## Task 3: Frequency-cap module (TDD)

**Files:**
- Create: `templates/new-build/lib/quiz/frequency.ts`
- Test: `templates/new-build/lib/quiz/frequency.test.ts`

Extract the p2p `embed-script.ts` gate (`:31-42`) and record-write (`:130-142`) into pure, injectable functions (so they're testable without `localStorage`/`Date`).

- [ ] **Step 1: Write the failing test** (`frequency.test.ts`) covering: `submitted` blocks all; `once_ever` blocks after any prior show; `once_per_day` blocks same-day; `twice_per_day` blocks at 2 same-day; `always` never blocks; `recordShow` increments same-day and resets on a new day:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { isCapped, recordShow } from "./frequency";

const today = "Sat Jun 20 2026";
test("submitted blocks regardless of frequency", () => {
  assert.equal(isCapped({ submitted: true }, "always", today), true);
});
test("once_ever blocks after any prior show", () => {
  assert.equal(isCapped({ shownAt: 1 }, "once_ever", today), true);
  assert.equal(isCapped({}, "once_ever", today), false);
});
test("once_per_day blocks same day only", () => {
  assert.equal(isCapped({ shownDate: today }, "once_per_day", today), true);
  assert.equal(isCapped({ shownDate: "Fri Jun 19 2026" }, "once_per_day", today), false);
});
test("twice_per_day blocks at 2 same day", () => {
  assert.equal(isCapped({ shownDate: today, shownCount: 2 }, "twice_per_day", today), true);
  assert.equal(isCapped({ shownDate: today, shownCount: 1 }, "twice_per_day", today), false);
});
test("always never blocks (unless submitted)", () => {
  assert.equal(isCapped({ shownDate: today, shownCount: 9 }, "always", today), false);
});
test("recordShow increments same day, resets new day, preserves submitted", () => {
  assert.deepEqual(recordShow({ shownDate: today, shownCount: 1, submitted: true }, today, 1000),
    { shownAt: 1000, shownDate: today, shownCount: 2, submitted: true });
  assert.deepEqual(recordShow({ shownDate: "Fri Jun 19 2026", shownCount: 5 }, today, 1000),
    { shownAt: 1000, shownDate: today, shownCount: 1, submitted: false });
});
```

- [ ] **Step 2: Run → fail.** `npm test` → FAIL.

- [ ] **Step 3: Implement `lib/quiz/frequency.ts`:**
```ts
import type { Frequency } from "./types";
export interface QuizShowRecord {
  shownAt?: number; shownDate?: string; shownCount?: number; submitted?: boolean;
}
/** Mirrors p2p embed-script.ts:31-42 precedence. submitted wins. */
export function isCapped(rec: QuizShowRecord, freq: Frequency, today: string): boolean {
  if (rec.submitted) return true;
  if (freq === "once_ever" && rec.shownAt) return true;
  if (freq === "once_per_day" && rec.shownDate === today) return true;
  if (freq === "twice_per_day" && rec.shownDate === today && (rec.shownCount ?? 0) >= 2) return true;
  return false;
}
/** Mirrors p2p embed-script.ts:130-142. */
export function recordShow(prev: QuizShowRecord, today: string, now: number): QuizShowRecord {
  const count = prev.shownDate === today ? (prev.shownCount ?? 0) + 1 : 1;
  return { shownAt: now, shownDate: today, shownCount: count, submitted: prev.submitted || false };
}
/* Browser helpers (not unit-tested; thin localStorage wrappers). */
const KEY = (id: string) => `quiz_${id}`;
export function readRecord(id: string): QuizShowRecord {
  try { return JSON.parse(localStorage.getItem(KEY(id)) || "{}"); } catch { return {}; }
}
export function writeRecord(id: string, rec: QuizShowRecord): void {
  try { localStorage.setItem(KEY(id), JSON.stringify(rec)); } catch { /* ignore */ }
}
export function markSubmitted(id: string): void {
  const cur = readRecord(id); writeRecord(id, { ...cur, submitted: true });
}
```

- [ ] **Step 4: Run → pass.** `npm test` → PASS.

- [ ] **Step 5: Commit.**
```bash
git add templates/new-build/lib/quiz/frequency.ts templates/new-build/lib/quiz/frequency.test.ts
git commit -m "feat(quiz): frequency-cap gate + record (TDD, lifted semantics)"
```

---

## Task 4: Slide + chrome components (lift + extend)

**Files (create under `templates/new-build/components/quiz/`):**
- `runner/QuizRunnerBackground.tsx`, `runner/QuizProgressBar.tsx`, `runner/QuizBackArrow.tsx`, `runner/QuizDesktopNavArrows.tsx`, `runner/QuizCloseButton.tsx`
- `slides/*.tsx` (11 slides) + `slides/index.ts`

**Lift rules:** copy each p2p component, then (a) change `motion` import to `motion/react`, (b) replace p2p design tokens with the template's semantic `--color-*` tokens or literals (p2p tokens to swap: `bg-muted`, `text-body`, `focus-ring`/`focus:ring-focus-ring`, `status-error*` — see p2p extraction §6), (c) retype props against our `lib/quiz/types.ts`. The lifted slide uses a raw `<img>` for the statement image — **convert it to `next/image`** (`fill` in a fixed-aspect wrapper) to satisfy the no-raw-`<img>` rule; the background layer's CSS `background-image` is fine (it's a decorative layer, not content).

- [ ] **Step 1: Lift `QuizRunnerBackground.tsx`** verbatim (it already does desktop/mobile focal points via the 640px `isMobile` switch + `backgroundPosition: "{X}% {Y}%"` + `bg-black` floor + overlay). Keep the CSS `background-image` approach (justified: decorative full-bleed layer). Retype `quiz` to `QuizRunnerData`.

- [ ] **Step 2: Lift the nav chrome** — `QuizProgressBar`, `QuizBackArrow` (mobile, `sm:hidden`), `QuizDesktopNavArrows` (desktop, `hidden sm:flex`). Swap tokens to `--color-*`. These take `theme`.

- [ ] **Step 3: Rewrite `QuizCloseButton.tsx`** — keep the visual (top-right X), but the prop is now `{ onClose: () => void; theme }` driven by React state (NOT `postMessage`). Always render when an `onClose` is provided.

- [ ] **Step 4: Lift the simple slides** verbatim (token swaps only): `WelcomeSlide`, `OfferChoiceSlide`, `EmailSlide`, `FairEnoughSlide`, `NameSlide`, `PhoneSlide`, `FinalQuestionSlide`. Each keeps the `staggerContainer`/`fadeUp` wrapper + `{ isDark, textColor, theme }` trailing props.

- [ ] **Step 5: Create `ClaimSlide.tsx`** (NET-NEW — contract has `claim_slide`, p2p has no claim slide). Same visual language as `WelcomeSlide`: eyebrow + `headline` (h2) + a checkmark `<ul>` of `bullets` + a "Continue" button (`onNext`). Props: `{ headline: string; bullets: string[]; nextLabel: string; onNext: () => void; isDark; textColor; theme }`.

- [ ] **Step 6: Extend `QuestionSlide.tsx`** (lift + extend for 4 answer formats + scoring + optional answer image):
  - Single-select (`multiple_choice`, `true_false`): tap an option → 600ms reveal → `onAnswer([label])`.
  - Multi-select (`select_all`, `all_of_the_above`): toggle options, show a "Continue" confirm button → `onAnswer(selectedLabels[])`.
  - Each option button renders the letter badge + text, and an optional `next/image` thumbnail when `option.imageSrc` is set (defaults off).
  - Props: `{ questionNumber, totalQuestions, question, format, options: RunnerAnswerOption[], onAnswer: (labels: string[]) => void, isDark, textColor, theme }`. Keep `key={option.label}` (labels unique A..E).

- [ ] **Step 7: Create `ThankYouSlide.tsx`** (NET-NEW) — renders `thankYou.headline` + `lines[]`; used for a brief success state before redirect. Props `{ headline, lines, isDark, textColor, theme }`.

- [ ] **Step 8: Create `slides/index.ts`** barrel exporting all 11 slides.

- [ ] **Step 9: Typecheck + commit.** `npm run typecheck` → PASS (components not yet imported anywhere; that's fine).
```bash
git add templates/new-build/components/quiz/runner templates/new-build/components/quiz/slides
git commit -m "feat(quiz): lift slide + nav chrome, add ClaimSlide/ThankYouSlide, extend QuestionSlide for 4 answer formats"
```

---

## Task 5: QuizRunner state machine (rewrite)

**Files:**
- Create: `templates/new-build/components/quiz/QuizRunner.tsx`

Keep the p2p `renderSlide()` dispatcher, `slideVariants` + `AnimatePresence mode="wait"` shell, and all nav/progress math. **Strip:** the three `/api/quiz/*` fetches, `sessionId`/`sessionToken`/`sessionCreated`, `trackQuizEvent`/`handleQuizRedirect` imports, the iframe `isOverlayEmbed`/`postMessage`/`handleClose` block, and the font-injection effect. **Add:** `claim` screen handling, answer recording (`RecordedAnswer[]`), `sendGAEvent` analytics, an `onSubmit` callback prop, and an `onClose` prop.

- [ ] **Step 1: Implement `QuizRunner.tsx`.** Props:
```ts
interface QuizRunnerProps {
  quiz: QuizRunnerData;
  fillParent?: boolean;     // overlay = true (h-full w-full) vs full-screen (h-screen w-screen)
  onClose?: () => void;     // wired to the overlay's close
  onSubmit: (payload: QuizSubmitPayload) => Promise<{ ok: boolean }>; // progressive: email + complete
  onComplete?: () => void;  // after final submit, before redirect
}
```
- State: `screen`, `answers: RecordedAnswer[]`, `email`, `name`, `phone`, `isSubmitting`, `apiError`.
- Flow handlers mirror p2p (welcome→claim→q1…): `handleStartQuiz`→`claim`; `claim` Continue→`q1`; `handleAnswer(labels)` records + advances to `e{n}`; explanation Next→next q or `offer`; `offer` accept→`email`, decline→`fair-enough`; fair-enough continue→`email`, reconsider→`offer`; `handleEmailSubmit`→`onSubmit({stage:"email", email, ...})` then `name`; name→`phone`; phone→`final-question`; `handleFinalSubmit`→compute score via `scoreQuiz`, `onSubmit({stage:"complete", email, name, phone, why, answers, score})`, fire `quiz_completed`, `markSubmitted(quiz.id)`, then `onComplete?.()` (overlay redirects).
- Analytics (client, `sendGAEvent`): `quiz_viewed` on mount, `question_answered` per answer (with `quiz_id`, `step`), `email_submitted` after email step, `quiz_completed` with `score`.
- Render `QuizRunnerBackground`, the `AnimatePresence` slide shell, `QuizProgressBar` (hide on welcome/thank-you), `apiError` alert, mobile back / desktop arrows, and `QuizCloseButton` when `onClose` is set.
- `QuizSubmitPayload` shape:
```ts
interface QuizSubmitPayload {
  stage: "email" | "complete";
  email: string; name?: string; phone?: string; why?: string;
  quizId: string; resultKey?: string; score?: number;
  answers?: { q: string; a: string }[];
}
```

- [ ] **Step 2: Typecheck + commit.** `npm run typecheck` → PASS.
```bash
git add templates/new-build/components/quiz/QuizRunner.tsx
git commit -m "feat(quiz): same-site QuizRunner state machine (network/iframe stripped, claim+scoring added)"
```

---

## Task 6: Adapter — contract → runner data (TDD)

**Files:**
- Create: `templates/new-build/lib/quiz/adapt.ts`
- Test: `templates/new-build/lib/quiz/adapt.test.ts`

- [ ] **Step 1: Write the failing test** asserting `adaptQuiz(siteQuiz)` returns a `QuizRunnerData` with: 4 questions; options labeled A..E with `isBest` set from `best_answer` (incl. comma-joined multi); `statementImageSrc` index-aligned from `statementImages`; theme defaults filled (`buttonTextColor` derived); `info_collection.fields` mapped to email/name/phone/final labels by index; `redirectTo` defaulting to `/thank-you`; offer gate Yes/Not-Yet synthesized from `offer_slide`. Use a trimmed fixture quiz.

- [ ] **Step 2: Run → fail.** `npm test` → FAIL.

- [ ] **Step 3: Implement `lib/quiz/adapt.ts`** — pure function `adaptQuiz(q: SiteQuiz): QuizRunnerData`:
  - Labels: `["A","B","C","D","E"]` by option index.
  - `isBest`: split `best_answer` on commas, normalize, mark options whose normalized text is in the set.
  - First main-question `statement`: split into a short bolded `statementTitle` (first sentence, ≤~8 words) + `statementBody` remainder; attach `statementImageSrc = statementImages?.[i] ?? null`.
  - `welcome` from `title_slide`; `claim` from `claim_slide`; `email` benefits from `offer_slide.benefit_bullets` + `cta = offer_slide.button_text`; `offerGate.question = offer_slide.headline`, `yesLabel = offer_slide.button_text`, `noLabel = "Not yet"`; `fairEnough` from `fair_enough_slide`; `nameLabel/phoneLabel/finalQuestion` parsed from `info_collection.fields[1..3]` with fallbacks; `thankYou` from `thank_you`; `redirectTo = q.redirectTo ?? "/thank-you"`; theme defaults (`buttonTextColor` via `deriveButtonTextColor`).

- [ ] **Step 4: Run → pass.** `npm test` → PASS.

- [ ] **Step 5: Commit.**
```bash
git add templates/new-build/lib/quiz/adapt.ts templates/new-build/lib/quiz/adapt.test.ts
git commit -m "feat(quiz): contract→runner adapter (TDD)"
```

---

## Task 7: Overlay + popup trigger components

**Files:**
- Create: `templates/new-build/components/quiz/useQuizTriggers.ts`
- Create: `templates/new-build/components/quiz/QuizExperience.tsx`
- Create: `templates/new-build/components/quiz/QuizPopup.tsx`

- [ ] **Step 1: Implement `useQuizTriggers.ts`** (client hook) using `frequency.ts`. Signature per the p2p extraction §5: `{ id, frequency, delayMs, scrollDepthPct, exitIntent, blockedPathSegments }` → `{ isOpen, open, close, reason }`. On mount: read record, `isCapped` (+ path-blocked) → inert. Else arm time-delay (`setTimeout`), scroll-depth (rAF-throttled passive `scroll`), exit-intent (`mouseout` + `clientY<=30` + `!relatedTarget`); first-wins `fire(reason)` → `setIsOpen(true)` + `writeRecord(recordShow(...))` + `sendGAEvent("event","quiz_shown",{quiz_id:id,reason})` + teardown all. Honor a `?quizPreview=1` query param to force-open ignoring caps.

- [ ] **Step 2: Implement `QuizExperience.tsx`** (client) — the portal/overlay:
  - `fixed inset-0 z-[60]` container; renders `<QuizRunner quiz={adaptQuiz(siteQuiz)} fillParent onClose={onClose} onSubmit={postQuizLead} onComplete={...}/>`.
  - Locks body scroll while open (and pauses Lenis on Mayberry — guard with an optional `getLenis()` dynamic import so the template (no Lenis) is unaffected).
  - Honors `prefers-reduced-motion` (the runner's motion already respects `MotionConfig`; in the template wrap with `MotionConfig reducedMotion="user"` if not globally present).
  - `postQuizLead(payload)` = `fetch("/api/v1/quiz", { method: "POST", body: JSON.stringify({ ...payload, sourcePage: location.pathname, ...attribution }) })` returning `{ ok }`.
  - Props: `{ siteQuiz: SiteQuiz; onClose: () => void; onComplete?: () => void }`.

- [ ] **Step 3: Implement `QuizPopup.tsx`** (client) — mounted in the site layout:
  - Reads `siteConfig.quiz`; resolves `QUIZ_ENABLED = quiz?.enabled ?? process.env.NEXT_PUBLIC_QUIZ_ENABLED === "true"` PLUS a dev-localhost force (`process.env.NODE_ENV !== "production" && hostname === "localhost"`).
  - If disabled or no quiz → render null. If `showOn` set and `usePathname()` not in it → null.
  - Calls `useQuizTriggers(...)`; renders `<QuizExperience siteQuiz={quiz} onClose={close} />` when `isOpen`.

- [ ] **Step 4: Typecheck + commit.** `npm run typecheck` → PASS.
```bash
git add templates/new-build/components/quiz/useQuizTriggers.ts templates/new-build/components/quiz/QuizExperience.tsx templates/new-build/components/quiz/QuizPopup.tsx
git commit -m "feat(quiz): triggers hook + overlay + popup wrapper"
```

---

## Task 8: Capture endpoint + delivery (TDD on delivery)

**Files:**
- Create: `templates/new-build/lib/quiz/deliver.ts`
- Test: `templates/new-build/lib/quiz/deliver.test.ts`
- Create: `templates/new-build/app/api/v1/quiz/route.ts`
- Modify: `templates/new-build/lib/validators.ts` (add `QuizLeadSchema`)

- [ ] **Step 1: Add `QuizLeadSchema`** to `lib/validators.ts` (mirror the `emptyToUndefined` idiom; email required, rest optional; cap `answers`):
```ts
const QuizAnswerItem = z.object({ q: z.string().max(160), a: z.string().max(400) });
export const QuizLeadSchema = z.object({
  stage: z.enum(["email", "complete"]).optional(),
  email: z.string().email("Please enter a valid email address"),
  name: z.preprocess(emptyToUndefined, z.string().min(1).max(100).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  why: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
  quizId: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
  resultKey: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
  score: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(100).optional()),
  answers: z.array(QuizAnswerItem).max(40).optional(),
});
export type QuizLeadInput = z.infer<typeof QuizLeadSchema>;
```

- [ ] **Step 2: Write the failing delivery test** (`deliver.test.ts`) — mock `globalThis.fetch` + env; assert: no targets configured → `{ ok:false, error:"integration_not_configured" }`; webhook-only success → `{ ok:true, delivered:["webhook"] }`; both configured, GHL fails but webhook ok → `{ ok:true, delivered:["webhook"] }`; both fail → `{ ok:false }`. (Stub `upsertContact` by setting/clearing `GHL_*` env and intercepting `fetch` to the GHL base.)

- [ ] **Step 3: Run → fail.** `npm test` → FAIL.

- [ ] **Step 4: Implement `lib/quiz/deliver.ts`** exactly per the template-lead-api extraction §6 (`deliverQuizLead`: `wantGhl = GHL_PIT_TOKEN && GHL_LOCATION_ID` only on the complete stage; `wantWebhook = QUIZ_WEBHOOK_URL`; none → `integration_not_configured`; fire targets via `Promise.all`; answers/result/score → note via `answersToNote`; tags only `quiz`; webhook = server-side `fetch` with optional bearer + 10s timeout; structured `logInfo/logWarn/logError` with `quiz_*` events, never PII).

- [ ] **Step 5: Run → pass.** `npm test` → PASS.

- [ ] **Step 6: Implement `app/api/v1/quiz/route.ts`** — mirror `/api/v1/inquiry` exactly (CORS, `json()`, `OPTIONS` 204, rate-limit `quiz:${ip}` 10/min, body cap 16384, honeypot `hp` silent-200, `QuizLeadSchema`, sanitize `source_agent`/`sourcePage`, `attributionFromJson`) → `deliverQuizLead(...)` → `{ ok:true, stage }` / `{ ok:false, error:"submission_failed" }` (503 when `integration_not_configured`). `logInfo("quiz_lead_received", { stage, targets })`.

- [ ] **Step 7: Verify route locally.** Run: `npm run dev` (note the port), then:
```bash
curl -s -X POST http://localhost:3000/api/v1/quiz -H "Content-Type: application/json" \
  -d '{"stage":"complete","email":"qa@example.com","quizId":"demo","score":3}'
```
Expected: `{"ok":false,"error":"submission_failed"}` with 503 when GHL/webhook unset (correct fail-closed), OR `{"ok":true,"stage":"complete"}` if a webhook/GHL is configured. Body must be opaque (no PII echo).

- [ ] **Step 8: Commit.**
```bash
git add templates/new-build/lib/quiz/deliver.ts templates/new-build/lib/quiz/deliver.test.ts templates/new-build/app/api/v1/quiz/route.ts templates/new-build/lib/validators.ts
git commit -m "feat(quiz): /api/v1/quiz capture endpoint + GHL/webhook delivery (TDD)"
```

---

## Task 9: Standalone `/quiz` route + homepage backdrop

**Files:**
- Create: `templates/new-build/components/HomeContent.tsx`
- Modify: `templates/new-build/app/(site)/page.tsx` (extract body into `HomeContent`)
- Create: `templates/new-build/app/quiz/page.tsx`
- Create: `templates/new-build/components/quiz/QuizStandalone.tsx` (client)

- [ ] **Step 1: Extract `HomeContent.tsx`.** Move the JSX body of `app/(site)/page.tsx`'s default export into `components/HomeContent.tsx` (a server component returning the same fragment). `page.tsx` now renders `<HomeContent />`. Keep `metadata`/JSON-LD in `page.tsx`. Run `npm run build` to confirm the homepage is byte-equivalent.

- [ ] **Step 2: Create `QuizStandalone.tsx`** (client) — force-opens the quiz on mount over the chosen backdrop, redirects to `/` on close, redirects to `redirectTo` on complete:
```tsx
"use client";
// renders backdrop (passed as children) + <QuizExperience forceOpen ... />
// onClose => router.push("/"); onComplete => router.push(quiz.redirectTo ?? "/thank-you")
```

- [ ] **Step 3: Create `app/quiz/page.tsx`** (server) — outside `(site)` so no nav/footer chrome:
  - `export const metadata` with `robots: { index: false, follow: true }` (noindex funnel) unless config says otherwise.
  - If `!siteConfig.quiz` or disabled → `redirect("/")`.
  - Backdrop per `quiz.standalone.backdrop`: `"home"` → `<HomeContent />`; `"image"` → full-bleed `next/image` of `quiz.background.imageSrc`; `"none"` → solid token bg.
  - Renders `<QuizStandalone siteQuiz={quiz}>{backdrop}</QuizStandalone>`.

- [ ] **Step 4: Verify in browser.** Run `npm run dev`; open `/quiz`. Expected: quiz opens immediately over the backdrop; X / Esc / backdrop-tap closes → navigates to `/`; completing redirects to `/thank-you`. Use `@templates/new-build:webapp-testing` for the responsive + console-error check (mobile 390px + desktop).

- [ ] **Step 5: Commit.**
```bash
git add templates/new-build/components/HomeContent.tsx templates/new-build/app/\(site\)/page.tsx templates/new-build/app/quiz templates/new-build/components/quiz/QuizStandalone.tsx
git commit -m "feat(quiz): standalone /quiz route over homepage backdrop, exits to home"
```

---

## Task 10: Agent-readiness wiring (route registry, markdown, openapi)

**Files:**
- Modify: `templates/new-build/lib/public-routes.ts`
- Modify: `templates/new-build/lib/llms/page-markdown.ts`
- Modify: `templates/new-build/app/md/[[...slug]]/route.ts`
- Modify: `templates/new-build/app/api/openapi.json/route.ts`
- Modify: `templates/new-build/app/.well-known/api-catalog/route.ts`
- Modify: `templates/new-build/scripts/route-smoke.mjs`

- [ ] **Step 1: Register `/quiz`** in `buildPublicRoutes()` as `kind:"noindex", indexable:false, exposeInLlms:false, markdown:true` (funnel page; keeps it out of sitemap/llms but gives a markdown view). Invoke `@templates/new-build:manage-seo` to confirm the noindex/canonical choice.

- [ ] **Step 2: Add `buildQuizMarkdown()`** to `lib/llms/page-markdown.ts` (follow `buildThankYouMarkdown`) and add `"quiz"` to `PAGE_MARKDOWN` in `app/md/[[...slug]]/route.ts` so `Accept: text/markdown` at `/quiz` returns real content (not the 404 stub).

- [ ] **Step 3: List `POST /api/v1/quiz`** in `app/api/openapi.json/route.ts` and `app/.well-known/api-catalog/route.ts`, mirroring `/api/v1/inquiry` (request schema = `QuizLeadSchema` fields; opaque `{ ok }` response).

- [ ] **Step 4: Extend `scripts/route-smoke.mjs`** — add `["/quiz", "text/html"]` to `expectedRoutes`, and an assertion that `POST /api/v1/quiz` returns an opaque `{"ok":…}` body.

- [ ] **Step 5: Verify.** Run `npm run dev` then `npm run smoke:routes` → PASS. Confirm `curl -H "Accept: text/markdown" http://localhost:3000/quiz` returns markdown, not a 404 stub.

- [ ] **Step 6: Commit.**
```bash
git add templates/new-build/lib/public-routes.ts templates/new-build/lib/llms/page-markdown.ts templates/new-build/app/md templates/new-build/app/api/openapi.json templates/new-build/app/.well-known/api-catalog templates/new-build/scripts/route-smoke.mjs
git commit -m "feat(quiz): wire /quiz + /api/v1/quiz into markdown/openapi/api-catalog/smoke"
```

---

## Task 11: Template example content + layout mount + analytics

**Files:**
- Create: `templates/new-build/lib/quiz.content.ts`
- Modify: `templates/new-build/lib/site.config.tsx` (wire `quiz`)
- Modify: `templates/new-build/app/(site)/layout.tsx` (mount `QuizPopup`)
- Add: placeholder quiz images under `templates/new-build/public/placeholder/`

- [ ] **Step 1: Author a GENERIC example `QuizOutput`** in `lib/quiz.content.ts` that passes `content:qa` (no placeholder/niche-hardcoded strings; use neutral portrait-studio copy). It must satisfy the schema counts (4 main + 4 alt, claim 2–4 bullets, offer 3 bullets, statements 150–220 words). Keep it niche-neutral so every fork can see a working demo before swapping content.

- [ ] **Step 2: Wire `siteConfig.quiz`** in `site.config.tsx` referencing the example content + placeholder background (`/placeholder/hero.svg`) + neutral theme tokens + `enabled: false` (off by default in the template; forks opt in). Set `triggers: { exitIntent: true, delaySeconds: 8, scrollDepthPct: 50 }`, `frequency: "once_per_day"`, `standalone: { backdrop: "home" }`, `delivery: { ghl: true, webhook: true }`.

- [ ] **Step 3: Mount `<QuizPopup />`** in `app/(site)/layout.tsx` (after the footer, before `</body>`-equivalent). It self-gates on `enabled`/`showOn`/dev-localhost, so mounting is safe.

- [ ] **Step 4: Confirm analytics fire.** Verify `sendGAEvent` calls exist for `quiz_viewed`, `question_answered`, `email_submitted`, `quiz_completed`, `quiz_shown` (no-op off-prod; safe).

- [ ] **Step 5: Verify the whole template.** Run `npm run verify` (content:qa → typecheck → lint → build → audit) → PASS. Then `npm run dev` and confirm `/quiz` works and `?quizPreview=1` force-opens the popup on `/`.

- [ ] **Step 6: Commit.**
```bash
git add templates/new-build/lib/quiz.content.ts templates/new-build/lib/site.config.tsx templates/new-build/app/\(site\)/layout.tsx templates/new-build/public/placeholder
git commit -m "feat(quiz): template example quiz content + popup mount + analytics"
```

---

## Task 12: Template gate + live preview

- [ ] **Step 1: Full gate.** Run `npm run verify` + `npm test` + (`npm run dev` &) `npm run smoke:routes` → all PASS.
- [ ] **Step 2: Live preview the template `/quiz`** with `@templates/new-build:webapp-testing` / `@templates/new-build:visual-qa`: desktop + mobile (390px) screenshots of welcome → claim → a question (single + multi) → statement (with image) → offer → email → thank-you; confirm background focal points differ desktop vs mobile, dark overlay reads, close works, no console errors.
- [ ] **Step 3: Commit any fixes**, then proceed to the Mayberry port.

---

## Task 13: Port to Mayberry & Stone (live instance)

**Files (under `sites/mayberry-and-stone/`):** copy the engine, then add real content + brand + images.

- [ ] **Step 1: Copy the engine** from the template into the fork: `lib/quiz/*`, `lib/motion.ts`, `components/quiz/**`, `app/api/v1/quiz/route.ts`, `app/quiz/page.tsx`, `components/HomeContent.tsx` (extract Mayberry's `app/(site)/page.tsx` body the same way), the `QuizLeadSchema` addition to `lib/validators.ts`, the agent-readiness wiring (public-routes/md/openapi/api-catalog/route-smoke), the `.env.example` QUIZ block, and `package.json` test script. Reconcile against any fork-specific differences (GSAP/Lenis present — `QuizExperience` pauses Lenis via `getLenis()`; `components/mns/kit.tsx` primitives available for visual consistency).

- [ ] **Step 2: Add Carly's quiz** to `sites/mayberry-and-stone/lib/quiz.content.ts` — the verbatim `QuizOutput` from `clients/mayberry-and-stone/drafts/quiz-funnel-2026-06-18.md` (lines 679–832). Strip the `[LINK]`/`[First Name]` merge tokens from `follow_up_email` only if rendered (it isn't — safe to leave).

- [ ] **Step 3: Wire `siteConfig.quiz`** with Mayberry's brand theme (`font: "Playfair Display"`, `textColor: "#F1ECE3"` for dark overlay or `#2C2620` for light — pick per background; `buttonColor: "#2C2620"` ink pill, hover gold) and image assignments (from the asset inventory): `background.imageSrc = "/images/boudoir/dsc_0733-r.jpg"` (intimate, overlay-friendly), focal points tuned for desktop vs mobile; `statementImages = ["/images/boudoir/dsc_5038r-2.jpg","/images/boudoir/m_and_s_ct-7r.jpg","/images/boudoir/dsc_0733-r.jpg","/images/boudoir/m_and_s_ce-239.jpg"]`. Set `redirectTo: "/thank-you"`, `showOn` (home + key pages), `enabled: true`, `delivery: { ghl: true, webhook: false }`.

- [ ] **Step 4: Confirm `next/image` allows the assets** (all local under `public/images/boudoir/` — no CSP/remotePatterns change needed). Optimize the >1MB files if any are used as the full-bleed background (lean on `next/image`).

- [ ] **Step 5: Gate + typecheck.** From `sites/mayberry-and-stone/`: `npm run typecheck` + `npm test` + `npm run build` → PASS.

- [ ] **Step 6: Commit.**
```bash
git add sites/mayberry-and-stone
git commit -m "feat(mayberry): self-hosted bridal quiz (Carly's contract) + /quiz route, GHL delivery"
```

---

## Task 14: Mayberry live preview + visual QA

- [ ] **Step 1: Run the Mayberry dev server** (`cd sites/mayberry-and-stone && npm run dev`, note the port) and load `/quiz`. Confirm: opens instantly over the homepage backdrop; brand-correct (Playfair/Cormorant/DM Sans, cream/ink/gold, gold italic accents); background focal points correct desktop vs mobile; per-statement images render; all 4 answer formats work (T/F, multi-select, multiple_choice); offer Yes→email, Not-Yet→fair-enough; completion redirects to `/thank-you`; X/Esc/backdrop closes → `/`.
- [ ] **Step 2: Test the popup** on `/` via `?quizPreview=1` (force-open) + the dev-localhost gate; confirm exit-intent (cursor to top), 8s delay, and 50% scroll each open it, and the frequency cap suppresses a second open same day.
- [ ] **Step 3: Visual QA** with `@sites/mayberry-and-stone:visual-qa` — desktop + mobile screenshots of the full flow; fix any contrast/overflow/focal issues.
- [ ] **Step 4: Show the user live** (this is the "test it out and show me live on the quiz page" gate). Capture screenshots and the local URL.
- [ ] **Step 5: Commit any QA fixes.**

---

## Task 15: Launch (gated on user "go")

- [ ] **Step 1: Final gates** on both `templates/new-build` and `sites/mayberry-and-stone`: `npm run verify` + `npm test` → PASS. Run the repo quiz quality gate if Mayberry's contract block changed: `npm run client:quality-gate`.
- [ ] **Step 2: Open the PR** from this worktree's branch (one PR, both the template engine + Mayberry instance). Use `@templates/new-build:wrap-up`.
- [ ] **Step 3: Deploy Mayberry to a Vercel PREVIEW** with `@sites/mayberry-and-stone:deploy`; smoke `/quiz` + a real test submission to GHL (confirm the contact + note + tags land). Keep `NEXT_PUBLIC_QUIZ_ENABLED`/popup off in prod until the user approves go-live copy.
- [ ] **Step 4: Production launch** ONLY after explicit user "go": set Mayberry's Vercel env (`GHL_PIT_TOKEN`, `GHL_LOCATION_ID`, optionally `QUIZ_WEBHOOK_URL`), enable the popup, deploy prod, verify a live submission, and hand off.

---

## Assumptions & open questions (flagged, not blocking)

1. **`/quiz` backdrop = the homepage** (`standalone.backdrop:"home"`), redirect-to-home on close. If the homepage's heavy motion behind a forced-open quiz is undesirable, switch to `"image"` (full-bleed background only) — one config flip.
2. **Per-answer image tiles** are supported (optional `option.imageSrc`) but OFF for Mayberry (her answers are text). The core visual ask (background + dark overlay + per-statement images) is fully built.
3. **Mayberry images are borrowed from the gallery pool** (no bespoke quiz/statement art exists). Background = `dsc_0733-r.jpg`; statement images mapped by objection theme. Confirm with Carly whether she wants dedicated quiz art.
4. **Score is computed** (for the contact note + `quiz_completed` analytics) but the flow never blocks on it — every statement teaches regardless (challenge framing, not a graded gate), matching doctrine.
5. **Frequency cap = client `localStorage`** (post-trigger popup, so no SSR-flash concern). The standalone `/quiz` route ignores caps and always opens.
6. **Test toolchain:** introduces `tsx` + `node:test` for pure-logic TDD (the template had no runner). UI is verified via typecheck + route-smoke + live browser QA (no React testing-library/Playwright added — out of scope unless requested).
7. **Email mismatch to confirm with Carly:** site-config email `carly@mayberryandstone.com` vs GHL/site domain `boudoirbymayberryandstone.com`.
8. **No client admin built here** — connecting Google Ads / viewing data is the already-built agency-os portal (separate, owner-operated cutover).

---

## Plan review

After all tasks are drafted, dispatch ONE plan-document-reviewer subagent (per `writing-plans`/`plan-document-reviewer-prompt.md`) with the plan path + this spec. Fix any ❌ issues and re-review until ✅, max 3 iterations, then proceed to execution.
