# Template Restart Checklist

When forking this template for a new client, work top-to-bottom. Generic defaults ship with the template — every item below is something that **must be replaced** before launch, or the site will publicly advertise the wrong brand to humans, search engines, and AI agents.

## 0. Owner inputs to collect FIRST

Send this as a **single upfront ask** before touching any config or copy. Every
item below gates a schema field, a JSON-LD guard, or a `content:qa:launch` check
— missing any one of them means the build will either fail CI or ship a
placeholder claim to search engines and AI crawlers.

| Input | Where it lands | Notes |
|---|---|---|
| **Service areas** (list of cities + states served) | `brand.serviceAreas` → `areaServed` in JSON-LD + footer copy | For travel/mobile photographers, list every market. |
| **Studio hours** (days + open/close times, or "by appointment") | `openingHoursSpecification` in LocalBusiness JSON-LD | "By appointment" is valid — just fill the field so schema isn't blank. |
| **Price band** (e.g. "$1,500–$3,000", "starting at $1,200", or a tier label) | `brand.priceRange` → JSON-LD `priceRange` | Client-approved wording — don't invent. |
| **Address privacy decision** | `brand.location` (city + state only, OR full street address) | Boudoir, in-home, and mobile photographers use city-only. Studio photographers use full address. Confirm explicitly — wrong choice publishes a home address or omits a studio from maps. |
| **Phone + email: publish on site or form-only?** | `brand.phone`, `brand.email` (blank = form-only, nothing renders) | Some clients prefer inquiry-form-only contact. Blank fields are safe; placeholders are not. |
| **Real review counts, star ratings, and any awards / press mentions** | `content/proof-map.json` + `aggregateRating` in JSON-LD | Fabricated or estimated numbers fail the launch QA gate and risk a Google rich-result penalty. Provide the real platform + count (e.g. "47 Google reviews, 4.9 stars"). |
| **AI bot policy** | `siteConfig.seo.aiBotPolicy` | Default (allow search bots, block training bots) is correct for most clients. Confirm if the client has a strong opinion. |

Once you have all seven answers, proceed to Section 1.

## 0b. Visual direction (required before launch)

The template scaffold is **visually unset** (achromatic tokens + Source Serif/Sans).
Do not launch a named brand on the scaffold defaults.

- [ ] Pick a palette pack from `lib/themes/` (`warm-atelier` | `cool-gallery` |
      `ink-paper`) **or** measure client brand tokens into `app/globals.css`
- [ ] Sync `lib/og-colors.ts` hexes to the chosen primitives
- [ ] Confirm type direction (`app/layout.tsx`) — keep Source pair or swap
- [ ] Name a composition north star (Molly `sections-editorial` / client live
      site / Reference Room lesson) so the page does not stay template-assembled
- [ ] Confirm default homepage still fits (WhyBook is off by default; add only
      if one unique beat remains)

## 1. Brand & contact

- [ ] `lib/site.config.tsx` — `brand.name`, `brand.tagline`, `brand.phone`, `brand.email`, `brand.location`
- [ ] `lib/site.config.tsx` — `brand.photographer` (the "Meet" section name — falls back to `brand.name`), `brand.category` (niche, drives OG eyebrow + agent descriptors), `brand.priceRange`
- [ ] `lib/site.config.tsx` — `seo.baseUrl` (canonical, no trailing slash)
- [ ] `lib/site.config.tsx` — `seo.description` (≤ 160 chars, used by meta + LLM surfaces)
- [ ] `lib/site.config.tsx` — `socials[]`, `footerLinks[]`
- [ ] `lib/site.config.tsx` — `seo.aiBotPolicy` (default: allow search, block training — confirm per client)
- [ ] `lib/site.config.tsx` — add legal footer links only after approved legal pages exist

## 2. Content

- [ ] `lib/content.config.ts` — `processSteps`, `includesItems`, `whyBookReasons`, `faqs`, testimonials
- [ ] `lib/llms/content.ts` — verify the LLM summary still reads correctly with the new brand values (most fields are pulled from `siteConfig` automatically; check any hardcoded phrasing)
- [ ] Hero, About, image-quote copy across `components/sections/`
- [ ] `content/proof-map.example.json` — copy to `content/proof-map.json` and source-map every review count, rating, award, guarantee, years-in-business, "featured", and testimonial claim
- [ ] `content/pages/*.mdx` — set `status: "indexable"` only after migration, proof, legal, redirect, and image decisions are complete; use `noindex` for intentionally public utility pages
- [ ] `content/blog/*.mdx` — posts need `title`, `slug`, `date` (YYYY-MM-DD) or the build fails; use `status: draft` to stage a post and a future `date` to schedule one. `/blog`, the nav "Journal" link, sitemap, and llms.txt stay hidden until ≥1 published post exists.
- [ ] Run a read-aloud human-writing edit across page, blog, metadata, and
      agent-readable copy: preserve client-specific facts, remove canned
      contrast formulas and vague transformation filler, vary sentence rhythm,
      and use natural punctuation. `npm run content:qa` hard-fails em-dash
      characters and entities but does not replace editorial judgment.

