---
name: publish-content
description: Use when the owner explicitly asks to publish an approved blog post or remove a public post from the new-build website.
---

# Publish Content

Publishing is a deliberate boundary. Root `content/` holds private drafts;
only an explicitly approved public copy belongs in `site/content/blog/`.

## Publish one approved draft

1. Confirm the owner approved the exact source draft. Never infer approval from a polished draft.
2. Read `context/rules.md`, the draft, and its supporting sources. Do not publish unsupported claims, contact details, or offers.
3. Create one public `site/content/blog/<slug>.mdx` copy. It must use valid frontmatter: `title`, `slug`, and a `YYYY-MM-DD` `date`; use `status: draft` until the owner authorizes public visibility. Add author, excerpt, category, tags, cover image, and cover alt text when available.
4. When the owner explicitly authorizes publishing, set `status: published` in that public MDX file. Keep the root source draft private.
5. Run `cd site && npm run content:qa && npm run build`. If either check fails, fix the public copy or return it to draft status.
6. Report the prepared URL (`/blog/<slug>`) and exact public file. This creates a reviewable site change; deployment remains a separate explicit request.

## Remove a public post

Set only that post's public `status: draft`, run `npm run content:qa` and `npm run build` in `site/`, and retain the root private draft.

## Done when

- One explicitly approved public MDX file changed under `site/content/blog/`.
- The root private draft remains private.
- Content QA and the production build pass.
- No deployment command or other provider action was taken.
