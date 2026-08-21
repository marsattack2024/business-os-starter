# New-Build Template Hardening Backlog

Created: 2026-06-06
Source: Molly Seattle site sweep plus four read-only subagent audits of
`templates/new-build` covering SEO/AEO, forms/security, UX/performance, and
content/repeatability.
Status: implemented in the template hardening pass. Keep this file as the
source map for why these primitives exist; use `template-restart-checklist.md`,
`npm run verify`, `npm run content:qa:launch`, and `npm run smoke:routes` for
current operating checks.

> **2026-06-08 follow-up pass** — a fresh 8-agent grade sweep
> (`tasks/2026-06-08-template-grade-sweep.md`) found a handful of items listed
> here as "implemented" that had only partially landed, plus new gaps. That pass
> CLOSED: #12 (Button now CSS-only, no client boundary; `Input`/`Textarea`
> required affordance), #13 (Navbar mobile menu now Escape-closes + restores
> focus), #14 (dark-on-dark `--color-muted` → `--color-on-dark-*` in Footer +
> BookingUrgencyCTA), #15 (hero now `dvh`). It also added: `/md` path-traversal
> guards, JSON-LD `<`-escaping, blog `status`/draft + future-date gating + build
> frontmatter validation, a persistent mobile CTA (`StickyInquirePill`), real
> per-page `sourcePage` capture, niche-driven (`brand.category`) agent
> descriptors + OG eyebrow, `/md` source-Markdown fidelity, `twitter:image`
> fallback, empty-`/blog` consistency, global `overflow-x: clip`, and iOS
> safe-area handling. See the grade sweep for the full tally + current grades.

This file is the implementation backlog for making the photography website
template easier to duplicate across many client builds without losing SEO, AEO,
conversion, accessibility, or launch reliability. Keep client-specific style and
copy unique. Share boring primitives, validation, route inventories, schema,
forms, and launch checks.

## Working Rule

Do not promote a Molly-specific visual treatment into the template unless it is
made configurable, accessible, responsive, and optional. The template should
share infrastructure and quality gates first; visual composition stays mostly
per site.

## P0 - Fix Before More Forks

### 1. Single Public Route Inventory

Problem: public route lists are split across sitemap, llms, markdown, robots,
nav, and docs. They already drift.

Implement:

- Add a shared route inventory, for example `lib/public-routes.ts`.
- Generate or consume that inventory from:
  - `app/sitemap.ts`
  - `lib/llms/content.ts`
  - `lib/llms/page-markdown.ts`
  - `app/md/[[...slug]]/route.ts`
  - `components/layout/Navbar.tsx`
  - `app/robots.txt/route.ts`
- Include homepage, blog index only when posts exist, blog posts, migrated
  content pages, legal pages when present, and intentional noindex routes.
- Stop advertising routes that do not exist.
- Add a lightweight check that sitemap URLs, llms URLs, and `/md` registrations
  agree or intentionally document exceptions.

Files to start:

- `templates/new-build/app/sitemap.ts`
- `templates/new-build/lib/llms/content.ts`
- `templates/new-build/lib/llms/page-markdown.ts`
- `templates/new-build/app/md/[[...slug]]/route.ts`
- `templates/new-build/components/layout/Navbar.tsx`

### 2. Legal Route Policy

Problem: the default footer links to `/privacy` and `/terms`, but matching pages
do not ship. Molly showed placeholder legal pages are launch blockers if indexed
or linked.

Implement one policy:

- Preferred: omit legal footer links until approved legal copy exists.
- Alternate: ship starter `privacy-policy` and `terms-and-conditions` pages as
  noindex until client-approved.
- Add launch checks for broken footer links and placeholder legal language.
- Align sitemap and robots/noindex behavior with the selected policy.

Files to start:

- `templates/new-build/lib/site.config.tsx`
- `templates/new-build/components/layout/Footer.tsx`
- `templates/new-build/app/sitemap.ts`
- `templates/new-build/tasks/template-restart-checklist.md`

### 3. Migration Publication Gate

Problem: any non-underscore MDX page can become indexable by accident.

Implement:

- Add frontmatter or manifest status:
  - `draft`
  - `indexable`
  - `noindex`
  - `redirect`
  - `retired`
