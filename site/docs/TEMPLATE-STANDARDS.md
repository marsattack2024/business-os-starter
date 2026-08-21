# Template Standards — the non-negotiable rules for every site

This is the **standing rubric** for `templates/new-build` and every client fork
(Grateful, Goddess, and the rest). It turns the 2026-06-08 grade sweep into
specific, enforceable rules so we stop re-introducing the same mistakes.

**How to use:**
- Building or restyling a site → follow the ✅ patterns below; never ship a ❌.
- Auditing a site → grade against the checklist in
  `templates/new-build/tasks/2026-06-08-template-grade-sweep.md` ("Grading Rubric" section).
- Before any PR → the **PR gate** at the bottom must be green.
- Per-fork launch steps live in `templates/new-build/tasks/template-restart-checklist.md`.

> Rule of thumb: this template is cloned ~20×, so **every flaw multiplies 20×**.
> Fix it once here, in a shared primitive/config, never per-page.

---

## 1. Single source of truth (moldability)

- ✅ Every brand fact lives in `lib/site.config.tsx` (`brand.*`, `seo.*`,
  `socials`, `hero`, `bookingCTA`, `announcement`, `images`) or
  `lib/content.config.ts`. A new client = edit those two files + swap images + set env.
- ✅ Niche/category text comes from `brand.category`; photographer name from
  `brand.photographer` (falls back to `brand.name`); price band from `brand.priceRange`.
