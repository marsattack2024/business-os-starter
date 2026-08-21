# 10/10 Photography-Site Build Standard

> The canonical rubric for every `templates/new-build` client fork.
> A build is "10/10" only when it clears every dimension below.
> Score each dimension 0–10 before opening a PR and before launch.
>
> **Complements — do not replace:**
> - `sites/WEBSITE-QUALITY-CHECKLIST.md` — per-site launch gate (actionable checklist)
> - `tasks/template-restart-checklist.md` — ordered fork-kickoff sequence
> - `launch-checklist` / `manage-seo` skills — deployment + SEO tooling
>
> **Research grounding (2025-2026):**
> Core Web Vitals thresholds from web.dev/articles/vitals (p75 field data).
> INP replaced FID as a Core Web Vital in March 2024.
> AEO / LLM-crawler behavior from Google Search Central documentation + Perplexity/OAI crawler disclosures.
> Schema.org specification + Google Rich Results documentation.

---

## Dimension 1 — Architecture & Code Health

### 10/10 bar

| Rule | Detail |
|---|---|
| Single-source config | Every brand fact (`name`, `phone`, `email`, `location`, `priceRange`, `category`, `serviceAreas`, hours) in `lib/site.config.tsx`. Section content in `lib/content.config.ts`. A fork is: change those two files + swap images + set env. |
| No hardcoded brand facts | Zero instances of niche/client text embedded in components, routes, or descriptors. **Auto-enforced by `npm run content:qa` (scanStandards).** Manual: `grep -rn "Portrait Studio\|photography session\|\[Name\]" app components` returns empty. |
| Token-only colors | All color references in components are `--color-*` CSS tokens. No raw hex, no `border-red-*`/`text-red-*`. Re-skin = edit the six `--primitive-*` values in `app/globals.css` and mirror hex in `lib/og-colors.ts`. |
| Type tokens for copy | Body and list copy uses `text-body` / `text-lead` / `text-eyebrow`. `text-sm`/`text-xs` reserved for meta (captions, attributions, price notes, fine print). |
| Server-components-first | Pages and layouts are React Server Components by default. `"use client"` added only where interaction is genuinely required (INP boundary). |
| Strict TypeScript | No `any`, no `@ts-ignore`, no `!`-abuse. Shared helpers live in `lib/`, not duplicated. |
| No dead exports | Every exported primitive is wired. Unwired code is removed. |
| Filesystem loaders cached | `getAllPosts` / `getAllPages` are `React.cache`-wrapped. |

### How to verify

```bash
cd templates/new-build
npm run typecheck          # 0 errors
npm run lint               # 0 warnings
npm run content:qa         # pass (template mode)
grep -rn "#[0-9a-fA-F]\{3,6\}\|border-red-\|text-red-" components  # empty
```

### Template file / skill owner

`lib/site.config.tsx`, `lib/content.config.ts`, `app/globals.css`, `lib/og-colors.ts`

---

## Dimension 2 — Performance / Core Web Vitals