## 3. Assets

- [ ] Replace everything under `/public/` with client images (WebP preferred)
- [ ] Update `imageSrc` / `imageAlt` references in `siteConfig.images`
- [ ] Update `siteConfig.hero.imagePositionMobile` and `siteConfig.hero.imagePositionDesktop` for the chosen hero crop
- [ ] Confirm `/public/favicon.ico`, `/public/apple-touch-icon.png`, OG image source
- [ ] Run the asset check through `npm run content:qa:launch` before deploy

## 4. Environment variables (Vercel)

- [ ] `NEXT_PUBLIC_SITE_URL` — production canonical
- [ ] `NEXT_PUBLIC_SITE_NAME`
- [ ] `GHL_PIT_TOKEN`, `GHL_LOCATION_ID` — contact form CRM
- [ ] `NEXT_PUBLIC_GTM_ID` and/or `NEXT_PUBLIC_GA_ID` — analytics

## 5. Agent / AEO surfaces — verify after content edits

These are auto-generated from `siteConfig`, but check each renders the new client's brand before launch:

- [ ] `lib/public-routes.ts` route inventory reflects the public routes added by this fork
- [ ] `/llms.txt` — brand name, canonical URLs, contact path, API endpoint
- [ ] `/llms-full.txt` — full page summaries
- [ ] `/robots.txt` — AI bot policy reflects `aiBotPolicy` setting
- [ ] `/sitemap.xml` — every public route present, no dev/preview URLs
- [ ] `/api/openapi.json` — `info.title`, `servers[0].url` point at client domain
- [ ] `/.well-known/agent.json` — brand name + endpoints
- [ ] `/.well-known/agents.json` — agent label
- [ ] `/.well-known/mcp/server-card.json` — `serverInfo.description` reads naturally with client brand
- [ ] `/.well-known/api-catalog` — anchor URL matches production base
- [ ] `/md`, `/md/thank-you`, `/md/blog/{slug}`, and `/md/{page-slug}` — markdown views render for every intentional public route

### Quick verification one-liner (after `npm run dev`):

```bash
for path in /llms.txt /robots.txt /sitemap.xml /api/openapi.json \
  /.well-known/agent.json /.well-known/agents.json \
  /.well-known/mcp/server-card.json /.well-known/api-catalog \
  /md /md/thank-you; do
  echo "=== $path ==="
  curl -s -o /dev/null -w "%{http_code}  %{content_type}\n" \
    "http://localhost:3000$path"
done
```

Every line should be `200`. Spot-check the bodies of `agent.json` and `llms.txt` for the right brand name.

## 6. Markdown views and migration status

The template serves markdown views directly at `/md/[slug]`. Only registered slugs return content. Do not add proxy behavior only for markdown convenience; it creates a request interception runtime by default.

- [ ] If new static HTML routes are added (about, services, galleries, contact), add matching entries to `lib/public-routes.ts` and matching builders in `lib/llms/page-markdown.ts`
- [ ] If migrated MDX pages are added, set their frontmatter `status` explicitly: `draft`, `indexable`, `noindex`, `redirect`, or `retired`

```bash
# Verify direct markdown routes work against the running dev server:
curl -sI http://localhost:3000/md | grep -i content-type
# → content-type: text/markdown; charset=utf-8
```

## 7. Pre-launch

- [ ] `npm run content:qa` clean in template mode
- [ ] `npm run content:qa:launch` clean after replacing placeholders, proof, legal, images, domains, and client copy
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run audit` clean for high/critical issues
- [ ] `npm run verify` clean
- [ ] With local or live URL running: `SITE_SMOKE_BASE_URL=<url> npm run smoke:routes`
- [ ] If deploying on a newly-created Vercel project, confirm Framework Preset is `Next.js` and Output Directory is the Next.js default/blank, not `public` or `.`
- [ ] Live URL smoke test returns 200 for `/`, `/md`, and one real image asset
- [ ] Submit inquiry through the live form → confirm row lands in CRM
- [ ] Submit inquiry via `POST /api/v1/inquiry` with a test payload → same
- [ ] Lighthouse / visual QA pass