- Require every migrated page to have a status before launch.
- Generate sitemap only from `indexable` pages.
- Generate redirects from explicit redirect decisions.
- Keep `_example.mdx` ignored by production loaders.

Files to start:

- `templates/new-build/lib/pages.ts`
- `templates/new-build/content/pages/_example.mdx`
- `templates/new-build/lib/page-redirects.json`
- `templates/new-build/app/sitemap.ts`

### 4. Opaque Inquiry API Contract

Problem fixed: public REST and MCP surfaces previously exposed CRM contact IDs
or upstream CRM state. Public success/failure is now opaque; the private GHL
adapter may still use a CRM contact ID internally to add notes.

Implement:

- Return `{ "ok": true }` on public success.
- Do not return `contactId` in REST, MCP, OpenAPI, or README examples.
- Make honeypot success indistinguishable from normal public success.
- Make CRM/integration failures opaque to public callers.
- Keep upstream details server-side only.
- Add a REST/OpenAPI/MCP contract smoke that fails if `contactId` is public.

Files to start:

- `templates/new-build/app/api/v1/inquiry/route.ts`
- `templates/new-build/app/api/mcp/route.ts`
- `templates/new-build/app/api/openapi.json/route.ts`
- `templates/new-build/README.md`

### 5. Form Rate Limit Order

Problem: the server action checks honeypot before rate limiting, so bot fills
can bypass the shared form/API bucket.

Implement:

- Resolve IP and run `rateLimit("inquiry:<ip>")` before honeypot handling.
- Keep the same namespace across form, REST, and MCP.
- Preserve silent honeypot success after the bucket is counted.

Files to start:

- `templates/new-build/app/actions/submitInquiry.ts`
- `templates/new-build/lib/rate-limit.ts`

### 6. Attribution Sanitization And Caps

Problem: URL params, cookies, hidden fields, and JSON attribution can carry long
or polluted values into the CRM.

Implement:

- Sanitize attribution values at capture and extraction boundaries.
- Strip control characters, template/script-looking syntax, and markup.
- Collapse whitespace.
- Cap values to a conservative max length.
- Apply the same helper to URL capture, cookies, `FormData`, and JSON.

Files to start:

- `templates/new-build/lib/contact-attribution.ts`
- `templates/new-build/lib/sanitize.ts`

### 7. Placeholder And Unsupported-Fact Schema Gating

Problem: homepage schema can emit `[Studio Name]`, `[City]`, `[ST]`, dummy phone
numbers, placeholder image facts, and generic proof.

Implement:

- Add helpers that detect placeholder values and omit or fail launch checks.
- Gate `LocalBusiness`, `FAQPage`, `Organization`, `WebSite`, `BlogPosting`,
  and offer schema on real facts.
- Do not emit `SearchAction` unless the site has real on-site search.
- Do not use `/opengraph-image` as an article publisher logo unless a valid
  square logo exists.

Files to start:

- `templates/new-build/lib/schema.ts`
- `templates/new-build/lib/site.config.tsx`
- `templates/new-build/app/(site)/page.tsx`
- `sites/WEBSITE-QUALITY-CHECKLIST.md`

### 8. Content QA Script

Problem: repeated launches need fast checks before full build or visual QA.

Implement `npm run content:qa` with a reusable scanner for:

- `[Client Name]`, `[Studio Name]`, `[City]`, `[ST]`
- `/placeholder/*` references in launch builds
- stale source domains and tracking URLs
- `awstrack`, `#block-`, Showit/Squarespace/Wix residue
- expired promos, stale years, stale session counts, stale limited spots
- unverifiable `#1`, `best`, awards, guarantees, and review-count claims
- placeholder legal copy
- broken internal links and anchors
- missing local assets referenced by config or MDX

Files to start:

- `templates/new-build/package.json`
- `templates/new-build/scripts/content-qa.mjs` or equivalent
- `templates/new-build/tasks/template-restart-checklist.md`

## P1 - Shared Quality Improvements

### 9. Proof Claim Source Map

Problem: default proof blocks and testimonials can look real without source
support.

Implement:

- Add a `proof-map` format for every claim:
  - claim
  - rendered location
  - source file or review URL
  - approval status
  - fallback copy if unsupported
