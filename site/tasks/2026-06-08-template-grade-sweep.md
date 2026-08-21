# New-Build Template — Full Grade Sweep & Reusable Rubric

Created: 2026-06-08
Scope: `templates/new-build` — every TEMPLATE aspect (SEO, AEO, performance,
responsiveness, accessibility, security, code health, reusability/moldability,
blog + content system, conversion/copy).
Method: 8 parallel read-only audit agents (one per dimension) + local gates
(`typecheck`, `lint`, `build`, `npm audit`) run on a clean `npm install`.
Question answered: *"Is this a strong, moldable placeholder to refactor and
reshare across ~20 new custom client websites?"*
Updated: 2026-06-08 (same day) — a hardening pass implemented the Fix-Now +
Fix-Before-Scaling batches, then a 5-agent verification re-scan re-graded the
template and caught a few misses (all since closed). **Grades below are POST-fix.**

> Companion docs: **`docs/TEMPLATE-STANDARDS.md`** (the canonical enforceable
> rule set + PR gate — start there), `tasks/2026-06-06-template-hardening-backlog.md`
> (why the shared primitives exist), `tasks/template-restart-checklist.md`
> (per-fork launch steps), and the project contract in `CLAUDE.md`.

---

## TL;DR — Verdict

**YES — ship it as the base for the 20 sites. The hardening pass is done.** This
was already an above-average multi-client template; after the 2026-06-08 pass it
clears the bar comfortably. All gates green — **typecheck 0 · lint 0 · build 0 ·
`npm audit` 0 vulns · content:qa pass · `✓ inlineCss` · 22/22 static pages** —
and the template's own three conversion non-negotiables (one CTA verb, persistent
mobile CTA, real per-page `sourcePage`) are now **satisfied by the base instead of
violated**. A 5-agent verification re-scan independently confirmed the fixes
landed (and caught a handful I'd missed — all since closed; zero regressions).

Realistic clone-to-launch remains **~half a day per client** (the README's "under
an hour" assumes content is already produced).

### Scorecard (before → after the hardening pass)

| Dimension | Before | After | What changed |
|---|---|---|---|
| Build & Type Health | A | **A** | gates still clean; +content:qa +`inlineCss` verified |
| Security / AppSec | A− | **A** | `/md` path-traversal guarded; JSON-LD `<`-escaped |
| AEO / Agent-readiness | A− | **A** | `/md` serves source Markdown (structure preserved); descriptors niche-driven incl. the live MCP tool |
| Performance / CWV | A− | **A** | `Button` off the client bundle; loaders memoized (`cache`); hero `dvh` |
| SEO | B+ | **A−** | `twitter:image` fallback; empty-`/blog` `noindex`; robots `/md$` |
| Responsive / Mobile | B | **A−** | global `overflow-x: clip`; `dvh` hero; fluid H1; safe-area; mobile CTA |
| Accessibility | B− | **A−** | nav Esc + focus-restore; on-dark contrast; required affordance; error-page `h1`; star a11y |
| Blog / Content system | B− | **A−** | draft + future-date gating; build frontmatter validation; related-by-tag |
| Conversion / Copy | B | **A−** | one verb sitewide; persistent mobile CTA; real `sourcePage`; duplicate scarcity removed |
| Reusability / Moldability | A− | **A−** | `photographer`/`category`/`priceRange` in config; no brand fact escapes config now |
| Code Health / Maintainability | A− | **A−** | shared `isInternalRoute`; memoized loaders (`Input`/`Textarea` still unused — see open) |

**Overall: B+ → A− / strong.** No blockers. Remaining items are low-severity
polish + a final rendered axe/screenshot pass.

---

## 2026-06-08 Hardening pass — results

A 5-agent read-only verification re-scan checked every claimed fix against the
actual code, hunted for regressions, and re-graded. **Zero regressions found.**
`tsc --noEmit`, `eslint --max-warnings 0`, `next build`, and `content:qa` all
pass; `content:qa:launch` still correctly fails on the intentional
`[Studio Name]`/`[Photographer Name]` placeholders (the gate works).

### ✅ Resolved this pass (verified)
- **Security:** `/md` + `[slug]` + `/blog/[slug]` path-traversal guards (`resolve()`+`startsWith(base+sep)` in `lib/pages.ts`/`lib/posts.ts`); JSON-LD `<`-escaping (`components/seo/JsonLd.tsx`).
- **AEO:** `/md` now serves the **source Markdown body** (headings/lists/links preserved — verified live on a temp post) instead of one-line tag-stripped HTML; niche text now derives from `siteConfig.brand.category` across OpenAPI, both MCP surfaces (`.well-known/mcp` **and** the live `/api/mcp` tool), `agent.json`, `agent-skills`, `server-card`, and the OG eyebrow — no hardcoded "photography session" remains.
- **SEO:** `twitter:image` falls back to `/opengraph-image`; per-page OG images no longer hardcode 1200×630; empty `/blog` is `noindex`; robots blocks bare `/md`.
- **Responsive:** global `overflow-x: clip` (html+body, sticky-safe); `--min-h-hero` → `95dvh` (+ `loading.tsx` skeleton); fluid clamp H1; `viewport-fit=cover` + footer safe-area; new `StickyInquirePill` mobile CTA.
- **A11y:** Navbar Escape-closes + restores focus; Footer + BookingUrgencyCTA dark text → `--color-on-dark-*` (verified ≥7.3:1); ContactForm required legend/asterisks + optional phone; error.tsx/global-error.tsx now `<h1>`; TestimonialCards stars `role="img"`+label.
- **Blog/Content:** post `status` (draft) + future-date gating + build-time frontmatter validation; `getPost` date guard; related-posts by category/tags; nav/sitemap/llms all hide `/blog` until ≥1 published post.
- **Conversion:** CTA verb standardized to "Inquire"/"Inquire Today" (GalleryGrid, FAQSection, MeetPhotographer, UrgencyBlock defaults + announcement casing); duplicate scarcity removed from the homepage (UrgencyBlock dropped from default composition, kept as a fork option); real `sourcePage` via `usePathname()`.
- **Moldability:** `brand.photographer` (kills the last hardcoded `[Name]`), `brand.category`, `brand.priceRange` added to config + wired into schema/OG/descriptors.
- **Perf:** `Button` is now a shared/server component (CSS hover/active, no framer) — off the client bundle at every CTA; `getAllPosts`/`getAllPages` memoized with React `cache`.
- **Cleanup:** `isInternalRoute` extracted to `lib/links.ts` (Footer + Button share it); revalidate `posts`-tag documented; `content:qa` bracket regex tightened (89 → 39 launch flags, no real placeholders lost).

### Round 2 — pre-PR complete sweep (4-agent) + fixes
A second full sweep found real items (none build-breaking); all fixed and
re-verified PR-ready by 2 final agents (zero regressions):
- **a11y:** focus ring → `--color-accent-text` (was `--color-accent`, 2.67:1 fail); UrgencyBlock ink-on-accent (was white-on-accent, 2.91:1); mobile drawer `max-h-[80vh] overflow-y-auto` (was `max-h-72`, clipped focusable items); TestimonialsGrid stars `role="img"` + IncludesGrid check `aria-hidden`.
- **moldability:** `og-colors.muted` synced to `--primitive-muted` oklch(42%) (+ README) — the day-one re-skin drift.
- **security:** REST inquiry hard 8 KB body cap even without Content-Length; `mcp` + `security.txt` base-URL normalized.
- **code health:** dead `AnimateIn` deleted; `Input`/`Textarea` now consumed by `ContactForm` (no more dead exports).
- **conversion:** "Get In Touch" eyebrow → "Let's Connect".
- **enforcement:** `content:qa` now runs `scanStandards`, which **fails the build** on banned CTA verbs + hardcoded niche in component/descriptor logic (negative-tested). The §1/§9 standards are no longer manual-grep-only.

**Final gate (all green): typecheck 0 · lint 0 · content:qa 0 (incl scanStandards) · build 0 · audit 0.** Both final verification agents returned **PR-ready: YES, zero blockers**.

### ⏳ Still open (low severity — none block adoption)
- **Rendered verification pass (recommended before client #1):** `@axe-core/playwright` + screenshots at 390/768/1440/1280 to confirm contrast ratios, no horizontal scroll, mobile menu focus, `StickyInquirePill` vs footer overlap, and hero `dvh` on real iOS. Verified at code level only.
- **Font weight matrix** (Playfair 400/700 × normal/italic) left as-is — `next/font` handles swap/subset/preload; trim only if a Lighthouse run shows it matters. *(Low / optional)*
- **`/thank-you`** stays inline-success by default + opt-in `redirect("/thank-you")` per ad-conversion client. *(Decision)*
- **Mobile sticky CTA is homepage-only** (the `#contact` anchor lives there); blog/landing subpages rely on inline CTAs. Extend per fork if a long subpage needs it. *(Decision)*
- **In-memory rate limiter / CSP `unsafe-inline` / regex MD sanitizer** — intentional tradeoffs (KV adapter for high-traffic forks; MDX trusted-author-only). *(Accept)*
- **`Input`/`Textarea` auto-derive ids from labels** — safe for current fields; pass an explicit `id` if a fork has two labels that slugify identically. *(Latent / low)*

> The detailed **pre-fix** findings below (Fix Now / Fix Before Scaling / Accept /
> Monitor / Keep) are retained as the original audit record; their statuses are
> summarized above.

---

## How to use this rubric (per-site grading)

Copy the **Grading Rubric** section below into each client's
`sites/{client}/AUDIT-BACKLOG.md` (or run this same sweep) and check items off.
Anything left unchecked at launch is a finding. Pair with
`npm run verify` + `npm run content:qa:launch` + `npm run smoke:routes`.

---

## Grading Rubric (reusable — grade every fork against this)

### A. Build & Type Health
- [ ] `npm run typecheck` clean (0 errors)
- [ ] `npm run lint` clean (`--max-warnings 0`)
- [ ] `npm run build` clean; review the route table (home `○ Static`, blog/`[slug]` `● SSG`)
- [ ] `npm audit --audit-level=high` → 0 high/critical
- [ ] `npm run verify` and `npm run content:qa:launch` clean
- [ ] First Load JS shared ≤ ~110 kB (today: 102 kB)

### B. Security / AppSec
- [ ] No secrets committed; `.env*` gitignored; only blank `.env.example` tracked
- [ ] Backend libs `import "server-only"`; no secrets/service-role in `"use client"`
- [ ] All inquiry paths (form action, REST, MCP) share one Zod schema + one rate-limit bucket
- [ ] Body-size limit + honeypot + opaque success/failure on public write paths
- [ ] revalidate webhook authed (constant-time compare + tag allowlist)
- [ ] **`/md` + `/[slug]` + `/blog/[slug]` slug loaders contain the resolved path inside the content dir** (path-traversal guard) ← *currently missing*
- [ ] **JSON-LD injected with `<` escaped** (`JsonLd.tsx`) ← *currently missing*
- [ ] If a fork adds a DB/CMS: RLS gates public reads to published/active rows; public INSERT limited to the inquiry path (the default template ships no DB)
- [ ] Security headers present (HSTS, frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy, CSP)
- [ ] `next/image` remotePatterns tightly scoped (no wildcards)
- [ ] Rendered-MDX HTML sanitized before `dangerouslySetInnerHTML` (defense-in-depth; MDX stays trusted-author)

### C. SEO
- [ ] `metadataBase` set; title template + unique title/description per route
- [ ] Canonicals absolute on correct base; `lang` set
- [ ] OG image generated; favicon + apple-icon present
- [ ] **`twitter:image` falls back to `/opengraph-image` when no per-page image** ← *currently missing*
- [ ] Sitemap enumerates posts + indexable pages; **`/blog` policy decided** (always-list or noindex empty) ← *currently inconsistent*
- [ ] robots correct; RSS feed valid + escaped
- [ ] JSON-LD types present (LocalBusiness/Organization/WebSite/Person/Service/FAQPage/BlogPosting/BreadcrumbList) and match visible content
- [ ] Placeholder guards suppress JSON-LD/canonical when values are still `[bracketed]`
- [ ] OG image dimensions not hardcoded for arbitrary per-page images

### D. AEO / Agent-readiness
- [ ] `llms.txt` + `llms-full.txt` follow llmstxt.org and reflect real content
- [ ] `/md` returns clean markdown for every public route (not tag-stripped to one line)
- [ ] `.well-known/*` (agent.json, agents.json, agent-skills, api-catalog, mcp, security.txt) valid + mutually consistent
- [ ] OpenAPI ↔ MCP ↔ agent.json declare the same real capability; no phantom endpoints
- [ ] MCP server actually wired to a real tool/data path (not a stub)
- [ ] No unpublished/draft content exposed via any agent surface
- [ ] Brand/niche facts derive from config (not hardcoded "photography"/"Portrait Studio")

### E. Performance / Core Web Vitals
- [ ] Exactly one `priority` LCP image per viewport; **hero has a blur placeholder** ← *currently missing*
- [ ] Every `fill` image has a dimensioned parent (CLS-safe); accurate `sizes`
- [ ] Fonts via `next/font` (swap, subset); **font weight/style matrix trimmed to what's used**
- [ ] framer-motion via `LazyMotion` strict + `m.*`; below-fold sections `next/dynamic`
- [ ] Analytics prod-gated; MCP SDK + `marked` server-only (not in client bundle)
- [ ] **Above-the-fold section not gated behind scroll-reveal `opacity:0`** (esp. service/landing variants) ← *risk*
- [ ] Hero height uses `dvh` (not `vh`) for iOS

### F. Responsive / Mobile / Header / Footer
- [ ] **Global `overflow-x` guard on `html,body`** ← *currently missing*
- [ ] **No transient horizontal scroll from `translateX` reveals on collapsed (full-width) columns** ← *risk*
- [ ] Header: real toggle drawer, 44px targets, drawer can't clip last item; non-fixed nav doesn't cover anchors
- [ ] Footer: collapses to 1-col, email `break-all`, safe-area bottom padding
- [ ] **Persistent mobile CTA on long pages** (StickyInquirePill-style) ← *currently missing (own contract)*
- [ ] Fluid type scale (`clamp()`) on section headings, not hard breakpoint jumps
- [ ] `scroll-margin-top` on anchor targets vs sticky bar
- [ ] iOS `viewport-fit=cover` + `env(safe-area-inset-*)`

### G. Accessibility (WCAG 2.2 AA)
- [ ] One `<h1>` per page incl. error/not-found views; logical heading order; landmarks present
- [ ] **Mobile menu behaves as a dialog/disclosure: Escape closes + focus restores to trigger** ← *currently missing*
- [ ] Skip link visible on focus, lands on `<main>` in view
- [ ] Forms: real labels, `aria-describedby` errors, `role=status` success, **visible required affordance**
- [ ] **Dark surfaces use `--color-on-dark-*` (no `--color-muted` on `--color-ink`)** ← *currently fails*
- [ ] Low-opacity text on accent/photo passes AA (verify with axe + contrast checker)
- [ ] `prefers-reduced-motion` honored (MotionConfig + CSS + AnimateOnScroll)
- [ ] Decorative icons `aria-hidden` consistently (star ratings: pick one pattern)
- [ ] Buttons vs links semantically correct; closed-drawer links out of tab order
- [ ] Run `@axe-core/playwright` on a real build at 390/768/1440/1280 widths

### H. Code Health / Maintainability
- [ ] TS strict; no `any`/`@ts-ignore`/`!`-abuse; section props typed in `sections/types.ts`
- [ ] Client/server boundaries correct; error/not-found/loading boundaries present
- [ ] No swallowed errors, no stray `console.log`, no placeholder leaks in shipped code
- [ ] Barrels in sync; no dead exports (Input/Textarea currently unused); DRY shared helpers
- [ ] Structured, PII-safe logging
- [ ] Guardrail scripts present: `content-qa`, `route-smoke`, `verify-template`

### I. Reusability / Moldability (the 20-site question)
- [ ] **Every brand fact lives in `site.config` / `content.config`** (no `[Name]` in components) ← *currently 1 leak*
- [ ] Visuals re-skin from one token block; `og-colors` stays in sync (or auto-derived) ← *dual-source risk*
- [ ] Section library is data-driven (props default from config); variants over forks
- [ ] Tweaks panel production-safe (triple-guarded) and a real review accelerator
- [ ] Clean placeholder story (SVGs + bracket tokens) gated by launch QA
- [ ] Nav items configurable from `site.config`
- [ ] Clone-to-launch path documented; `verify-template` covers it

### J. Blog / Content System
- [ ] **Posts support draft + future-date gating** (parity with pages' `status`) ← *currently missing*
- [ ] **Frontmatter validated** (title/date/slug required; invalid `BlogPosting` dates blocked) ← *currently missing*
- [ ] Directory scan memoized; pagination (or capped index) for large migrations
- [ ] Related posts by tag/category (not first-N); per-post OG + JSON-LD
- [ ] Migration redirects wired (`{blog,page}-redirects.json` → `next.config redirects()`)
- [ ] Demo `_example.mdx` isolated; empty state intentional
- [ ] revalidate cache tags match what loaders actually read

### K. Conversion / Copy (CLAUDE.md non-negotiables)
- [ ] **ONE CTA verb sitewide** ← *currently mixed*
- [ ] **Persistent CTA on every long page — desktop AND mobile** ← *mobile missing*
- [ ] **Real per-page `sourcePage` captured by the form** ← *currently empty on homepage form*
- [ ] First viewport answers who/what/why/next
- [ ] Social proof near decision points; objections handled (FAQ/process/privacy)
- [ ] Thank-you path decided (inline vs `/thank-you` redirect for conversion pixel)
- [ ] No duplicate scarcity copy (UrgencyBlock vs BookingUrgencyCTA)

---

## This Sweep — Findings (council merge)

Severity reflects impact **across 20 forks**. File refs are
`templates/new-build/…`.

### 🔴 Fix Now — before cloning to any new client (fix once → propagates to 20)

1. **Restore the 3 conversion non-negotiables (CLAUDE.md) the base now violates.** *(High)*
   - **One CTA verb:** standardize on "Inquire" — base mixes *Inquire / Secure Your Spot / Work With Me / Get In Touch / Reach Out* (`MeetPhotographer.tsx:29`, `UrgencyBlock.tsx:22`).
   - **Persistent mobile CTA:** none exists on mobile (`StickyBar` is `relative md:sticky`; Navbar CTA is `hidden md:inline-flex`). Add a mobile sticky inquire pill (the `StickyInquirePill` pattern referenced in CLAUDE.md).
   - **Real `sourcePage`:** homepage `ContactForm` never renders the `sourcePage` hidden input the action reads (`submitInquiry.ts:51`), so every lead lands with empty source. Add `<input type="hidden" name="sourcePage">`.
2. **`/md` path traversal in slug loaders.** *(Medium security)* `lib/pages.ts:88` / `lib/posts.ts:71` interpolate the slug into `${slug}.mdx` and `join()` without containment; the `/md/[[...slug]]` catch-all (`app/md/[[...slug]]/route.ts`) has no `dynamicParams=false` gate. Add `resolve()`-startsWith check or reject `..`/slash segments.
3. **JSON-LD escaping.** *(Low, trivial, future-proofs CMS)* `components/seo/JsonLd.tsx:8` → `JSON.stringify(data).replace(/</g,"\\u003c")`.
4. **Photographer name escapes config.** *(High moldability)* `MeetPhotographer.tsx:25` defaults `name="[Name]"`, rendered with no override at `app/(site)/page.tsx:97`. Add `brand.photographer` to `SiteConfig`. This is the one brand fact that breaks the "edit one config" promise 20×.
5. **Mobile menu isn't an accessible dialog.** *(High a11y)* `Navbar.tsx` — no Escape-to-close, no focus restore. Add disclosure behavior (Escape + return focus). *(Backlog #13's dialog primitive is still open.)*
6. **Dark-on-dark contrast fails AA.** *(High a11y)* `--color-muted` on `--color-ink` in `Footer.tsx` (© + socials) and `BookingUrgencyCTA.tsx` body → switch to `--color-on-dark-secondary/-muted`. *(Backlog #14 is listed implemented but these instances remain.)*
7. **No global `overflow-x` guard + mobile `translateX` reveal overflow.** *(High responsive)* No `overflow-x:hidden` anywhere (`globals.css`); `AnimateOnScroll from="right/left"` shifts full-width collapsed columns +28px past the viewport (`SplitSection.tsx`, `AboutTeaser.tsx`). Add the guard and/or disable horizontal `from` below `md`.
8. **Blog has no draft/future-date gate or frontmatter validation.** *(High content)* `lib/posts.ts:58-63` publishes any non-`_` file immediately; future-dated posts jump to top of index/RSS/sitemap; missing `date` emits invalid `BlogPosting`. Add `status` + `date<=today` filter + Zod validation (pages already have `status`).
9. **Twitter cards have no image fallback.** *(Medium SEO)* `lib/seo.ts:48` — default `twitter.images` (and `openGraph.images`) to `[absoluteUrl("/opengraph-image")]`. Affects most pages on all sites.
10. **`/blog` empty-state policy.** *(Medium SEO)* `/blog` always renders (200) + is in nav, but `lib/public-routes.ts:94` omits it from sitemap/llms until a post exists. Pick one: always list, or `noindex`/hide-nav when empty.

### 🟠 Fix Before Scaling (next fork or two)
- **og-colors dual-source drift** (`lib/og-colors.ts`) — add a `content-qa` check or derive hex from one source so re-skins don't ship off-brand OG/favicon.
- **Perf polish:** hero `blurDataURL` (`Hero.tsx`); `--min-h-hero` `95vh`→`95dvh`; trim Playfair to used weights/styles (`layout.tsx:23`); don't scroll-reveal the first in-viewport section on service/landing variants.
- **Blog scaling:** memoize the directory scan (`React.cache`) + pagination; related-posts by tag (`lib/posts.ts`, `[slug]/page.tsx:77`).
- **revalidate tag mismatch:** webhook mints `posts` tag nothing reads (`app/api/revalidate/route.ts:26`) → false-success staleness for Supabase forks. Remove or document.
- **`/md` fidelity:** landing markdown is tag-stripped to one line (`lib/llms/page-markdown.ts:121`) — serve source MDX or HTML→markdown.
- **Niche hardcoded** in OG eyebrow + OpenAPI/MCP/agent descriptors ("Portrait Studio"/"photography session") — add `brand.category` (`opengraph-image.tsx:68`, `openapi.json/route.ts:23`, `.well-known/*`).
- **Typography:** move section headings to `clamp()` tokens in `@theme` (blog prose already does).
- **iOS:** `viewport-fit=cover` + `env(safe-area-inset-bottom)` on footer/CTA.
- **Anchors:** `scroll-margin-top` for in-page nav vs desktop sticky bar.
- **Forms:** visible required affordance in `ContactForm` + `Input`/`Textarea`; add optional `phone` field (schema/GHL already support it).
- **Thank-you orphaned** vs inline success — decide one (redirect enables a clean conversion-pixel fire).
- **Duplicate scarcity:** `UrgencyBlock` + `BookingUrgencyCTA` read the same `bookingCTA` — differentiate or drop one.
- **`Button` is `"use client"` for a 2% hover scale** — CSS `active:scale` removes a client boundary repeated 6+×/page.

### 🟡 Accept For Now (intentional / fine as a default)
- In-memory rate limiter (documented; ship a KV/Upstash adapter for high-traffic forks).
- CSP `unsafe-inline` (reasoned tradeoff for a static marketing site).
- `site_config` public-read RLS (by design; don't put secrets in its JSONB columns).
- Regex HTML sanitizer as defense-in-depth (MDX is trusted-author-only — document it).
- `.mdx` = sanitized Markdown via `marked`, not true MDX/embeds (document; whitelist iframes if embeds needed).
- Tweaks panel ships empty (opt-in by design).
- Placeholder SVGs + `[bracket]` tokens (intentional; gated by `content:qa:launch`).
- Homepage assembled as hand-written JSX (helps LCP/code-split; a config-driven section registry is optional, not required).

### 🔵 Monitor / Cleanup
- Sitemap `lastModified` defaults to build-time `now` for home/blog/landing → churns `lastmod` each deploy.
- robots `Disallow: /md/` (trailing slash) doesn't cover bare `/md` (header backstops it).
- Per-image IntersectionObservers on large galleries (`GalleryGrid.tsx`) — INP on image-heavy sites.
- Dead exports: `Input`/`Textarea` unused; `isInternalRoute()` duplicated (`Footer.tsx:8`, `Button.tsx:53`).
- Dockerfile stale `COPY … /app/build` (Next emits `.next`) — leftover from a prior setup.

### 🟢 Already Strong — keep (independently confirmed this sweep)
- **All 4 gates green**; clean static-first architecture (home `○`, blog/`[slug]` `●`).
- **Single source of truth is real:** brand/SEO/AEO derive from `siteConfig`+`content.config` at request time — edit ~2 files + env and metadata, JSON-LD, `llms.txt`, `/md`, OpenAPI, MCP, OG image, icons, security.txt all re-derive.
- **AEO is not decorative:** MCP `submit_inquiry` is wired to GHL through the same Zod schema + rate-limit + sanitizer as REST/form; `.well-known` descriptors are mutually consistent with OpenAPI; no phantom endpoints; no draft leakage.
- **Placeholder guards** (`isRealPublicValue`, icon bracket-stripping) → half-configured forks degrade gracefully instead of emitting broken rich results.
- **Security posture above template norm:** strong headers, opaque inquiry contract, honeypot + shared rate-limit bucket, constant-time revalidate auth, scoped RLS, GHL with no SSRF and no PII in logs.
- **Perf discipline:** LazyMotion strict, per-section dynamic import, single priority hero, prod-gated analytics, AVIF/WebP, MCP SDK server-only.
- **Launch gate:** `content:qa:launch` blocks placeholder/unproofed claims; proof-map discipline; `verify-template` chains qa→typecheck→lint→build→audit.

---

## Verification evidence (this run)
- `npm install` → exit 0 (clean)
- `npm run typecheck` → **exit 0**
- `npm run lint` (`--max-warnings 0`) → **exit 0**
- `npm audit --audit-level=high` → **found 0 vulnerabilities**
- `npm run build` → **exit 0**, "✓ Compiled successfully"; home `/` `○ Static` 13.5 kB / 137 kB First Load; shared 102 kB; blog + `[slug]` `● SSG`; AEO routes prerendered with 1h/1d revalidate + 1y expire.
- Static analysis only for rendered-page claims (contrast ratios, horizontal-scroll, focus behavior) — flagged `[NEEDS-RENDER]`/`[NEEDS-AXE]`; confirm with a dev server + `@axe-core/playwright` at 390/768/1440/1280.

## Suggested next step
Land the 🔴 Fix Now batch in this worktree as the "v2 base," re-run `npm run verify`,
then cut the 20 forks from the hardened base. Most Fix-Now items are single-file,
low-risk, and several just re-satisfy `CLAUDE.md`'s own conversion contract.