> **Targets (p75 field data, Google's 2025 thresholds):**
> LCP ≤ 2.5 s · INP < 200 ms · CLS < 0.1
> INP (Interaction to Next Paint) replaced FID as a Core Web Vital in March 2024.
> Source: web.dev/articles/vitals

### 10/10 bar

| Rule | Detail |
|---|---|
| Hero `priority` + `sizes` | Exactly ONE `<Image priority>` per viewport — the hero. Correct `sizes` attribute so the browser downloads at render width. No double-priority, no redundant `<link rel="preload">`. |
| No LCP below fold | Sections below the fold are NOT `priority`. They use `loading="lazy"` (default for `next/image`). |
| Font self-hosting | `next/font` only. No Google Fonts `<link>` in `<head>`. `display: swap`, fallback metrics tuned (`size-adjust`, `ascent-override`) to minimize FOIT and CLS. |
| Image dimensions reserved | Every `<Image>` has `width`/`height` or `fill` + a sized container so no layout shift on load. |
| Next/Script for non-critical | Third-party scripts (analytics, chat, embeds) use `<Script strategy="lazyOnload">`. |
| Static-generate marketing pages | All public marketing pages are statically generated (no `force-dynamic`, no `export const dynamic = "force-dynamic"` on homepage/service/blog routes). |
| `"use client"` scoped narrowly | Interactive islands scoped to their boundary. Server-renderable UI (buttons, headings, images) never wrapped in a client component unnecessarily. Each client boundary is an INP latency risk. |
| Below-fold code-split | Heavy sections (gallery, quiz, video player) are `next/dynamic`. `ssr: false` only for genuine runtime cost — not for static DOM (hurts LCP + SEO). |
| Motion budget | `LazyMotion strict` + `m.*` only. `prefers-reduced-motion` honored (MotionConfig + CSS). No always-running `rAF` or infinite marquee on mobile. Animation paused when element is off-screen. |
| Production-gated third-party JS | Analytics, GTM gated to `VERCEL_ENV === "production"`. No external script in dev that bloats bundle metrics. |
| CLS < 0.1 | `aspect-ratio` set on all image containers. Overlay / toast / notification elements don't shift layout. Fonts settled before paint (fallback metrics + `swap`). |

### How to verify

1. **Lighthouse CI** (mobile, 4G throttle): LCP ≤ 2.5 s, CLS < 0.1.
2. **Chrome DevTools > Performance Insights**: confirm INP < 200 ms on homepage load + form submit.
3. **Network panel**: confirm only one preload for the hero image; fonts are self-hosted WOFF2.
4. `npm run build` output: confirm zero routes marked `force-dynamic` for marketing pages.

### Template file / skill owner

`next.config.ts`, `components/sections/Hero.tsx` (priority image), `next/font` config in `app/layout.tsx`

---

## Dimension 3 — Accessibility (WCAG 2.2 AA)

> WCAG 2.2 superseded 2.1 in October 2023. The AA standard is the legal baseline in most jurisdictions. Source: w3.org/TR/WCAG22

### 10/10 bar

| Rule | Detail |
|---|---|
| One `<h1>` per page | Including `error.tsx`, `not-found.tsx`, `global-error.tsx`. |
| Logical heading order | No skipped heading levels (`h1 → h2 → h3`). |
| Contrast AA | Body text ≥ 4.5:1. Large text (≥ 18pt / 14pt bold) ≥ 3:1. UI components and focus indicators ≥ 3:1. Check every text-on-color-surface combo, especially low-opacity light text on mid-tone backgrounds. `--color-on-dark-*` tokens on dark surfaces — never `--color-muted` on `--color-ink`. |
| Visible focus | Consistent `focus-visible` ring everywhere (token-driven). No outline suppression without a visible alternative. |
| Touch target size | All interactive elements ≥ 44 × 44 px (WCAG 2.5.5 AA / 2.5.8 A). |
| Keyboard complete | Every interactive element is Tab-reachable and operable. |
| Mobile menu | Escape closes + restores focus to the trigger. Closed-drawer links `tabIndex={-1}` + `aria-hidden`. |
| Modal / dialog | Focus moves in on open, Tab/Shift+Tab trapped, Esc closes, focus restored to trigger. |
| Forms | Use `Input`/`Textarea` primitives (required asterisk, `aria-describedby`/`aria-invalid` error association built-in). Success announced via `role="status"`. |
| Semantic landmarks | `<header>`, `<nav>`, `<main>`, `<footer>`. Skip-to-content link at top of DOM. |
| Images | Descriptive `alt` on EVERY real photograph — **including photos used as styled / background images** (keep the backdrop `aria-hidden` so it adds no screen-reader noise, but still give it a non-empty alt). Reserve `alt=""` ONLY for true non-photo decoration (spacers, gradients, icons redundant with adjacent text). **Owner rule: never ship an empty alt on a real photo.** Icons: `aria-hidden` or `role="img"` + label. |
| Reduced motion | `prefers-reduced-motion: reduce` neutralizes all motion — both JS (MotionConfig) and CSS (`@media (prefers-reduced-motion: reduce)`). |
| Portfolio alts | Every portfolio/gallery image has a descriptive `alt` (subject, style, location). Not "image1.jpg". |

### How to verify

```bash
# With a server running at localhost:3000:
npx @axe-core/playwright --url http://localhost:3000
# Also run at /blog, /contact, /thank-you
```

Manual: keyboard navigation pass at 390 px and 1440 px. Color-contrast audit with browser DevTools.

### Template file / skill owner

`components/ui/Input.tsx`, `components/ui/Textarea.tsx`, `components/layout/MobileMenu.tsx`, `app/globals.css` (focus token), `lib/motion.config.ts`

---

## Dimension 4 — SEO (On-Page + Technical)

### 10/10 bar

| Rule | Detail |
|---|---|
| Title ≤ 60 chars | Unique per page. Keyword + location aware. No template leftovers. No period-before-pipe. |
| Meta description ≤ 160 chars | Unique per page. Reads as a natural sentence. No placeholder copy. |
| One `<h1>` | Exactly one per page. Matches the page intent keyword. |
| Canonical absolute | Self-referential canonical on every indexable page. Generated by `lib/seo.ts` → `buildPageMetadata`/`buildArticleMetadata`. `metadataBase` set in `app/layout.tsx`. |
| No duplicate-intent pages | No two public pages competing for the same keyword. Redirect or canonicalize the loser. |
| Internal linking | Key pages reachable from nav + footer. No orphan money pages. `rel="noopener noreferrer"` on external links. |
| Image alt + filenames | Descriptive alt on every content image. Filenames use keywords + location (e.g. `boudoir-photographer-seattle-studio.webp`), not `DSC_0001.jpg`. |
| OG + Twitter card | `og:type`, `og:title`, `og:description`, `og:image` (absolute URL), `og:url` on every page. `twitter:card: summary_large_image`. OG image resolves to a real asset. |
| Sitemap | All indexable pages included. `noindex` / utility / draft pages excluded. Posts use their `date` as `lastmod`. Sitemap submitted to GSC after launch. |
| Robots.txt | Thank-you, checkout, staging, `/md/`, draft, and tool pages `Disallow`ed or `noindex`'d. |
| 301 redirects | All migration redirects are 301, chain-free, populated in `lib/page-redirects.json` + `lib/blog-redirects.json`. |
| No `noindex` on money pages | Homepage, service pages, gallery pages, blog posts must be indexable. |

### How to verify

```bash
# Content QA:
npm run content:qa:launch   # no placeholders, no proof gaps

# Check title lengths:
curl -s http://localhost:3000 | grep -o '<title>[^<]*</title>'

# Confirm canonical resolves:
curl -sI http://localhost:3000 | grep -i link
```

Rich Results Test: https://search.google.com/test/rich-results
Screaming Frog or broken-link crawler after launch.

### Template file / skill owner

`lib/seo.ts` (`buildPageMetadata`, `buildArticleMetadata`), `app/sitemap.ts`, `public/robots.txt`, `lib/page-redirects.json`, `manage-seo` skill

---

## Dimension 5 — AEO / Structured Data

> AI Overviews (Google), ChatGPT (OAI-SearchBot), and Perplexity (PerplexityBot) draw from the normal indexable web — no special tags required, but structured data, entity consistency (NAP + sameAs across the web), and per-bot robots rules all influence citation and inclusion.
> The distinction: search bots (allow in robots.txt) vs training bots (policy-controlled, typically blocked).
> Source: Google Search Central documentation + Perplexity crawler disclosures (2025).

### 10/10 bar

| Rule | Detail |
|---|---|
| @id-unified @graph | Homepage emits a `@graph` with stable `@id` links: `#org` (Organization), `#website` (WebSite), page-specific node. All types cross-link via `@id`. |
| LocalBusiness / ProfessionalService | Complete: `name`, `url`, `telephone`, `address` (PostalAddress), `geo` (GeoCoordinates), `openingHoursSpecification`, `priceRange`, `image`, `sameAs` (all social + GBP URLs), `areaServed`. Subtype when applicable (e.g. `PhotographyBusiness`). |
| Service schema per offering | Each service page emits a `Service` node with `provider: { @id: #org }`, `areaServed`, and `offers` (if priced). |
| FAQPage | On pages that show real FAQs. Not generic. Content must match visible text exactly. |
| BlogPosting / Article | On every blog post: `headline`, `description`, `image` (absolute), `datePublished`, `dateModified`, `author` (Person), `publisher` (Organization). |
| BreadcrumbList | On all non-home pages. |
| absoluteUrl() for all URL / image fields | `metadataBase` does NOT apply to hand-built JSON-LD. All `url`, `image`, `@id` fields use `absoluteUrl()` from `lib/site-url.ts`. |
| Placeholder-guarded | `isRealPublicValue()` guards every emitted field. A half-configured fork emits nothing (null from schema builders → `JsonLd.tsx` renders nothing). No broken schema on placeholder values. |
| `JsonLd.tsx` injection only | JSON-LD is never `JSON.stringify`'d directly into a `<script>`. Only `components/seo/JsonLd.tsx` (which `<`-escapes). |
| aggregateRating / review | Only emitted when backed by real reviews (count + rating). Sourced from `content/proof-map.json`. |
| Structured data matches visible text | Every claim in JSON-LD (hours, address, rating, priceRange) matches what the user sees on the page. |
| llms.txt + llms-full.txt | Present, derives all brand/contact facts from `siteConfig` (no stale copy). Hidden from nav/sitemap/search indexing. |
| Per-bot robots rules | `robots.txt` uses `User-agent:` blocks to allow search crawlers (Googlebot, OAI-SearchBot, PerplexityBot, Bingbot) and apply policy to training crawlers (`GPTBot`, `Google-Extended`, `CCBot`, `anthropic-ai`). Controlled by `siteConfig.seo.aiBotPolicy`. |
| NAP entity consistency | Name, address, phone match across site JSON-LD, `llms.txt`, footer, GBP listing, and primary citation directories. |
| WebMCP | `components/seo/WebMcp.tsx` present in `<head>`. |

### How to verify

```bash
# Schema validation:
curl -s http://localhost:3000 | npx --yes schema-dts-check  # or paste into rich-results test

# llms.txt:
curl http://localhost:3000/llms.txt | grep -i "phone\|name\|url"

# Per-bot robots:
curl http://localhost:3000/robots.txt
```

Google Rich Results Test, Schema.org validator.
Check that `OAI-SearchBot` and `PerplexityBot` are allowed; training crawlers match policy.

### Template file / skill owner

`lib/schema.ts`, `lib/site-url.ts`, `components/seo/JsonLd.tsx`, `components/seo/WebMcp.tsx`, `app/robots.ts`, `app/llms.txt/route.ts`, `manage-seo` skill

---

## Dimension 6 — Local SEO

### 10/10 bar

| Rule | Detail |
|---|---|
| NAP consistency | Business name, address, phone identical across: site footer, site JSON-LD, Google Business Profile (GBP), Yelp, Facebook, Apple Maps, and any major citation directory. Inconsistency confuses AI citation engines as much as search engines. |
| GBP claimed + complete | GBP has: current hours, service area, photos (min 5 real work images), primary category, description matching site copy, website URL pointing at canonical domain. |
| `areaServed` in JSON-LD | LocalBusiness and Service schemas include `areaServed` as an array of `City` / `State` nodes. For travel photographers, list every market. Sourced from `brand.serviceAreas` in `lib/site.config.tsx`. |
| Service area config | `brand.serviceAreas` in `lib/site.config.tsx` is filled with real place names (not placeholder). Drives `areaServed` in JSON-LD and visible copy in footer / contact section. |
| Address privacy decision | Boudoir, in-home, and mobile photographers: city + state only (no street address). Studio photographers: full address. Captured in `brand.location` (with or without `street`). Owner confirms before launch. |
| Location-aware titles + descriptions | Page titles and meta descriptions include the primary city / market (e.g. "Boudoir Photographer Seattle"). |
| Text-first contact | Business name, city, phone on page as real DOM text — not text-in-images (invisible to search + AI crawlers). |
| No duplicate location pages without unique content | Location landing pages (for multi-market photographers) each have unique body copy, distinct keywords, and their own canonical. |

### How to verify

- Confirm `brand.serviceAreas` is set and appears in rendered footer.
- Paste business name + phone into Google — confirm GBP appears and NAP matches site.
- `curl http://localhost:3000 | grep -i "phone\|address"` returns real DOM text.
- Run schema through Rich Results Test — check `areaServed`.

### Template file / skill owner

`lib/site.config.tsx` (`brand.location`, `brand.serviceAreas`), `lib/schema.ts` (areaServed), `components/layout/Footer.tsx`, `manage-seo` skill

---

## Dimension 7 — Content & Blog

### 10/10 bar

| Rule | Detail |
|---|---|
| Migrated content complete | All posts migrated with inline body images in original document order. No broken image references. No `[image]` or `[figure]` placeholders. |
| Post frontmatter valid | Every post has `title`, `slug`, `date` (YYYY-MM-DD). `status: draft` for staged. Future `date` for scheduled. Build fails on invalid frontmatter (`assertValidPublished`). |
| Keyword + location meta | Each post has a unique `title` (≤ 60 chars, keyword + location) and `description` (≤ 160 chars). Not auto-generated from first sentence alone. |
| Cornerstone posts linked | 2–3 cornerstone (pillar) posts get internal links from at least 3 other posts or pages. |
| Blog hidden until populated | `/blog`, nav "Journal" link, sitemap entry, and llms.txt mention all hidden until ≥ 1 published post (`status: indexable` with a past `date`). |
| No `.mdx` JSX or embeds | `.mdx` here = sanitized Markdown via `marked` (no JSX components). Iframe domains must be whitelisted in the sanitizer before use. |
| `noindex` utility content | `/thank-you`, `/md/*`, draft pages, redirect targets: `noindex` + excluded from sitemap. |
| `content/proof-map.json` complete | Every claim on the site (review count, star rating, years in business, awards, "featured in", testimonials) is source-mapped here before launch. |

### How to verify

```bash
# Build check (catches bad frontmatter):
npm run build

# Content QA:
npm run content:qa:launch

# Confirm blog hidden when empty:
curl -sI http://localhost:3000/blog   # should return 404 or redirect

# Confirm each post body image resolves:
curl -s http://localhost:3000/blog/[slug] | grep -o 'src="[^"]*"' | head -20
```

### Template file / skill owner

`content/blog/*.mdx`, `content/proof-map.json`, `lib/posts.ts`, `app/blog/[slug]/page.tsx`, `manage-seo` skill

---

## Dimension 8 — Conversion

### 10/10 bar

| Rule | Detail |
|---|---|
| Above-fold value prop | First screen answers: who you serve, what they get, where you are, and why you. No scrolling required. |
| One primary CTA verb | "Inquire" / "Inquire Today" sitewide. Not "Work With Me", "Secure Your Spot", "Get In Touch". **Auto-enforced by `npm run content:qa` (scanStandards).** |
| ONE CTA per screen | No competing CTA verbs in the same viewport. |
| Persistent CTA | Mobile `StickyInquirePill` + repeated in-page section CTAs + footer CTA. (Nav is NOT sticky — persistence comes from in-page + pill, not a pinned header.) |
| Social proof at decision moments | Testimonials / review count / ratings placed above the form, near service descriptions, and in mid-page breakers — not just a wall at the bottom. |
| Mobile-first layout | Test at 390 px first. Thumb-reachable CTA (bottom-fixed pill). All tap targets ≥ 44 px. |
| Low-friction form | Fewest fields necessary. `sourcePage` captured via `usePathname()` (not hardcoded). `what happens next` + turnaround promised below the form. |
| Trust signals | Real review counts (from `proof-map.json`), a privacy note for sensitive niches (boudoir: image privacy). |
| No redundant sections | Each selling beat (inclusion, reason to book, reassurance) appears in exactly ONE section. No beat stated three times across three sections. |
| Offer / value presentation | For budget-conscious audiences: lead with the experience, not a big "Total value $X" tally. Dense conditions in a fine-print block at page bottom. Offer paired with a finished image. |
| Contact info placement | Phone / email / address in footer + contact section (fed from `siteConfig`). Never in nav/header or hero. |

### How to verify

- Load homepage at 390 px. Confirm CTA visible above fold. Confirm sticky pill appears on scroll.
- Run `npm run content:qa` — confirm no banned CTA verbs.
- Count unique CTA verbs across all sections. Result: 1.
- Submit test inquiry — confirm `sourcePage` in CRM payload matches the URL.

### Template file / skill owner

`lib/content.config.ts` (CTAs), `components/ui/StickyInquirePill.tsx`, `components/ui/ContactForm.tsx`, `components/sections/BookingCTA.tsx`, `lib/validators.ts`

---

## Dimension 9 — Images

### 10/10 bar

| Rule | Detail |
|---|---|
| WebP format | All site images in WebP (or AVIF). No JPEG/PNG in `/public/` unless a legacy format is required for a specific embed. |
| Hero: `priority` + correct `sizes` | The ONE hero image has `priority` set and a `sizes` attribute matching its responsive render width (e.g. `"(max-width: 768px) 100vw, 50vw"`). |
| Dimensions reserved | All `<Image>` elements have explicit `width` / `height` or `fill` + a sized container. Prevents CLS. |
| No face close-up hero | Hero / near-top landing images are full-body or three-quarter-length minimum. Environmental or lifestyle context. Faces are acceptable in mid-page breakers, testimonial avatars, and the "Meet" section. |
| Reasonable file size | Hero source ≤ 400 KB before Next.js optimization (≤ 1 MB if using high-res). Interior images ≤ 200 KB. |
| SEO filenames | Image files use descriptive, keyword + location names: `boudoir-photographer-portland-studio.webp`. Not `IMG_3847.jpg`. |
| Alt text | Descriptive alt on every real photograph (incl. styled/background photos — keep them `aria-hidden` but non-empty alt). `alt=""` only for non-photo decoration. Portfolio items: subject + style + location. |
| No duplicate images | The hero/feature image excluded from gallery grid. No image shown twice in the same viewport. |
| OG image | `seo.defaultOgImage` is a real Facebook-safe session photo (not logo / not text card). `/opengraph-image` remains as plumbing fallback only. Dimensions: 1200 × 630 px preferred (landscape source OK). |

### How to verify

```bash
# Check for non-WebP in public:
find /public -name "*.jpg" -o -name "*.png" | grep -v favicon | grep -v apple-touch
# Should return empty (or only intentional exceptions)

# Confirm hero priority:
grep -rn "priority" components/sections/Hero.tsx
# Should show exactly one <Image priority

# File size check:
ls -lh public/*.webp
```

Lighthouse "Properly sized images" and "Image formats" audits.

### Template file / skill owner

`components/sections/Hero.tsx`, `public/` (client image assets), `lib/site.config.tsx` (`images.*`), `asset-intake` skill

---

## Dimension 10 — Owner-Input Completeness

> These are the client-supplied facts that cannot be fabricated or defaulted. A build at 10/10 has collected, verified, and wired ALL of these before launch.

### 10/10 bar

| Input | Where it goes | Risk if missing |
|---|---|---|
| Service areas (city + state list) | `brand.serviceAreas` → `areaServed` in JSON-LD, footer copy | Schema missing `areaServed`; local SEO blind spot |
| Studio hours | `brand.hours` → `openingHoursSpecification` in JSON-LD (LocalBusiness) | Missing rich result; GBP mismatch. Forks ship an assumed Mon–Sat 09:00–19:00 default — confirm or remove |
| Price band / range | `brand.priceRange` → JSON-LD `priceRange` | Schema placeholder emitted or omitted |
| Starting price (optional) | `brand.startingPrice` → `Service.offers` ("from $X") | No price rich result; set only a client-confirmed number (outward-facing) |
| Map coordinates (optional) | `location.geo` (city centroid) → `GeoCoordinates` | No map pin. For boudoir / in-home use a CITY centroid, never the home address; fine to omit |
| Address privacy decision | `brand.location` (city-only vs full street) | Boudoir client's home address published; or studio shows city-only |
| Phone + email to publish vs form-only | `brand.phone`, `brand.email` in config (blank = form-only) | Placeholder phone in footer; or phone published against client preference |
| Real review counts, ratings, awards | `content/proof-map.json` + `aggregateRating` JSON-LD | Fabricated social proof; blocked from Google review rich result |
| Social profile URLs | `socials[]` in `lib/site.config.tsx` | Broken `sameAs` schema; broken social footer links |
| AI bot policy | `siteConfig.seo.aiBotPolicy` | Training crawlers unblocked; or legitimate crawlers blocked |
| Verified testimonials | `content/proof-map.json` + testimonial components | Fabricated attributed quotes (policy violation + trust risk) |
| Booking / scheduling URL | `brand.bookingUrl` or `bookingCTA.ctaHref` | CTA links nowhere or to a generic Calendly not set up for this client |

### How to verify

```bash
npm run content:qa:launch   # fails on any placeholder value
# Also:
grep "isRealPublicValue" lib/schema.ts   # confirm every guarded field
cat content/proof-map.json               # confirm all claims are source-mapped
```

### Template file / skill owner

`lib/site.config.tsx`, `content/proof-map.json`, `lib/schema.ts`, `tasks/template-restart-checklist.md` (Section 0 collects these)

---

## Scoring Guide

Score each dimension 0–10 using the table below. A build ships at ≥ 9.0 average with no dimension below 7 and no P0 item open.

| Score | Meaning |
|---|---|
| 10 | All rules met, verified by the listed checks |
| 9 | One minor gap (non-P0), fix in-flight |
| 7–8 | 1–2 gaps, at least one is P1; plan to fix post-launch |
| 5–6 | Multiple gaps, at least one P0; do not launch |
| < 5 | Fundamental gap; pause and fix before continuing |

---

## 10/10 Launch Gate (1-page checklist)

Print this section. Tick every item before opening a launch PR.

### Architecture
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 warnings
- [ ] `npm run content:qa` — pass (template mode, no brand-fact hardcodes)
- [ ] `npm run content:qa:launch` — pass (no placeholders, proof gaps, or platform residue)
- [ ] `npm run build` — 0 errors, all routes static where expected
- [ ] `npm run audit` — 0 high/critical dependency vulnerabilities
- [ ] `npm run verify` — full CI gate green

### Performance
- [ ] Lighthouse mobile: LCP ≤ 2.5 s, CLS < 0.1, Performance ≥ 90
- [ ] INP < 200 ms verified in Chrome DevTools on homepage + form interaction
- [ ] Only ONE `<Image priority>` per viewport (the hero)
- [ ] Fonts self-hosted via `next/font` (no external font CDN request)
- [ ] All marketing pages statically generated (no `force-dynamic` on homepage/services/blog)

### Accessibility
- [ ] `@axe-core/playwright` — 0 violations at 390, 768, 1440 px
- [ ] Keyboard navigation pass (Tab through every interactive element)
- [ ] One `<h1>` per page — including error, 404, global-error pages
- [ ] All portfolio images have descriptive `alt` text

### SEO
- [ ] Every page: unique title ≤ 60 chars, unique description ≤ 160 chars
- [ ] Canonical URL on every indexable page (absolute, self-referential)
- [ ] `sitemap.xml` — all indexable pages in; drafts/utility pages out
- [ ] `robots.txt` — search bots allowed; training bots per policy; `/md/` disallowed
- [ ] All migration redirects in `lib/page-redirects.json` — 301, chain-free
- [ ] Internal links: no orphan money pages
- [ ] Image filenames: descriptive + keyword + location (not `IMG_xxxx`)

### AEO / Structured Data
- [ ] Rich Results Test — LocalBusiness valid, no warnings
- [ ] `aggregateRating` present only if backed by real reviews in `proof-map.json`
- [ ] `areaServed` populated from `brand.serviceAreas`
- [ ] `llms.txt` — brand name, phone, URL all correct
- [ ] Per-bot `robots.txt` — OAI-SearchBot + PerplexityBot allowed; GPTBot / CCBot per `aiBotPolicy`
- [ ] All JSON-LD `url`/`image` fields are absolute (via `absoluteUrl()`)
- [ ] `isRealPublicValue()` guard active — no placeholder schema emitted

### Local SEO
- [ ] NAP (name / address / phone) consistent: site footer ↔ JSON-LD ↔ GBP ↔ top citation directories
- [ ] Address privacy confirmed with client (city-only vs full street)
- [ ] GBP listing claimed, hours set, photos uploaded, website URL correct
- [ ] Service areas wired to `brand.serviceAreas` and visible in footer/contact

### Content & Blog
- [ ] All migrated posts: inline images present in original order, no broken src
- [ ] `content/proof-map.json` — every testimonial + stat + award source-mapped
- [ ] Blog hidden (nav / sitemap / llms) until ≥ 1 published post
- [ ] No placeholder or lorem copy anywhere in rendered output

### Conversion
- [ ] Only one CTA verb sitewide (enforced by `npm run content:qa`)
- [ ] Mobile `StickyInquirePill` visible after first scroll on homepage
- [ ] Test inquiry submitted → lands in CRM with correct `sourcePage`
- [ ] No hero is a face close-up

### Images
- [ ] All images in `/public/` are WebP (or intentional exception documented)
- [ ] Hero source ≤ 400 KB
- [ ] `/opengraph-image` resolves to a real branded asset (not 404)

### Owner inputs
- [ ] `brand.serviceAreas` — real place names, not placeholder
- [ ] `openingHoursSpecification` — filled in schema or confirmed N/A
- [ ] `brand.priceRange` — client-approved band
- [ ] Address privacy decision documented
- [ ] `content/proof-map.json` — 100 % source-mapped (no "TBD" rows)
- [ ] `aiBotPolicy` — confirmed with client (default: allow search, block training)

### Post-launch (first 48 h)
- [ ] GSC: sitemap submitted, coverage report clean
- [ ] Live URL smoke: `SITE_SMOKE_BASE_URL=https://client-domain.com npm run smoke:routes`
- [ ] Rich Results Test on live URL — no errors
- [ ] Re-run Lighthouse on live URL (CDN, real network)

---

> This standard complements `sites/WEBSITE-QUALITY-CHECKLIST.md` (per-site launch gate),
> `tasks/template-restart-checklist.md` (ordered fork-kickoff sequence including owner inputs),
> and the `launch-checklist` + `manage-seo` skills (deployment tooling).
> When they conflict, this document wins — it reflects the current template's capabilities.