- Require proof mapping for counts, awards, years in business, review ratings,
  "featured" claims, guarantees, and testimonials.
- Add the proof map to the launch handoff.

Files to start:

- `templates/new-build/lib/content.config.ts`
- `templates/new-build/tasks/template-restart-checklist.md`

### 10. Markdown Sanitizer

Problem: MDX/Markdown output uses `dangerouslySetInnerHTML`; CRM text sanitizer
does not cover rendered HTML.

Implement:

- Add an allowlist sanitizer for rendered Markdown HTML.
- Keep headings, paragraphs, links, lists, emphasis, blockquotes, and images.
- Strip scripts, event handlers, iframes, unsafe URLs, and style attributes.
- Use the same sanitizer for pages and blog posts.

Files to start:

- `templates/new-build/lib/mdx.ts`
- `templates/new-build/lib/sanitize.ts`

### 11. MDX Image Standard

Problem: component imagery uses `next/image`, but Markdown images currently
render as raw `img`.

Implement:

- Either convert MDX image tokens to a shared image component or add a strict
  migration rule that requires width, height, alt, and local asset existence.
- Prefer `next/image` for local public assets.
- Preserve stable dimensions to avoid layout shift.

Files to start:

- `templates/new-build/lib/mdx.ts`
- `templates/new-build/app/(site)/[slug]/page.tsx`
- `templates/new-build/app/(site)/blog/[slug]/page.tsx`

### 12. UI Primitive Focus And Semantics

Problem: shared components still have focus/semantic edge cases.

Implement:

- Remove `display: contents` from focusable links in `Button`.
- Add visible `focus-visible` rings to buttons, links, inputs, and textareas.
- Add explicit `type="button"` to non-submit controls.
- Make carousel dots and small controls 44px touch targets.
- Keep closed mobile nav controls out of tab order.

Files to start:

- `templates/new-build/components/ui/Button.tsx`
- `templates/new-build/components/ui/Input.tsx`
- `templates/new-build/components/ui/Textarea.tsx`
- `templates/new-build/components/sections/ContactForm.tsx`
- `templates/new-build/components/sections/TestimonialsCarousel.tsx`
- `templates/new-build/components/sections/TestimonialCards.tsx`
- `templates/new-build/components/sections/FAQSection.tsx`

### 13. Reduced Motion And Optional Overlay Primitive

Problem: base motion config is good, but reveal wrappers and future overlays
need stronger defaults.

Implement:

- Make `AnimateOnScroll` render visible immediately when reduced motion is
  preferred.
- Build a reusable dialog/floating-panel primitive before promoting Molly-style
  overlays, intro modals, or sticky CTA panels.
- Include focus trap, Escape close, focus restore, `aria-modal`, and hidden
  focus safety.

Files to start:

- `templates/new-build/components/ui/AnimateOnScroll.tsx`
- `templates/new-build/components/ui/TweaksPanel.tsx`
- `templates/new-build/app/globals.css`

### 14. Dark-Surface Contrast Tokens

Problem: some dark sections still reuse muted tokens intended for light
backgrounds.

Implement:

- Standardize dark sections on `--color-on-dark-*`.
- Run contrast checks for footer links, legal links, labels, buttons, and
  testimonial/meta copy.

Files to start:

- `templates/new-build/components/layout/Footer.tsx`
- `templates/new-build/components/sections/TestimonialsCarousel.tsx`
- `templates/new-build/components/sections/BookingUrgencyCTA.tsx`
- `templates/new-build/app/globals.css`

### 15. Hero Fit Controls

Problem: hero crop/text fit is hardcoded, so forks patch component internals.

Implement:

- Add configurable desktop/mobile image object-position.
- Add safe long-headline behavior.
- Keep one real priority hero image.
- Document image strength, focal area, and mobile crop decisions in the restart
  checklist.

Files to start:

- `templates/new-build/lib/site.config.tsx`
- `templates/new-build/components/sections/Hero.tsx`
- `templates/new-build/components/sections/HeroOverlay.tsx`
- `templates/new-build/README.md`

### 16. Dependency And Header Policy

Problem: checks are ad hoc and one easy header hardening flag is missing.

Implement:

- Add `poweredByHeader: false` to `next.config.ts`.
- Add a dependency audit script that gates high/critical vulnerabilities.
- Document moderate framework-chain advisories as monitored unless a safe
  forward upgrade exists.

