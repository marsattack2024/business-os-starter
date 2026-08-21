---
name: update-website
description: Change the owner's website from a plain-language request. Use for words, brand details, page sections, layout, or public content in the new-build site.
---

# Update the Website

The owner says what they need in ordinary language. Make the smallest truthful
change in `site/` that fulfills it.

## Read first

- `context/rules.md` before touching a public claim, offer, testimonial, or contact path.
- `context/voice.md`, `context/offer.md`, and `context/customers.md` before writing customer-facing copy.
- `site/CLAUDE.md`, `site/package.json`, and the exact public surface being changed.

## Find the right owner

- Brand name, navigation, booking CTA, business details, images, and site-wide metadata: `site/lib/site.config.tsx`.
- Reusable proof, FAQs, process, contact-form copy, and page section data: `site/lib/content.config.ts`.
- Homepage and route composition: `site/app/(site)/` and `site/components/`.
- Blog posts: `site/content/blog/*.mdx`; private drafts remain in the repository-root `content/` folder until explicitly approved.
- Colors, spacing, and typography tokens: `site/app/globals.css`.

Do not replace a shared component with copy-pasted page markup. Reuse the existing
section and layout components whenever they fit the request.

## Steps

1. Identify the smallest appropriate content, configuration, or component owner.
2. Make only source-backed claims. If the required fact is not in `context/` or approved source material, ask the owner.
3. For open design choices, use `.claude/skills/live-preview-tweaks/SKILL.md` rather than guessing a direction.
4. Run the proportionate checks from `site/package.json`. A configuration or copy-only change needs `npm run content:qa` and `npm run build`; component, route, or form changes also need `npm run typecheck`.
5. State the changed file, the check run, and any remaining public-review or deployment step in plain language.

## Boundaries

- The root `context/`, root `content/`, `work/`, and `inbox/` folders are private and must never be imported into public site code or a deployment.
- A successful build prepares a website change; it does not publish or deploy it.
- Do not invent testimonials, prices, availability, outcomes, credentials, or legal/medical claims.
