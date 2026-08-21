# Quiz Engine — 360 Use-Model Audit

**Date:** 2026-06-20 · **Method:** 5 read-only multi-agent auditors (responsiveness, portability/migration, connectedness, completeness, docs/skill) + live mobile preview testing (375×812) + Perplexity deep research on multi-step quiz funnel UX.
**Use model audited:** self-hosted, **native to ONE brand's React site** (Next.js App Router), single-tenant, possibly its own subdomain; "reuse" = template/migration into another client's React site; "multi-variation" = several quizzes within one brand's site.

## Scores

| Dimension | Score | Headline |
|---|---|---|
| Responsiveness & mobile UX | 6.5 | Real funnel-affecting gaps on landscape/short screens + notch (primary = mobile paid traffic) |
| Portability / migration | 6.5 | Same-stack fork = minutes; different stack needs a documented port guide + light decoupling |
| Connectedness / wiring | 7.0 | Human side fully wired; the quiz is **not advertised to agents** like `/inquiry` is |
| Completeness (test/log/build/security/edge) | 8.0 | Unusually complete for a brochure surface; route tests + correlation id are the gaps |
| Documentation & skill | 5.5 | Good enablement doc, but **no skill for editing/migrating the engine** + two docs both claim "canonical" |

---

## 1. Responsiveness — the biggest "gap we hadn't thought of" (mobile = the paid channel)

Live-tested on the preview at 375×812. The **question slides render beautifully** on mobile (dark scrim, legible cream text, gold chips). But:

