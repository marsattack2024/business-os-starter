# Lessons Learned

Short rules discovered through real project bugs or user corrections. Keep this
file lean: only record things future agents cannot reliably infer from the
current codebase, package files, or official docs.

- **This is a Next.js App Router template** — Ignore old React Router/Vite
  assumptions; verify framework behavior from the current code and official docs.
- **Shared skills live in `.claude/skills`** — `.agents/skills` and
  `.codex/skills` are symlinks, so update the Claude base folder instead of
  maintaining separate copies.
- **Use current docs for unstable platform behavior** — Do not rely on memory for
  Next.js, React, Tailwind, Vercel/hosting, Framer Motion, Google Ads,
  Typeform, or tracking behavior.
- **Above the fold has to do the selling work** — The hero cannot merely be
  beautiful; it must state location, service/genre, buyer, outcome, CTA, and use
  the most tone-setting image available. Add verified proof within the first
  supporting sections.
- **Curate galleries down, not up** — A smaller set of excellent images is more
  premium than a larger gallery with filler, duplicate looks, or weak crops.
- **Do not build while dev is serving the same site** — For Next.js previews,
  `next build` can stale the active dev server's `.next` chunks. Stop dev,
  clear/restart, and retest before treating the browser error as a code bug.
- **Vercel Ready is not live proof** — For new Vercel projects, confirm the
  project is configured as Next.js with the default output directory, avoid
  optional request interception runtime, and verify deployed HTTP 200 responses for `/`,
  `/md`, and a real image asset.
- **Dark sections need on-dark tokens** — Do not reuse `--color-accent-text`
  for small labels or buttons on `--color-ink`. Use `--color-on-dark-*` tokens
  so eyebrows, body copy, and CTAs remain readable.
- **Committed symlinks must be portable** — Site/template scaffolds should use
  relative symlinks and keep generated folders ignored so a branch works on
  another machine and does not carry local build artifacts.
- **Lessons must earn their place** — Add only lessons from real bugs,
  corrections, or failed assumptions that are still true and not obvious from
  reading the repo.
- **Homepage composition is a contract, not a suggestion** — SteinArt 2026-07:
  stacking Empathy + TestimonialCards + Process as cream, putting gallery late,
  and splitting Contact / ImageQuote / FAQ / Urgency produced a mush page that
  failed cold review. Keep the plane map comment in `app/(site)/page.tsx`
  accurate; use Contact `flushBottom` + FAQ `continueFromAbove` for one close
  chapter; put gallery before process; put urgency before inquire. Missing
  quote/product assets: hide the slot and ask for real files — never invent.
