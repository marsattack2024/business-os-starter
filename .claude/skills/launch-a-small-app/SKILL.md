---
name: launch-a-small-app
description: Prepare and deliberately publish a validated small app when the owner explicitly asks to share it or make it live. Use after local prototyping or building, not for an exploratory prototype or an ordinary website edit.
---

# Launch a Small App

Promote the smallest version already proven locally. A request to prototype or
build does not authorize a public deployment; use this skill only after the
owner explicitly asks to share or launch the result.

## Decide what the app actually needs

Read `context/rules.md`, the relevant business context, the app source, and its
latest local proof. Confirm who may use it and whether this is a private
preview, a public preview, or production for the business.

If the app may need saved data, accounts, uploads, or backend functions, read
`connections/neon.md` before choosing or connecting a backend.

Choose each layer independently and omit every layer the real journey does not
need:

| Layer | Starting point |
|---|---|
| Public frontend | For a proven static-export artifact, prefer a reviewed [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/). Dynamic rendering needs a compatible runtime and a fresh limits check. |
| Structured relational runtime data | Evaluate [Neon Postgres](https://neon.com/pricing) first. Do not use a database for repository documents or ordinary static content. |
| User accounts | Evaluate Neon Auth with the database. Authentication is still separate from authorization and tenant isolation. |
| User-uploaded files | Keep shipped public assets with the frontend. Evaluate Neon Object Storage only after confirming its current availability, region, and production status; otherwise compare the smallest necessary storage alternative. |
| Backend functions | Use the chosen frontend runtime when it fits. Evaluate Neon Functions only after confirming its current availability, region, and production status. |
| Personal, non-commercial preview | [Vercel Hobby](https://vercel.com/docs/plans/hobby) may fit. It must not be presented as free commercial production hosting for the owner's business. |

Neon-first does not mean Neon-always. A static app needs no database, and an app
without users needs no authentication. Neon supplies backend capabilities, not
the public frontend host. Do not install Neon, Cloudflare, Vercel, Supabase, or
another provider's SDK until the chosen architecture actually needs it. Prefer
current official documentation over remembered CLI commands; provider setup
and free limits change.

"Static" is a build fact, not a visual description. Direct upload is allowed
only when the framework is deliberately configured for static export and the
production build emits a reviewed static artifact. A normal Next.js `.next`
directory is not that artifact. Server rendering, API routes, middleware, or
other runtime behavior require a host that supports that behavior; do not
silently remove features merely to fit a free static host. Check the current
[Next.js static export contract](https://nextjs.org/docs/app/guides/static-exports)
before making the choice.

Files in `context/`, `content/`, `work/`, and `inbox/` are already persistent
private records. Do not copy or sync them into Neon merely to make them
"persistent." Before putting regulated, confidential, health, financial, or
client data in any free cloud service, verify that the current plan's security,
recovery window, support, availability, and contractual terms fit that data.
If they do not, stop and explain the paid or different control that is needed.

## Prepare before touching a provider

1. Show the owner a short launch note: what is going live, who can access it,
   the proposed host, whether Neon is needed, the current free-plan boundary,
   and how to remove or roll it back.
2. Make the local application production-shaped for the stated journey. Keep
   secrets server-side and out of Git. If data or accounts are needed, define
   authorization, tenant boundaries, retention, and an unauthorized-use test;
   a login screen alone is not access control.
3. Define the deployment boundary. Never connect or upload this entire private
   Business OS repository to a host. Deploy only a reviewed app directory or
   build artifact that excludes `context/`, private root `content/`, `work/`,
   `inbox/`, Git history, local environment files, and unrelated business
   records. Prefer direct upload of a reviewed static artifact. If the provider
   needs Git access or the app is independently maintained, use a dedicated app
   repository containing only that deployable source.
4. Run the app's current build and focused tests. Exercise the main journey and
   one failure or misuse case locally. Work inside the existing `site/` must
   pass this repository's `npm run check`; a dedicated app repository must own
   an equivalent check before launch. Inspect the resulting build or trace and
   prove that no private repository path entered it. Do not use made-up
   production records as proof.

Starting this skill does not authorize account or billing changes. The owner
must sign in and explicitly choose or approve the provider account, project,
region, plan, database, environment targets, domain or DNS change, and
production deployment. Never paste credentials into chat or commit an `.env`
file. Prepare the work and pause at the first owner-held action that has not
already been authorized.

## Preview, verify, then produce

Use a preview before production whenever the provider supports one. Verify the
exact revision and public URL, the primary journey, and any protected route or
data boundary. A provider saying "deployed" is not proof that the journey
works.

Before production, identify the exact preview being promoted and get explicit
owner approval for that deployment. Afterward, copy
`connections/deployments/_template.md` to a named record and fill in the
provider, project, region, plan, repository or artifact boundary, URL, deployed
revision, verification time and result, and rollback route without copying
secrets.

For Neon project and branch management, use its current [CLI documentation](https://neon.com/cli)
only after the owner has authenticated and authorized the exact mutation.

## Done when

- The app was locally proven before any provider mutation.
- The owner approved every account, plan, project, environment, domain, and
  production decision that applied.
- The deployed revision and real journey were verified separately.
- The owner has a plain-language record of where it lives and how to roll back.