- **`QZ-RESP-01` (HIGH):** 9 of 10 slides put `justify-center` **and** `overflow-y-auto` on the same element — the classic flexbox trap where, when content is taller than the viewport, the overflow above the top becomes **unreachable**. On a **landscape phone** (~360–430px tall) the QuestionSlide (progress + 2-line question + 4–5 option cards) exceeds height and the visitor **can't scroll up to the question or first option**. `ExplanationSlide` already uses the correct pattern (`min-h-0 flex-1 overflow-y-auto` + `my-auto`) — apply it to the other nine. *Confirmed by both the audit and the research (landscape + internal-scroll guidance).*
- **`QZ-RESP-02` (HIGH):** `viewportFit:"cover"` is set globally but **no quiz control honors `env(safe-area-inset-*)`** — the close (X), back chevron, and error toast sit under the notch / home indicator / rounded corners on modern phones (insets can be 34–59px; controls use a flat 16px).
- **`QZ-RESP-03` (MEDIUM):** no `scrollIntoView`/`visualViewport` handling on input focus → on a small phone the keyboard can cover the FinalQuestion textarea + Submit. (Autofocus is correctly desktop-gated, which mitigates but doesn't solve the tap-to-focus case.)
- **`QZ-RESP-04` (MEDIUM):** runner scroller lacks `overscroll-contain` → scroll-chaining/rubber-band to the locked page on iOS.
- **`QZ-RESP-05` (LOW):** mobile back chevron is 40px (< 44px floor).
- **Title-slide load transient (observed):** on the standalone `/quiz`, the raw bright backdrop image paints before the runner's dark overlay fades in → the cream title is briefly **illegible** on slow mobile (the first impression). Fix: paint the scrim on the standalone backdrop too.

**Research corroboration:** prefer `100svh` (with `100vh` fallback) over plain `vh`/`dvh` for the frame; `visualViewport`/VirtualKeyboard for the keyboard; `viewport-fit=cover` + `env(safe-area-inset-*)`; design for landscape with internal scroll. (Our fixed `inset-0` overlay already sidesteps the worst `100vh` URL-bar bug — a genuine strength.)

## 2. Safe & secure (single-tenant) — strong, postures are intentional

`~80` unit tests on the pure logic; the public POST is hardened (Zod, honeypot, rate-limit, body cap, Sec-Fetch CSRF, server-only secret boundary, HMAC webhook, GHL retry); lost leads are greppable with no PII. The deliberately-accepted single-tenant postures (open CORS + Sec-Fetch-only CSRF + idempotent-GHL; in-memory per-instance rate-limit) are correct for one brand — **document them so they aren't re-litigated as bugs.** Gaps: `QC-1` the **API route handler has no automated test**; `QC-6` no per-session correlation id linking the email-stage and complete-stage posts in logs.

## 3. Connected everywhere? — human yes, **agents no**

The popup mount, `/quiz` + `/quiz/[slug]`, GHL delivery (shared creds), GTM-aware analytics, UTM attribution, robots/noindex are all correctly wired. But this template ships agent-readiness surfaces (OpenAPI, api-catalog, WebMCP, `/api/mcp`, llms.txt) and the **quiz capture endpoint is advertised in none of them** — only `/inquiry` is:
- **`QUIZ-WIRE-01` (HIGH):** add `POST /api/v1/quiz` to `app/api/openapi.json` (lights up api-catalog discovery).
- `QUIZ-WIRE-02/03/04` (MED): a quiz tool in WebMCP + `/api/mcp`, and a one-line mention in llms.txt — all **self-gated on an enabled quiz**.
- `QUIZ-WIRE-05` (LOW): the 3 quiz env vars aren't in `.env.example`.
- Advertise the **endpoint** (a capability), never the noindexed funnel **page** — current sitemap/robots exclusion stays.

## 4. Migration / reuse game plan

- **Same-stack new-build fork (the usual case): minutes.** Copy `components/quiz/**`, `lib/quiz/**`, `lib/quiz.content.ts`, `lib/lenis-instance.ts`, the 4 routes; the fork already has the tokens, LazyMotion root, lib helpers, `@/` alias.
- **A different Next.js App Router site: ~half a day.** Provide ~7 `--color-*`/`--font-*` tokens, add the `<LazyMotion features={domAnimation} strict>` root, copy the shared `lib/*` helpers if absent (ghl/contacts, validators, sanitize, rate-limit, logging, contact-attribution, phone), set env.
- **A non-Next / non-Tailwind React site (Vite/CRA/Remix): the real lift.** Substitute `next/image→<img>`, `next/navigation→host router`, `next/dynamic→React.lazy`, route handlers→the host's API layer; Tailwind-v4 `(--x)` class syntax + `color-mix` need a v3 codemod or no-Tailwind rewrite; `server-only` must be dropped.
- **Cheap decouplings that help:** `analytics.ts` → a 3-line `window.dataLayer.push` host hook (removes the `@next/third-parties` edge); a **token-dependency manifest**; a `scripts/eject-quiz.mjs` copy script. None block the primary use; all make porting cleaner.

## 5. Documentation & the new skill (you asked about this)

- **Recommendation: a new capability skill `quiz-engine-customizer`** — separate from `typeform-quiz-popup-builder` (which authors quiz CONTENT). The boundary (content-authoring vs engine-operation) is clean. Scope: enable a quiz; swap content; theme via tokens; configure triggers / multi-variation / `optionalFields`; wire delivery env; the migration checklist; and the **do-not-break invariants** (LazyMotion-strict self-fade, the `best_answer` semicolon rule, the token dependency, required-by-default). Register it in `registry.yaml` and reference from `build-funnel`/`build-page`/`deploy`.
- **Resolve the "two canonical docs" conflict:** make `templates/new-build/docs/quiz-engine.md` the single canonical engine reference (it's generic + code-accurate); reduce the **stale** `sites/mayberry-and-stone/docs/quiz-engine.md` to a thin Mayberry-specific stub (it still says "one quiz per site", "sendGAEvent", missing registry/analytics/error files).
- Add to the canonical doc: the `best_answer` matching rule, the single-tenant security postures, and a "porting to a non-Next host" substitution table.

---

## Prioritized backlog

**Track A — Mobile responsiveness (do first; primary paid channel):** QZ-RESP-01 (centered-flex refactor of 9 slides), QZ-RESP-02 (safe-area insets), the title-slide scrim transient, then QZ-RESP-03/04/05.
**Track B — Agent-readiness wiring:** QUIZ-WIRE-01 (OpenAPI) → 02/03/04 (WebMCP/MCP/llms, self-gated) → 05 (.env.example).
**Track C — Docs + new skill:** author `quiz-engine-customizer`; make the template doc canonical + demote/refresh the Mayberry doc; add the porting table.
**Track D — Hardening/migration polish:** QC-1 route-handler tests, QC-6 correlation id, QC-7 engine-drift CI check, the analytics host-hook + token manifest + eject script.

Every fix lands in `templates/new-build` **and** re-syncs to `sites/mayberry-and-stone` (the engine is byte-identical).