- ❌ **Never hardcode a brand/niche fact in a component, route, or descriptor.**
  (Past misses: `[Name]` in MeetPhotographer, "Portrait Studio"/"photography
  session" in OG + agent descriptors.) **Auto-enforced by `npm run content:qa`** (scanStandards). Manual check: `grep -rn "Portrait Studio\|photography session\|\[Name\]" app components` is empty — the niche *default* legitimately lives in `lib/site.config.tsx` (excluded from the scan).
- ✅ Re-skin = the six `--primitive-*` values in `app/globals.css` **and**
  `lib/og-colors.ts` (keep them in sync — OG card/favicon read the hex copy).
- ✅ The template ships an **unset achromatic scaffold** (not cream+gold brand).
  Before launch, pick a named pack from `lib/themes/` (`warm-atelier`,
  `cool-gallery`, `ink-paper`) or measured client tokens — and a composition
  north star (Molly / live site / Reference Room lesson). Shipping the unset
  scaffold as a finished brand is a launch defect.
- ❌ Do not treat Playfair + warm cream + gold accent as the agency default look;
  that lane lives only as the optional `warm-atelier` pack.

## 2. Security

- ✅ Any file read from a user-controlled slug goes through a containment guard:
  `resolve(base, slug + ".mdx")` then `startsWith(base + sep)` (see
  `lib/pages.ts` / `lib/posts.ts`). Reject `_`-prefixed and null-byte slugs.
- ✅ JSON-LD is injected via `components/seo/JsonLd.tsx` only (it `<`-escapes).
  Never `JSON.stringify` into a `<script>` by hand.
- ✅ All inquiry write paths (browser form action, REST `/api/v1/inquiry`, MCP
  `/api/mcp`) share one Zod schema (`lib/validators.ts`) + one rate-limit
  namespace (`inquiry:<ip>`) + the sanitizer (`lib/sanitize.ts`). Add new fields
  to the schema, not ad hoc.
- ✅ Public forms and quizzes use the same spam posture: rate-limit before
  honeypot, silent honeypot success, bounded body size for JSON routes, opaque
  public errors, and no Turnstile/CAPTCHA unless real spam volume proves the
  added friction is worth it.
- ✅ Every validated lead path (browser form, REST inquiry/quiz, MCP) calls
  `lib/submissions-log.ts` with the actual CRM delivery result. Missing GHL
  tokens should record `synced:false` while the Agency OS backup/email still
  receives the lead; never infer `synced:true` from env existence alone. Public
  lead paths should return success when Agency OS backup or CRM/webhook delivery
  accepts the lead.
- ✅ Public API success/failure stays opaque (`{ ok: true }`); never return CRM ids.
- ✅ MDX is **trusted-author only**. If a fork ever renders untrusted markdown,
  add a real sanitizer (rehype-sanitize/DOMPurify) — the regex one is defense-in-depth.
- ✅ Keep the security headers + strict `next/image remotePatterns` in `next.config.ts`.

## 3. SEO

- ✅ Per-route metadata via `lib/seo.ts` (`buildPageMetadata`/`buildArticleMetadata`).
  `metadataBase` set; canonicals absolute; **both** `openGraph.images` and
  `twitter.images` always emit. Cascade: per-page `image` →
  `siteConfig.seo.defaultOgImage` (Facebook-safe real photo, required before
  launch) → `/opengraph-image` typographic card (fallback only). Never ship a
  logo or blurred wordmark as the primary share image.
  Do **not** omit OG images hoping Next file metadata will merge — prerendered
  pages have shipped live HTML without `og:image` that way.
- ✅ Preferred host (`www` vs apex) is the live redirect target; set
  `NEXT_PUBLIC_SITE_URL` / `siteConfig.seo.baseUrl` to that host (env overrides
  code defaults on Vercel).
- ✅ JSON-LD from `lib/schema.ts` only; placeholder-guarded (`isRealPublicValue`)
  so a half-configured fork emits nothing broken. `Person.worksFor` must use
  `@id: ${base}#org`. Homepage process sections may emit `buildHowToSchema`.
- ✅ Sitemap omits `lastModified` for dateless routes (no `now` churn); posts use their date.
- ✅ Empty `/blog` is `noindex` and hidden from nav/sitemap/llms until ≥1 published post.
- ❌ Don't add a JSON-LD `SearchAction` (no on-site search) or an Organization
  `logo` until a real square asset exists.
- ✅ **Absolute / canonical URLs** come from `lib/site-url.ts` (`absoluteUrl`,
  `getCanonicalBaseUrl`) — never re-derive the base URL inline. All JSON-LD
  `url` and `image` fields use `absoluteUrl()` because `metadataBase` does NOT
  apply to hand-built JSON-LD. `components/seo/JsonLd.tsx` accepts `null` and
  renders nothing, so a half-configured fork emits no broken schema.

## 4. AEO / agent-readiness

**This whole stack SHIPS BY DEFAULT in every fork. Verify what exists before you
build — do NOT rebuild it.** (Agents have repeatedly "discovered" and nearly
re-created the REST API + `.well-known` surfaces that were already here.) This is
the canonical inventory; `CLAUDE.md` → "Agent readiness", the `build-page` and
`manage-seo` skills point here.

- ✅ **REST API** — `POST /api/v1/inquiry` (`app/api/v1/inquiry/route.ts`):
  public, rate-limited, honeypot, Zod-validated, CORS + `OPTIONS`, GHL upsert,
  and source-agent context in the GHL source/submissions log. Its contract is
  `/api/openapi.json` — **keep that spec in sync with `lib/validators.ts`
  `InquirySchema`** (a contact-form field trim once
  left openapi advertising removed fields as required).
- ✅ **Markdown content negotiation** — `proxy.ts`: an `Accept: text/markdown`
  request gets the page's `/md` view **at the same URL**; browsers (`text/html`)
  get HTML. Needs `Vary: Accept, RSC, Next-Router-State-Tree,
  Next-Router-Prefetch, Next-Router-Segment-Prefetch` in `next.config.ts`
  `securityHeaders` (Accept alone can be dropped when Next merges Vary on App
  Router responses) or Vercel's edge cache serves whichever variant cached first.
  This is the ONE sanctioned middleware (see `CLAUDE.md`) — don't delete it.
- ✅ `/md` serves the **source Markdown body** (`page.body`/`post.body`), never
  tag-stripped HTML; `noindex` + robots-blocked (`/md/`, `/md$`). New page → add a
  builder in `lib/llms/page-markdown.ts` + register it in the md route `PAGE_MARKDOWN`.
- ✅ **Discovery surfaces** (all present, all derive niche text from `brand.category`,
  all must stay mutually consistent + reference only wired capabilities like
  `submit_inquiry`): `/.well-known/{api-catalog,agent.json,agents.json,agent-skills/index.json,mcp/server-card.json,ai-catalog.json}`,
  `/auth.md`, `/api/openapi.json`, RFC 8288 `Link` headers (`next.config.ts`
  `LINK_HEADER`), `llms.txt` / `llms-full.txt`, `robots.txt` (Content-Signals +
  per-bot rules + ARD `Agentmap:`), `sitemap.xml`, `/opengraph-image`, JSON-LD
  (`lib/schema.ts`), WebMCP (`components/seo/WebMcp.tsx`).
- ✅ **ARD capability manifest** — `/.well-known/ai-catalog.json`: the discovery
  layer in FRONT of the protocols above, so one fetch tells an agent the site has
  an MCP server, an inquiry API, and an llms.txt corpus. Entries carry
  `urn:air:<domain>:<namespace>:<name>` ids and 2-5 `representativeQueries` for
  registry embeddings. Advertised three ways per ARD §6.1: the well-known URI, the
  `Link` header, and `Agentmap:` in robots.txt. We publish NO host `identifier`
  (`did:web:` has to resolve at `/.well-known/did.json`, which we do not serve) and
  NO `trustManifest` — an unverifiable trust claim is worse than none.
  Schema: `ards-project/ard-spec` → `spec/schemas/ai-catalog.schema.json`.
- ✅ **WebMCP registration lives in `lib/webmcp.ts`, never in the component.**
  The spec moved twice (`provideContext({tools})` → per-tool `registerTool(tool,
  {signal})`, and `navigator.modelContext` → `document.modelContext`), and because
  every fork carried its own copy of the call, all of them silently stopped
  registering at once. `components/seo/WebMcp.tsx` declares tools;
  `registerModelContextTools()` owns the API surface and feature-detects both
  locations and both shapes. `scripts/agent-readiness-parity.test.mjs` fails any
  fork that hand-rolls it again.
- ❌ **Never publish phantom endpoints, OAuth/OIDC discovery,
  `oauth-protected-resource`, or HTTP-message-signature directories that aren't
  backed by real auth infrastructure.** A public brochure's only API is the public
  inquiry form — those well-knowns are correctly **404**, and `/auth.md` states the
  public reality. Faking them to pass a scanner is invalid/misleading. They apply
  ONLY if a client adds a protected/authenticated API (then publish the real
  metadata). A literal isitagentready 100/100 is NOT honestly reachable for a
  no-auth brochure; do not chase it by inventing.
- 🔜 **DNS-AID** is the one remaining check, and it can't be satisfied on a
  `*.vercel.app` host (Vercel owns that DNS zone). It needs SVCB/HTTPS records +
  DNSSEC on the client's own domain — a **custom-domain cutover** task. Records +
  steps: `docs/dns-aid-cutover.md`.
- ✅ **Parity is enforced, not remembered** — `scripts/agent-readiness-parity.test.mjs`
  (in root `validate`) derives every rule from what a fork actually serves: the
  `Link` header must advertise exactly the surfaces on disk, `agent.json` may claim
  markdown negotiation only where `proxy.ts` exists, and any fork shipping the
  public inquiry API must carry the full stack. Forks predating a capability used
  to keep passing because each one asserted the route list that existed when it was
  forked.
- ✅ Draft/unpublished content must never appear in sitemap/llms/`/md` (loaders gate first).

## 5. Responsive / mobile

- ✅ `html, body { overflow-x: clip }` stays (template-wide horizontal-scroll
  guard; `clip` not `hidden`, to preserve sticky).
- ✅ Full-viewport hero uses `dvh` (`--min-h-hero: 95dvh`), matched by the
  `loading.tsx` skeleton.
- ✅ Headlines use fluid `clamp()` (see Hero H1), not hard `text-4xl md:text-5xl` steps.
- ✅ **Body + list copy uses the semantic `text-body` token** (fluid ~17→19px, in
  `app/globals.css` `@theme`), section intros use `text-lead`, eyebrows
  `text-eyebrow`. ❌ **Never size body/list copy with ad-hoc `text-sm`/`text-xs`
  per component** — that produced the tiny, section-to-section-inconsistent body
  we had to fix sitewide. `text-sm`/`text-xs` stay ONLY for meta (author names,
  attributions, captions, price notes, fine print). See §11.
- ✅ `viewport-fit=cover` (root `viewport` export) + `env(safe-area-inset-*)` on
  bottom-pinned UI (footer, sticky CTA).
- ✅ Touch targets ≥ 44px. Test at **390 / 768 / 1440 / 1280** before PR.

## 6. Accessibility (WCAG 2.2 AA)

- ✅ One `<h1>` per page **including** `error.tsx` / `global-error.tsx` / `not-found.tsx`.
- ✅ Mobile menu: Escape closes + restores focus to the trigger; closed-drawer
  links `tabIndex={-1}` + `aria-hidden`.
- ✅ Forms use the `Input`/`Textarea` primitives (required asterisk +
  `aria-describedby`/`aria-invalid` error association built in). Don't hand-roll labelled inputs.
- ✅ Dark surfaces use `--color-on-dark-*` text tokens — **never `--color-muted`
  on `--color-ink`** (that's a light-bg token; it fails AA on dark).
- ✅ Decorative icons (stars, +, hamburger bars) are `aria-hidden` or carry a
  `role="img"`+label. `prefers-reduced-motion` honored (MotionConfig + CSS).

## 7. Performance / CWV

- ✅ Exactly one `priority` image per viewport (the hero). Below-fold sections
  are `next/dynamic`. `LazyMotion strict` + `m.*` only.
- ✅ Interactive-but-static UI (Button) stays server-renderable — micro-interactions
  are CSS (`hover:scale`/`active:scale`), not framer client boundaries.
- ✅ Filesystem loaders (`getAllPosts`/`getAllPages`) are `React.cache`-wrapped.
- ✅ MCP SDK + `marked` stay server-only; analytics gated to `VERCEL_ENV === "production"`.

## 8. Blog / content

- ✅ Posts need `title`, `slug`, `date` (YYYY-MM-DD) or the build fails
  (`assertValidPublished`). `status: draft` stages; a future `date` schedules.
- ✅ `.mdx` here = sanitized Markdown via `marked` (no JSX/embeds). Document this
  to authors; whitelist iframe domains in the sanitizer only if a fork needs embeds.
- ✅ Migrated pages: set frontmatter `status` (`indexable`/`noindex`/`redirect`/
  `retired`); fill `lib/{blog,page}-redirects.json`.
- ✅ Public copy uses natural punctuation and contains no em dash character or
  HTML/numeric em-dash entity. `npm run content:qa` enforces this across
  routes, components, public content, config, and agent-readable copy.
- ✅ **Per-client prohibited claims:** `prohibitedClaims` in `lib/content.config.ts`
  is the hard "never claim X" wall for one studio, and ships **empty** in the
  template. Each entry declares `phrase`, `reason`, and `scope`; `npm run content:qa`
  (scanProhibitedClaims) fails with the reason when the phrase appears in rendered
  copy under `app/`, `components/`, `lib/`, `content/pages`, or `content/blog`.
  Matching is a case-insensitive substring with whitespace collapsed, so declare
  each punctuation variant separately ("hair and makeup" AND "hair & makeup").
  `scope: "all"` covers every surface and suits fabrication-class bans; `scope: "site"`
  exempts `content/blog` only, for a service claim whose subject the client's
  historical articles may legitimately discuss. Origin: a client asked for a blocker
  rather than a note after her site claimed hair and makeup came with the session,
  while her headshot-prep posts advise readers on their own hair and makeup and stay
  verbatim.
- ✅ Human writing is a source-specific editorial standard, not a word blacklist.
  Prefer concrete client facts, varied sentence rhythm, and direct language.
  During review, recast canned contrast formulas, repeated three-item cadences,
  vague transformation claims, and generic luxury filler. The deterministic
  gate catches punctuation; a read-aloud editorial pass catches voice.

## 9. Conversion (the three non-negotiables — these were violated before; never again)

- ✅ **ONE CTA verb sitewide:** "Inquire" / "Inquire Today" (form submit may read
  "Send Inquiry"). All section CTA defaults use it. **Auto-enforced by
  `npm run content:qa`** (scanStandards rejects "Work With Me" / "Secure Your Spot" /
  "View Full Gallery" / "Get In Touch" in section/layout CTAs + content.config).
- ✅ **Persistent CTA on every long page:** the mobile `StickyInquirePill` +
  repeated in-page section CTAs + footer. (The nav header is NOT sticky — see
  §11 — so desktop persistence comes from in-page CTAs, not a pinned nav.)
- ✅ **Real per-page `sourcePage`:** `ContactForm` posts `usePathname()`; never hardcode `/`.
- ✅ **Routing contract for every visible link:** real internal routes
  (`/blog`, `/thank-you`, `/quiz`, service pages, legal pages) use `next/link`;
  same-page hashes (`#contact`, `#gallery`), `tel:`, `mailto:`, external URLs,
  and files stay plain anchors. Rooted hash links that cross routes
  (`/#contact`) use `next/link` so they remain SPA transitions. Do not force
  hard reloads to simplify analytics.
- ✅ **Tracking contract:** production GTM mounts a pathname/search-based
  `PageViewTracker` that skips first mount and ignores hash-only changes. A
  `#contact` jump is not a pageview; `/blog` -> `/blog/post` is. Keep
  submit-button clicks as CTA-click tracking only, and fire lead/conversion
  events only from confirmed success state. Editable React forms and quizzes use
  the `lead_event` handoff: stage pending match data before submit, append
  `lead_event=<eid...>` only after server/API success, and push `submitted_form`
  only when the route tracker consumes that pending event. Direct thank-you page
  loads are not lead conversions.
- ✅ One scarcity nudge on the homepage, not two with identical copy (BookingUrgencyCTA
  is the default; UrgencyBlock is opt-in with distinct copy).

## 10. Code health

- ✅ Strict TS, no `any`/`@ts-ignore`/`!`-abuse. Shared helpers in `lib/`
  (e.g. `isInternalRoute` → `lib/links.ts`), never duplicated.
- ✅ Form/quiz contract changes leave one focused `node:test` check behind
  (`lib/*.test.ts`): validators, rate-limit/IP resolution, delivery helpers, or
  tracking handoff. Do not mock Next internals when a schema/helper test catches
  the break.
- ✅ Client sites are standalone deploys. Reuse means each site keeps the proven
  local primitive (`lib/validators.ts`, `lib/rate-limit-core.ts`,
  `lib/submissions-log.ts`, `lib/ghl/contacts.ts`) and the template carries the
  canonical copy. Do not extract runtime code out of client sites without a
  deliberate architecture change.
- ✅ No dead exports — if a primitive isn't used, wire it or delete it.
- ✅ No hardcoded hex in components — only `--color-*` tokens. (`text-white`/`bg-white`
  are allowed on dark surfaces — they equal the on-dark tokens; the dev-only
  `TweaksPanel` is exempt.) Audit: `grep -rn "#[0-9a-fA-F]\{3,6\}\|border-red-\|text-red-" components` empty.

## 11. Layout rhythm & copy economy (2026-06 build lessons)

These were learned the slow way — through many review round-trips on one build.
Apply them up front so the next site doesn't re-discover them.

- ✅ **Homepage plane map lives in `app/(site)/page.tsx`.** Composition is not
  agnostic. Before reordering sections, list each section’s plane
  (CREAM | DARK | PHOTO-DARK) in that file’s rhythm-contract comment and verify:
  never 3 cream text jobs in a row; never 3 dark ASP / quote planes in a row;
  ImageQuote / product breakers sit between cream jobs when assets exist.
  Default order (SteinArt plane contract + Logan early-gallery lesson):
  Hero → SocialProof → Empathy → Quote[0]? → **Gallery early** → Process(dark) →
  Includes → Quote[1]? → Meet → Carousel → **Urgency before inquire** →
  **Contact+FAQ as one cream close chapter** → Footer.
  Gate optional planes on real config (`imageQuotes[n]`, `bookingCTA`); skip or
  ask the human for assets. Never invent quotes, awards, prices, or proof.
- ✅ **Close chapter = Contact `flushBottom` + FAQ `continueFromAbove`.** Do not
  stack Contact, ImageQuote, FAQ, then Urgency as four separate section starts.
  On the homepage FAQ: `relatedLinks={[]}`, empty footer Inquire CTA (the form
  is already above). Pass related links only on thin pages that lack a footer.
- ✅ **Alternate section backgrounds.** Never stack 3+ consecutive cream prose
  sections — they blend into one wall of text. Break long cream runs with a dark
  section. Mid-page text/list sections take a `tone: "cream" | "dark"` prop
  (`EmpathyBlock`, `IncludesGrid`, `ProcessSteps`); set it on the page to
  alternate. (`MeetPhotographer`/`OfferStack`/dark breakers are already ink.)
  Don't put two darks adjacent unless they're clearly different formats
  (hero + thin proof strip is fine; two full quote/ASP bands back-to-back is not).
- ❌ **No redundant sections — one beat, one place.** A "Why book / What makes us
  different" reasons section almost always restates the inclusions + process +
  testimonials (on the last build, "same-day reveal", "fully guided", and
  "nervous is normal" each appeared 3×). Cut it, or keep only its one unique
  point. Each selling beat appears in exactly ONE section — audit a new page for
  the same idea said twice and consolidate.
- ✅ **Offer / value-stack.** For budget-conscious audiences do NOT lead with a big
  tallied "Total value: $X" — it reads as pressure, not value. Lead with the
  experience; keep dollar cues light (the discounted price + one genuine credit);
  move dense conditions to a small "fine print" block at the page bottom; pair
  the offer with a finished image. (`OfferStack`: omit `totalValue`, pass `image`.)
- ❌ **Copy honesty.** Never describe product mockups/renderings as real client
  homes or real client work ("styled in real homes" is false when they're
  mockups). Use "framed & styled / designed for your wall / how a finished piece
  is shown." Never fabricate attributed testimonials — only real, verified quotes.
- ✅ **Contact info placement.** Phone / email / studio address live in the
  **footer + the contact section** (and LocalBusiness JSON-LD) — fed from
  `siteConfig.brand.{phone,email,location}`. ❌ Never put a contact utility row in
  the nav/header or hero.
- ❌ **No sticky / fixed navigation.** The nav header must scroll away with the
  page — never `position: sticky`/`fixed` on the navbar (owner preference
  2026-06-18: *no sticky navs*). Persistent conversion is the mobile
  `StickyInquirePill` + repeated in-page CTAs + footer, not a pinned header.
- ❌ **Campaign / landing pages carry no full site nav, and never a competing
  offer.** A paid-traffic landing page (e.g. `/40-over-40`,
  `/bridal-boudoir-semi-annual-sale`) and its own thank-you page exist for ONE
  offer and ONE conversion goal — the full `Navbar` (with its `navCta` linking
  to the site's separate `/quiz` offer), `Footer` nav, and `QuizPopup` actively
  compete with that. Route these pages OUTSIDE the `(site)` route group (plain
  `app/{slug}/page.tsx`, no local `layout.tsx` — same recipe as a nav-less page
  like `/current-pricing-guide`) and add a minimal NAP+legal footer. This
  applies doubly to the thank-you page: never show a different discount/offer
  CTA to someone who just converted on this one. (Found live on Grateful
  Goddess's `/40-over-40*` and Mayberry's `/bridal-boudoir-semi-annual-sale*`
  2026-07-02 — both inherited the quiz's competing nav CTA — fix on sight in
  any fork.)
- ✅ **Landing-page header = brand + in-page anchors + own CTA, not a bare
  logo.** A campaign landing page's header still needs a real header, not just
  a centered logo (owner feedback 2026-07-02: a bare logo bar "looks really
  bad," reads as an unfinished placeholder). Give it: brand mark (left, links
  to `/`) + anchor links to THAT SAME PAGE's own sections (e.g. "The Offer" →
  `#offer`, "Gallery" → `#gallery`, "FAQ" → `#faqs`) + the page's own single
  CTA button (e.g. "Apply Now" → `#contact`) — never a link to another page or
  offer, just wayfinding within the one page. Add an `id`/`scroll-mt-*` to any
  target section missing one. Short thank-you pages (nothing to jump to) keep
  the plain brand-only header. Reference: `components/layout/CampaignChrome.tsx`
  in `sites/grateful-goddess-boudoir` and the `CampaignMasthead` export in
  `sites/mayberry-and-stone/components/mns/bridal/BridalSections.tsx`.
- ✅ **Product-as-art / lookbook.** One lookbook per showcase — a grid OR a
  carousel, never both showing the same images. The hero/feature image is
  excluded from the grid (no repeats). Distribute hero mockups across the page;
  don't bunch all of one product type into a single block.
- ✅ **Legal pages.** Mirror the client's *existing* sitemap slugs (e.g.
  `/privacy-policy`, `/terms-and-conditions`) as `content/pages/*.mdx`
  (`status: indexable`) so they auto-route + land in the sitemap, and link them in
  the footer. Write real, complete policies (legal entity, jurisdiction, contact)
  — not Showit boilerplate. For boudoir/intimate/sensitive niches include
  **image-privacy + model-release** clauses ("images private by default, written
  consent only").

---

## PR gate (must be green before opening a PR)

```bash
cd templates/new-build
npm run typecheck          # 0
npm run lint               # 0 (--max-warnings 0)
npm run content:qa         # pass (template mode)
npm run build              # 0, ✓ Compiled
npm run audit              # 0 high/critical
# clients only, after content is filled:
npm run content:qa:launch  # pass (no placeholder/proof/platform-residue)
# with a server running:
SITE_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:routes
```

> ⚠️ **Run the WHOLE gate, not just typecheck/lint/build.** CI's `npm run verify`
> runs `npm run audit` (high/critical) — a pre-existing **transitive** dep vuln
> (e.g. via `@modelcontextprotocol/sdk` → `hono`) will fail the PR even when
> typecheck/lint/build are green locally. `npm audit fix` (non-breaking, within
> semver ranges) usually clears it; commit the lockfile.

Plus a **rendered pass** (`@axe-core/playwright` + screenshots at 390/768/1440/1280)
for any visual/a11y change before a client launch. For a typography/rhythm change,
verify at the **rendered** level — computed body `font-size` and section
background colors — not just "it compiles".

## New-client kickoff (Goddess-style brand-new fork)

Brand-new client (no work done yet) → clone the hardened template wholesale
rather than rebuilding: use `scripts/create-client-site.mjs`. The script copies
deployable site code, writes only `sites/{client}/docs/README.md`, and keeps
generic doctrine/docs central in `templates/new-build/docs/` (P2P Bible,
marketing drafts, attribution/Sentry/quiz docs, standards, plans, audits). Work
the central `templates/new-build/tasks/template-restart-checklist.md`. For a
client already mid-build (Grateful), cherry-pick these standards into the
existing site rather than copying over their work.
