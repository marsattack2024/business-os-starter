---
name: neon
description: Neon Postgres and Auth docs-first pointer for Business OS apps. Use when the owner asks about Neon, a database, Neon Auth, branches, or connecting a backend after launch-a-small-app. Never create a project or database until the owner explicitly asks.
---

# Neon (lean pointer)

This skill is the project-local Neon counterpart to `vercel`: docs first, no
copied stale tutorials, no silent cloud mutations.

Business OS prefers Neon when a **proven** application truly needs structured
runtime data or user accounts. Ordinary website edits, static pages, and local
prototypes do not need Neon. Read `connections/neon.md` and follow
`launch-a-small-app` for the promotion decision.

## When to use

- Choosing whether an app needs Postgres or Auth
- Connecting the Neon CLI after the owner approved a backend
- Branching, schema planning, or Neon Auth setup questions
- Mac or Windows setup that mentions `neon auth --keyring`

## Hard rules

1. **Docs first.** Fetch current pages; do not invent CLI flags from memory.
2. **No silent create.** Do not run `neon projects create`, provision Auth, apply
   migrations, or write connection strings until the owner authorizes that named
   step.
3. **No credentials in chat or Git.** Keep `.env` / connection URLs local and
   ignored. Never paste database URLs or API keys into skills, commits, or the
   owner's message history as a convenience.
4. **Keyring auth.** Prefer the current Neon CLI browser/login flow
   (`neon auth` with keyring support on the owner's OS). Do not invent tokens.
5. **Frontend stays separate.** Neon is the backend. Public hosting remains a
   separate host decision (see `launch-a-small-app` and `vercel`).

## Canonical docs — fetch on demand

- Plans and Free limits — https://neon.com/pricing
- Neon Auth — https://neon.com/docs/auth/overview
- Neon CLI — https://neon.com/cli
- Agent guidance — https://neon.com/docs/ai/agent-skills
- Project connection notes in this repo — `connections/neon.md`

## Prove a connection

Use the smallest read-only check that names the selected project and branch
without printing secrets. A live app is not proven until the deployed revision
can complete the intended data or auth journey and the rollback path is known.

## Related skills

- `prototype-an-idea` — local disposable demo before any cloud backend
- `launch-a-small-app` — owns the decision to promote and whether Neon is needed
- `vercel` — frontend host / Next.js docs pointer when Vercel is in play