Files to start:

- `templates/new-build/next.config.ts`
- `templates/new-build/package.json`
- `templates/new-build/README.md`

## P2 - Cleanup And Drift Reduction

### 17. Robots Implementation Cleanup

Problem fixed: the old duplicate robots implementation was removed. The route
handler is now the source of truth because it can emit Content-Signal output.

Implement:

- Keep one source of truth for `/robots.txt`.
- Prefer the route handler if Content-Signal output is required.
- Ensure `/thank-you`, `/md`, `/api`, and `/_next` policy is intentional.
- Do not disallow `/_next`; crawlers need assets to render pages.

Files to start:

- `templates/new-build/app/robots.txt/route.ts`
- `templates/new-build/CLAUDE.md`

### 18. Agent Discovery Accuracy

Problem fixed: discovery docs now advertise explicit `/md` routes while the
template intentionally avoids middleware.

Implement:

- Correct `agent.json` and related docs to advertise explicit markdown routes.
- Consider adding all discovery surfaces to the Link header or API catalog:
  `agent.json`, `agents.json`, `agent-skills`, MCP server card, OpenAPI, llms.
- Add smoke tests for well-known endpoint status and core fields.

Files to start:

- `templates/new-build/next.config.ts`
- `templates/new-build/app/.well-known/agent.json/route.ts`
- `templates/new-build/app/.well-known/agents.json/route.ts`
- `templates/new-build/app/.well-known/agent-skills/index.json/route.ts`
- `templates/new-build/app/.well-known/api-catalog/route.ts`

### 19. Template Fork Hygiene

Problem: internal Agency OS docs currently live inside the template and may be
copied into every client fork.

Implement:

- Move internal copy bibles and Agency OS plans out of the client template, or
  update `scripts/create-client-site.mjs` to exclude them.
- Keep only client-site-relevant docs in forks.
- Keep reusable standards in `tasks/`, `README.md`, `CLAUDE.md`, or shared
  Agency OS docs.

Files to start:

- `templates/new-build/docs/P2P Copy Bible.md`
- `templates/new-build/docs/plans/`
- `scripts/create-client-site.mjs`

### 20. README And Checklist Drift

Problem: docs mention routes/components that no longer match the current
template.

Implement:

- Fix README route/file map against actual code.
- Remove missing component references.
- Update the restart checklist with proof map, legal policy, route inventory,
  content QA, and asset QA.
- Consider a docs drift check generated from `find app components lib`.

Files to start:

- `templates/new-build/README.md`
- `templates/new-build/tasks/template-restart-checklist.md`

## Keep Shared

- Route inventory and route parity checks
- Sitemap, robots, llms, markdown, OpenAPI, MCP, and well-known generators
- SEO metadata helpers and schema builders
- Inquiry validation, rate limiting, attribution capture, GHL adapter contract
- Markdown sanitizer and content loaders
- Content QA, asset QA, redirect QA, link/anchor QA
- Accessible UI primitives: button, input, textarea, dialog/floating panel
- Launch checklist and handoff formats
- Static-first blog/content conventions

## Keep Per Site

- Brand facts, location, contact details, canonical domain
- Legal copy and approval status
- Proof claims, review sources, testimonials, awards
- Images, alt text, focal points, gallery curation
- Offers, pricing, scarcity, session counts, seasonal language
- Page composition and visual section order
- Social links, analytics IDs, CRM/provider env
- Old URL redirect decisions and migration status decisions

## Verification Bundle For This Backlog

When implementing items from this backlog, run the smallest useful check first,
then a full template check before handoff:

```bash
cd templates/new-build
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

After a local server is running, smoke:

```bash
for path in / /llms.txt /llms-full.txt /robots.txt /sitemap.xml \
  /api/openapi.json /.well-known/agent.json /.well-known/agents.json \
  /.well-known/mcp/server-card.json /.well-known/api-catalog /md; do
  curl -s -o /dev/null -w "%{http_code}  %{content_type}  $path\n" \
    "http://localhost:3000$path"
done
```

Add `npm run content:qa` once the scanner exists. It should be fast enough to
run during ordinary client content work without turning docs/copy edits into a
heavy engineering workflow.
