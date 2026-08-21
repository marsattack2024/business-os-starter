# new-build visual unset 10/10 — North Star Anchor

**This file is law.** Re-read Goal + Rubric + Ledger before every work item.

- **Mode:** new-feature
- **Loop status:** DONE
- **Scope revision:** R1
- **Branch / worktree:** `claude/new-build-visual-unset` at repo root
- **Base SHA / current HEAD:** `origin/main` / (see git)
- **PR:** [#604](https://github.com/tdmshq/agencyOS/pull/604)
- **Prior loop state:** fresh
- **Ledger of record:** this file
- **Surface:** `templates/new-build` visual defaults (tokens, fonts, OG colors, themes, default homepage composition, fork docs). Not `sites/*` client forks.

## Goal

A fresh fork of `templates/new-build` looks structurally complete but visually undecided until intake picks a palette pack and type direction. SEO, quiz, lead paths, schema, blog/MDX, and AEO stay fully wired.

## Context pack

Checked: `app/globals.css`, `app/layout.tsx`, `lib/og-colors.ts`, `lib/themes/*`, `app/(site)/page.tsx`, TEMPLATE-STANDARDS, template-restart-checklist, ten-out-of-ten #602.

In scope: unset cream/gold/Playfair defaults; named palette packs; demote WhyBook from default homepage; fork docs gate.

Out of scope: Mayberry/Wendy/SteinArt rewrites; Molly GSAP port; Reference Room catalog cards.

| Assumption | Status | Evidence |
|---|---|---|
| Client sites are independent copies of template | verified | `sites/*` not symlinked to template CSS |
| OG colors must stay in sync with primitives | verified | `lib/og-colors.ts` header |
| WhyBook component can remain for optional import | verified | only default `page.tsx` composition changes |

## Surface profiles

| Profile | Applies | Minimum proof before GREEN | Currently available? |
|---|---|---|---|
| Visible template UI | yes | build + token/font grep + homepage WhyBook absent | yes |
| Skill/docs workflow | yes | restart checklist + themes README pack gate | yes |
| Quiz/inquiry path | yes | routes still present; build green | yes |
| Client/accountability data | no | — | — |

## Premise + blast radius

- **Verdict:** REFRAME — template defaults were an accidental brand (cream+gold+Playfair), not a neutral scaffold.
- **Blast radius:** `templates/new-build` only. Existing forks keep their own tokens.
- **Operating-model placement:** agents + humans at fork time must choose a pack before launch.

## Rubric (binary done-test)

| ID | Line | Status |
|---|---|---|
| R1 | Scaffold primitives have no gold/taupe brand accent | GREEN_PROVEN |
| R2 | Default fonts are not Playfair + DM Sans | GREEN_PROVEN |
| R3 | `lib/og-colors.ts` matches scaffold hexes | GREEN_PROVEN |
| R4 | ≥3 named palette packs; warm-atelier is a pack not default | GREEN_PROVEN |
| R5 | Fork docs require pack + composition north star before launch | GREEN_PROVEN |
| R6 | Default homepage does not mount WhyBook | GREEN_PROVEN |
| R7 | `npm test` + `npm run build` green in template | GREEN_PROVEN |
| R8 | Quiz + inquiry route files still present | GREEN_PROVEN |
| R9 | No edits under `sites/mayberry-and-stone`, `grateful-goddess-boudoir`, `steinart` | GREEN_PROVEN |

## Stop conditions

- GREEN when R1–R9 proven.
- After 2 failed quiz/SEO fix attempts, restore wiring and keep visual unset.
- Do not expand into Molly component port in this PR.

## Ledger

| Date | Item | Result |
|---|---|---|
| 2026-07-29 | Anchor created | done |
| 2026-07-29 | Unset tokens/fonts/OG + packs | done |
| 2026-07-29 | Homepage + docs | done |
| 2026-07-29 | `npm test` 114 pass + `npm run build` green | done |
| 2026-07-29 | PR #604 | done |
