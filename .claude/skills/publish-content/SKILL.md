---
name: publish-content
description: Use when the owner explicitly asks to publish an approved blog post or remove a public post from their website.
---

# Publish Content

Publishing is a deliberate boundary: drafts live in `content/`; only approved
website posts live in `site/content/`. Never infer approval from a draft being
complete, polished, or marked ready.

## Publish one approved draft

1. Confirm the owner explicitly approved the exact source file in `content/`.
   If the request is ambiguous, show the draft and ask which filename to
   publish.
2. Read `context/rules.md`, the source draft, and its frontmatter. Do not
   publish facts, offers, contact details, or claims that are unsupported or
   forbidden by the rules.
3. Copy only that one Markdown file to `site/content/` with the same filename.
   Set `published: true` in the **public copy**. Keep the source draft in
   `content/` as `published: false`.
4. Run `cd site && npm run build`. If it fails, fix or revert the public copy;
   do not hand off a broken build.
5. Report the public URL (`/blog/<filename-without-.md>`) and the exact public
   file. This prepares a publishable site change; it does **not** deploy,
   publish externally, or make any provider write.

## Remove a public post

When the owner explicitly asks to remove a post, change `published: true` to
`published: false` only in its `site/content/` copy, run the build, and retain
the private source draft.

## Done when

- The response names the exact approved draft and public-copy paths.
- Exactly one public post changed under `site/content/`.
- `npm run build` passes inside `site/`.
- No deployment command, provider action, or other draft was touched.
