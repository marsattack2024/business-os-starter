---
name: vercel
description: Vercel and Next.js docs-first pointer for deploys, App Router, functions, caching, and env vars. Use with launch-a-small-app when the owner explicitly chose Vercel. Never create a Vercel project or deploy until asked.
---

# Vercel / Next.js (lean pointer)

Docs-first umbrella for Vercel platform topics. No copied stale tutorials — fetch
current docs when you need depth. Mac and Windows both use the Vercel CLI when
installed during setup.

## When to use

Deploying to Vercel; Next.js App Router; serverless/edge functions; caching /
ISR; environment variables; Turbopack; AI SDK on Vercel.

## Prefer repo skills first

- Website word/look edits → `update-website` (local `site/`, not a deploy)
- Promoting a proven app → `launch-a-small-app` (hosting decision + authority)
- Database / Auth → `neon` (backend is separate from the frontend host)

This skill is the generic Vercel/Next docs fallback.

## Hard rules

1. Fetch current docs; do not invent CLI flags.
2. Do not run `vercel` link/deploy/project-create until the owner authorizes that
   named step for a reviewed deployable directory.
3. Never upload the repository root (it contains private `context/`, `work/`,
   and credentials). Public hosts may only receive a checked deployable artifact.
4. Vercel Hobby personal/non-commercial terms may not fit a business site —
   recheck current terms before recommending it as default.

## Canonical docs

- Vercel platform — https://vercel.com/docs
- Vercel CLI — https://vercel.com/docs/cli
- Next.js App Router — https://nextjs.org/docs
- Functions — https://vercel.com/docs/functions
- Environment variables — https://vercel.com/docs/projects/environment-variables

## Capability

CLI for deploys when authorized. If a Vercel MCP/connector is signed in, use it
for read-only project/deployment discovery first; mutate only with explicit
authority.
