# Agency OS Production Architecture Plan

Date: 2026-05-27  
Status: Planning artifact, not approved for implementation  
Owner: Humberto Garcia  
Source context: user PRD v2.0, `new-build` repo inspection, Google Drive folder inventory, Notion 60-day sprint template inspection, current docs checks

## Executive Decision

Agency OS should be built around a new guarded agency workspace repo. The repo is the employee-facing workspace: one GitHub repo, one Codex starting point, one searchable history, with strict folder lanes for client work, knowledge, skills, optional client sites, templates, and internal automation.

The correction from the first draft: the plan source belongs here, not inside the P2P app or website. The P2P SaaS app and P2P main website do **not** move into this agency workspace repo. This Agency OS initiative starts from the client-build operating system around `new-build`, Google Drive, Notion, skills, and Codex.

The second correction: "one place for employees" should now mean one controlled GitHub monorepo, not a loose local folder with many hidden nested repos. Independent nested repos are easier at first, but they create invisible drift: client status, website code, approvals, and knowledge updates can quietly diverge. A controlled monorepo makes drift visible in one PR system and one history.

The operating model is one agency workspace repo containing agency delivery lanes, plus external product repos that integrate through controlled interfaces:

| Lane | Role | Boundary |
| --- | --- | --- |
| `templates/new-build` | Forkable photographer website template | Template maintainers only; client sites inherit patterns from here |
| `sites/*` | Client website and landing-page builds | Only created for clients who need deployable web work |
| `apps/agency-os` | Thin internal automation/control layer | RAG sync, client ops helpers, review queues, Slack/reporting, ads approvals, skill governance |
| `clients/*` | Day-to-day client operations | Default lane for copywriters, designers, account managers, and Codex work |
| `knowledge/*` | Drive/Notion manifests and RAG staging | Tracks what sources exist and how they map into skills/RAG |
| `.claude/skills` | Shared Claude/Codex skills | Authored agency brain; Codex/Agents mirrors link here where needed |
| P2P SaaS / P2P website | Out of scope for this repo | Separate product repos; do not include in agency workspace |

This keeps the employee experience simple without stuffing unrelated product apps into the agency workspace. The repo is only safe if CODEOWNERS, branch protection, path-aware CI, per-project secrets, and folder-specific agent instructions are treated as product infrastructure.

The immediate goal is not to build the whole platform. The immediate goal is to transfer Humberto's delivery reflexes into composed workflows that employees can run safely.

North Star:

> An employee opens Codex in the agency workspace, chooses an assigned client, asks for a deliverable, and the system handles skill selection, client context, approved knowledge, draft destination, and handoff routing.

Definition of done:

> Agency OS is operational when a non-technical employee can independently deliver a full new-client engagement matching Humberto's delivery standard, with Humberto's involvement limited to approval.

Molly Seattle is the eventual proof case for the deeper launch pipeline, but employee onboarding should begin before that. The first onboarding version should teach employees how to work in the repo, use the existing skills, save outputs in the right client lane, and hand off work safely.

### Skill Source Of Truth

For the agency workspace repo, the authored skill source is:

```text
/Users/Humberto/Documents/GitHub/0000. Agency OS/.claude/skills/
```

Do not start with `packages/skills` unless there is a concrete need to publish or share the skills outside the workspace. Claude-side authored skills remain canonical. Codex/Agents mirrors may symlink to the authored source, but system/plugin/Codex-only skill roots must not be overwritten wholesale.

Rule:

- `.claude/skills/**` = authored agency skills.
- `.agents/skills/**` or `.codex/skills/**` = mirrors/symlinks where needed.
- App/site-specific instructions live in local `AGENTS.md` / `CLAUDE.md`, not in separate duplicate skill copies.

Runtime-change insurance:

- Skill content stays as plain Markdown and local reference files.
- Composed workflow orchestration that needs state, APIs, retries, or permissions lives in TypeScript under `apps/agency-os`.
- Claude Code, Codex, MCP, and provider-specific patterns are wrapped behind local adapters.
- If an agent runtime changes, the agency keeps the skill corpus, client folders, knowledge files, and TypeScript orchestration logic.

### Execution Target

Execution target is a new repo, not `new-build/agency-workspace`.

```text
Local root: /Users/Humberto/Documents/GitHub/0000. Agency OS
GitHub repo: agency-workspace
Purpose: employee-facing agency operating workspace
```

`new-build` remains the reusable website template. Planning artifacts can live here until the new repo exists, but employees should not be onboarded into this `new-build` checkout because its project instructions are template-specific and have known Supabase/GHL documentation drift.

## Repo Topology Decision

Use a controlled monorepo with lanes.

Shape:

```text
agency/
  AGENTS.md
  CLAUDE.md
  .github/
    CODEOWNERS
    workflows/
  apps/
    agency-os/
  templates/
    new-build/
  sites/
    studio-acme/
    studio-beta/
  clients/
    studio-acme/
    studio-beta/
  knowledge/
    manifests/
    summaries/
  .claude/
    skills/
  packages/
    config/
```

This is cleaner long-term than ignored nested repos, but only if path governance is treated as product infrastructure.

Inside it, each area has a demarcation:

| Area | Who uses it | Git model | Purpose |
| --- | --- | --- | --- |
| `clients/` | Everyone | tracked by monorepo | Client briefs, sprint, outputs, standups |
| `knowledge/` | Agents/managers | tracked manifests, exported corpus can be ignored or separately stored | Drive/Notion source inventory and RAG staging |
| `.claude/skills/` | Everyone through Codex/Claude | tracked authored skill source | Agency brain and workflows |
| `templates/new-build/` | Power users/devs | tracked monorepo app/template | Reusable site template |
| `sites/*` | Trained operators/devs | tracked monorepo apps | Actual client websites/landing pages |
| `apps/agency-os/` | Devs | tracked monorepo app | Internal app/MCP/RAG control plane |
| `packages/config/` | Devs | tracked shared package | Shared lint/ts/tailwind/build conventions |
| P2P SaaS / P2P main website | Devs | separate repos | Explicitly out of scope for this workspace |

P2P data access is out of scope for the first Agency OS build. If needed later, Agency OS may read P2P data through a read-only integration or MCP tool, but it should not import the P2P app, P2P website, or P2P product code into this repo.

The monorepo should still ignore generated/heavy/local artifacts:

```gitignore
knowledge/exports/
knowledge/raw/
knowledge/chunks/
.env*
node_modules/
.next/
dist/
```

This gives one visible home and one GitHub repo, while keeping build/deploy boundaries path-based:

- Vercel supports multiple projects from one repository by setting each Vercel Project's root directory to a subfolder.
- GitHub CODEOWNERS and branch protection can require different reviewers by path.
- CI can be path-aware so a copy change under `clients/**` does not rebuild every website.
- Codex can operate from one root while the workspace contract limits allowed write paths.
- Turborepo can be added later if build noise appears; it is not part of the governance decision.

Submodules are not the default. They are technically precise, but too confusing for a non-technical agency team.

### Final Decision For Team Presentation

Use a controlled monorepo.

The one-liner for the team:

> Everyone opens one agency workspace repo in Codex. The repo has lanes for client work, knowledge, skills, templates, sites, and internal automation.

The operating promise:

- Copywriters and designers stay in `clients/**`, `knowledge/**`, and guided outputs.
- Trained operators can enter `sites/**` when applying approved landing-page/site work.
- Developers own `apps/**`, `templates/**`, provider integrations, migrations, and CI.
- Managers approve outputs, provider actions, and sensitive PRs.
- Agency OS watches the whole system and turns it into status, RAG, approvals, and reports.

## GitHub Operations Model

The source-control model is a guarded monorepo.

### Monorepo Ownership

Repo: `agency`

Tracks:

- `README.md`
- `AGENTS.md`
- root `.claude/skills/` as authored skill source, with generated links only for tool mirrors
- `clients/**`
- `knowledge/manifests/**`
- `knowledge/summaries/**`
- `docs/**`
- `apps/**`
- `sites/**`
- `templates/**`
- `packages/**`
- workspace scripts and checks

Why:

- Employees still have one folder to open in Codex.
- Client ops work is reviewable in one place.
- Site/app deployments still keep isolated Vercel projects, env vars, and domains through Vercel root-directory settings.
- Shared skills/references/config can be updated once and reviewed centrally.

Rules:

- Work in `clients/{client-id}` for strategy, copy, ads, design briefs, status, and approvals.
- Work in `sites/{client-id}` only when changing that client's deployed site.
- Work in `templates/new-build` only when improving the reusable template.
- Work in `apps/agency-os` only when building internal automation, Slack/email reporting, RAG sync, and controlled MCP/API helpers.
- Do not work on P2P SaaS or the P2P main website from this workspace repo.

Submodules are rejected for day one because detached states and update commands are too confusing for this team. Ignored nested repos are a fallback only if a specific client site must live outside the monorepo.

### Branch And Merge Policy

Root monorepo:

- `main` protected.
- Everyone can create branches and PRs.
- Only owner/manager/developer role can merge.
- CODEOWNERS required for:
  - `.claude/skills/**`
  - `AGENTS.md`
  - `docs/plans/**`
  - `knowledge/manifests/**`
- Copywriters/designers can PR changes under `clients/**`.
- Manager approval required before client-visible outputs become approved/final.
- Trained site operators can PR changes under assigned `sites/{client}/**`.
- Developers own `apps/**`, `templates/**`, shared packages, migrations, and provider adapters.

Suggested CODEOWNERS:

```text
/.github/                  @humberto @dev-leads
/AGENTS.md                 @humberto @dev-leads
/CLAUDE.md                 @humberto @dev-leads
/.claude/skills/**         @humberto @managers
/docs/plans/**             @humberto @managers
/knowledge/manifests/**    @humberto @managers
/clients/**                @managers
/templates/new-build/**    @humberto @template-maintainers
/sites/**                  @site-operators @dev-leads
/apps/agency-os/**         @dev-leads
```

Client site folders:

- PRs require build/typecheck and review.
- Production deploys only from protected branch or approved Vercel workflow.
- Client-specific env vars live in Vercel/project secrets, not parent workspace.

Agency OS internal automation lane:

- Product engineering rules only for the internal services that live here: migrations, RLS tests, auth checks, provider mocks, audit logs, and deployment gates.

### Deploy Model

Each deployable internal app/site in this workspace is a separate Vercel Project connected to the same GitHub repo with a different Root Directory.

| Vercel Project | Root Directory | Domain |
| --- | --- | --- |
| `agency-os` | `apps/agency-os` | `agency.yourdomain.com` |
| `new-build-template-preview` | `templates/new-build` | internal preview |
| `studio-acme` | `sites/studio-acme` | `acme.youragency.com` or client domain |
| `studio-beta` | `sites/studio-beta` | `beta.youragency.com` |

Vercel can skip unaffected projects in monorepos, but we should still add explicit ignored-build/path filters for cost and clarity.

Heavy site work happens inside the monorepo via worktrees or feature branches. A site operator creates an isolated branch/worktree, works in `sites/{client-id}/`, gets per-branch Vercel preview deploys, and merges through PR. Concurrent operators on different clients do not collide because lane ownership prevents shared file edits. Sites leave the monorepo only when the client owns the code, the stack diverges from the standard Next.js template, or asset weight is impractical for Git. In those cases, `site-pointer.yaml` records the external location while `clients/{id}/` remains the operational record in the monorepo.

Important deploy behavior:

- A commit to `clients/studio-acme/brief.md` should not build `sites/studio-acme`.
- A commit to `sites/studio-acme/**` should build only the Acme site and any shared packages it depends on.
- A commit to `.claude/skills/**` should run skill validation and Agency OS checks, but not deploy every client site.
- A commit to `packages/config/**` may affect multiple apps/sites and should run affected checks.

Each app/site owns:

- its own Vercel project
- its own env vars
- its own domains
- its own build command/root directory
- its own deployment approvals if needed

The monorepo owns:

- source code
- PR review
- shared packages
- shared skills/references
- cross-client operating records

### Database And Env Model

Do not share one `.env` across all apps.

Each app/site has its own env contract:

```text
apps/agency-os/.env.example
templates/new-build/.env.example
sites/studio-acme/.env.example
```

Production secrets live in the matching Vercel Project or chosen secret manager.

Database ownership:

| App/Site | Database |
| --- | --- |
| `apps/agency-os` | Neon/Postgres for app data, provider queues, employee API tokens, audit logs, and RAG |
| `templates/new-build` | no required runtime DB; optional starter Supabase migrations |
| `sites/{client}` | usually no DB; GHL and env-based config, optional client-specific Supabase only if needed |

Rule: shared packages may define types and helpers, but no shared package may silently read production env vars at import time. App boundaries own env loading.

### Agent Skills, Plugins, And MCP Resolution

This is the confusing part: folder location should change **context and allowed actions**, not randomly change which brain the employee has.

Recommended model:

1. Root `AGENTS.md` defines the universal Agency OS rules.
2. Root `.claude/skills` contains shared agency skills.
3. Each major sub-app can have a local `AGENTS.md` for app-specific constraints:
   - `apps/agency-os/AGENTS.md`
   - `templates/new-build/AGENTS.md`
   - `sites/{client}/AGENTS.md` only when needed
4. Codex starts from the root and resolves active context:
   - `active_surface: client`
   - `active_surface: client-site`
   - `active_surface: agency-os-app`
5. MCP servers are configured at the user/workspace level, but tool access is scoped by role/client/provider policy.

So if someone is in:

```text
clients/studio-acme/
```

they get shared agency skills plus client-lane constraints. They can draft copy, query RAG, publish Docs, append standup, and queue approvals.

If someone jumps into:

```text
sites/studio-acme/
```

they still have shared agency skills, but now `templates/new-build`/site-build rules apply: edit config, images, theme, run build, no unrelated client ops edits.

If someone jumps into:

```text
apps/agency-os/
```

they get product engineering rules: migrations, tests, auth, RLS, provider mocks, code review.

MCP/plugin access should not depend only on folder path. It should depend on:

- logged-in employee
- role
- assigned client
- active surface
- requested tool risk level

Example:

| Active Surface | Allowed By Default | Approval Required |
| --- | --- | --- |
| `clients/*` | query RAG, read Drive/Notion, draft Docs, append standup | send email, publish client-visible docs, queue ads |
| `sites/*` | edit site config/assets, run local checks | production deploy |
| `apps/agency-os` | local dev/test against sandbox env | production migration/provider mutation |

### CI Model

Use path-aware checks:

- Changes under `clients/**`: markdown/schema checks, no app build required.
- Changes under `knowledge/**`: manifest/schema checks, no app build required unless ingestion code changes.
- Changes under `.claude/skills/**`: skill validation, examples/evals.
- Changes under `sites/studio-acme/**`: build only `sites/studio-acme`.
- Changes under `apps/agency-os/**`: run Agency OS tests/build.
- Changes under shared `packages/**`: run all affected internal apps/sites.

The exact tooling can be pnpm workspaces, custom GitHub Actions with path filters, or Turborepo later if repeated builds become noisy or expensive.

Do not treat Turborepo as the governance mechanism. Governance is CODEOWNERS, branch protection, path-aware CI, and the Codex working-context contract.

## External Docs Checked

- Vercel monorepos: Vercel supports importing one Git repository multiple times with different Root Directories, and can skip unaffected projects in GitHub-connected monorepos.
- Vercel ignored build step: available for custom skip logic, but skipped builds initiated this way can still count differently than unaffected-project skipping.
- GitHub CODEOWNERS: code owners can be required through branch protection so path owners approve matching changes.
- Turborepo caching and affected runs: task outputs/logs can be cached, and affected-task runs can target changed packages and dependents.
- pnpm workspaces: a workspace is declared from the root with `pnpm-workspace.yaml`.

## Prior Art Gate

Before implementing any infrastructure surface, create a short prior-art note with the repo/link, decision, and reason. Do not build against memory.

Initial prior-art targets:

| Surface | Prior Art / Docs | Decision To Make |
| --- | --- | --- |
| MCP server/client | `modelcontextprotocol/typescript-sdk`: https://github.com/modelcontextprotocol/typescript-sdk | Reuse SDK patterns for tool schemas, auth wrapping, and server transport. |
| Slack bot/webhooks | `slackapi/bolt-js`: https://github.com/slackapi/bolt-js | Decide Bolt vs small HTTP route; copy signature verification and command/event patterns, not app structure wholesale. |
| Secret storage | Supabase Vault docs/repo: https://supabase.com/docs/guides/database/vault/ and https://github.com/supabase/vault | Decide Vault vs external secret manager before any OAuth token storage. |
| Worker/runtime | Vercel Cron, Supabase Edge Functions, Railway workers, or QStash | Choose per job type; document retry/idempotency behavior. |
| OAuth adapters | Provider official docs for Google Ads, Meta, Google Drive, Slack | Verify current API versions and token refresh rules before code. |
| RAG ingestion | Neon pgvector docs + current local knowledge inventory | Reuse retrieval ideas only after corpus curation; do not index raw Drive dumps. |

Every prior-art note must classify the example as:

- `reuse`: copy the pattern closely
- `reference`: learn from it, implement locally
- `ignore`: looked at and rejected, with reason

### Sync / Drift Management

In a monorepo, source drift is easier because all source lives in one history. Deployment drift still exists because Vercel projects and provider environments can differ.

Add a workspace status command:

```bash
./scripts/workspace-status.sh
```

It reports:

- current branch/status
- changed paths grouped by area
- affected apps/sites
- Vercel project/domain mappings
- missing env keys by app
- last successful deployment per app/site
- linked client id

Agency OS should surface the same data through Slack/email digests, MCP queries, and only a thin UI if a repeated workflow truly needs one.

The goal is not to force every site to deploy together. The goal is to make it obvious which app/site/client workspace is affected by a change.

## Current Reality Checks

### Confirmed

- `new-build` is already designed as a fork-per-client website template. Its README and code are config-first: `lib/site.config.tsx`, `lib/content.config.ts`, reusable sections, GHL inquiry flow, optional Supabase starter migrations, and public agent-readiness surfaces.
- `new-build` also has the right local skill source pattern for this initiative: `.claude/skills` is authored source, with `.agents/skills` and `.codex/skills` intended as mirrors/symlinks.
- `new-build` should not become the internal service/app. It lacks runtime auth, tenant model, RAG storage, employee workflow state, and reporting/automation primitives by design.
- Google Drive contains 39 source docs in the linked folder. These are the first RAG corpus and skill-reference source.
- Notion contains an existing "New Client - 60 Day Sprint Template" page inside a Master Task Board. It has embedded project-flow databases, milestone/progress/responsibility fields, onboarding/team information, and client FAQ/communication expectations. This should become the baseline client operating model, not be reinvented from scratch.
- Google Drive change tracking and push notification APIs exist and support a change-driven sync model, with polling as fallback.
- Neon supports Postgres plus pgvector for AI/vector workloads.
- Supabase RLS is the correct database-level boundary for employee/client access, with explicit policies and careful service-role handling.
- Claude Code supports MCP connections over HTTP/SSE-style external processes; remote MCP is a reasonable interface for controlled tools.
- Google Ads and Meta API version assumptions must not be pinned in this plan. Verify the current major/minor versions at implementation start because platform API versions change frequently.

### Wrong Or Risky Assumptions In The PRD

1. **"Agency OS is just a repo."**  
   The repo is the workspace, but Agency OS still needs internal services around it: auth or tokens, database tables, MCP/API helpers, background jobs, Slack/email reporting, audit logs, and approvals. This does not require a heavy dashboard on day one.

2. **"All creative and development work runs in terminal."**  
   Employees will primarily work in Codex/ChatGPT-style agent sessions, but the default project root should be the `agency` monorepo. Most non-technical work starts under `clients/{client-id}`. The Agency OS app supplies auth, MCP tools, RAG, status, approvals, and reporting around that workflow.

3. **"Every repo symlinks the same whole skills folder."**  
   The memory and repo guidance warn against broad skill-tree symlinks because repo-specific, Codex-only, system, and plugin skills can be overwritten or drift. Use an imported shared-skill pack plus repo-local skills, not a blanket replacement of every `.claude/skills` tree.

4. **"Everything must wait for the full platform."**  
   The user's quality bar is correct: no disposable MVPs. But delivery should be split into complete dependency nodes. A production-complete Knowledge and Copy Studio vertical can ship before ads push, as long as no half-built ads push is exposed.

## Product Architecture

### Reflex-Transfer Model

This system should be designed around composed delivery workflows, not isolated knowledge search.

Raw knowledge is not enough. A junior employee does not only need the Boudoir Buyer Bible; they need the firing order:

1. detect client niche and business phase
2. load the right client context
3. load only the relevant reference pack
4. choose the right offer/angle/CTA pattern
5. produce the deliverable in the right format
6. self-critique against the relevant handbook
7. save it in the correct client folder
8. hand it off for review

This means the highest-value skills are composed workflow skills:

| Workflow Skill | Purpose | Calls Into |
| --- | --- | --- |
| `intake-and-extract` | Convert messy onboarding materials into a trusted `intake.md` | `intake`, `asset-intake`, pricing/audit references, niche detection |
| `deliver-homepage-copy` | Produce homepage copy from approved intake/strategy | website copywriter, niche packs, buyer bible, website handbook |
| `deliver-website-copy` | Produce full site copy: home, about, services, FAQ, contact | `deliver-homepage-copy`, FAQ/social-proof references, offer strategy |
| `deliver-quiz-funnel` | Produce Typeform quiz + funnel copy | quiz builder, niche quiz examples, strategy output |
| `deliver-ad-package` | Produce Google/Meta ad packages as Markdown specs | Google Ads skill, Meta reference pack, buyer objections |
| `deliver-reactivation-campaign` | Produce email/SMS/reactivation sequence | reactivation skill, email subject line references, 5x5 follow-up |
| `deliver-full-client-launch` | Long-term orchestrator for full GTM stack | all approved stage workflows with human gates |

Rule: do not add more standalone capability skills until a composed workflow proves a missing capability. Most new knowledge should start as reference packs used by these workflow skills.

Skill lookup mechanism:

- `.claude/skills/registry.yaml` maps composed workflow names to capability skills and reference packs.
- Each composed workflow names explicit dependencies by path, not by vague concept.
- Reference packs live under `knowledge/distilled/` and are linked from the registry by stable ids.

Example:

```yaml
workflows:
  deliver-homepage-copy:
    composed_skill: .claude/skills/deliver-homepage-copy/SKILL.md
    capability_skills:
      - .claude/skills/photo-studio-website-copywriter/SKILL.md
      - .claude/skills/boudoir-copywriter/SKILL.md
    reference_packs:
      - knowledge/distilled/copywriting/website-copy-handbook.md
      - knowledge/distilled/niches/boudoir-buyer-bible.md
    output_path_template: clients/{client_id}/drafts/homepage-{date}.md
```

### Employee Workspace Layer

Purpose: the non-technical operator workspace for Codex sessions.

Recommended monorepo shape:

```text
agency/
  AGENTS.md
  CLAUDE.md
  apps/
    agency-os/
  templates/
    new-build/
  sites/
    studio-acme/
  clients/
    studio-acme/
      brief.md
      sprint.md
      standup-log.md
      assets.md
      tasks.md
      outputs/
        copy/
        ads/
        email/
        design/
        landing-page/
  knowledge/
    manifests/
    summaries/
```

Rules:

- Client strategy, copy, ads drafts, status, and handoffs live under `clients/{client-id}`.
- Website implementation only happens in `sites/{client-id}`.
- Template improvements happen in `templates/new-build`.
- Internal app/product implementation happens in `apps/agency-os`.
- Codex instructions should teach employees to start from the monorepo root, select a client lane, and call Agency OS MCP tools for context and actions.
- The new-client baseline comes from the Notion "New Client - 60 Day Sprint Template", translated into local `sprint.md` plus structured tasks and mirrored back into Agency OS when the app exists.

This removes the duplication risk where employees start writing client copy and status notes inside the website template lane.

### Layer 1: Local And GitHub Layer

Purpose: versioned code, skills, template assets, PR review, and client website repos.

Owns:

- `clients/**` for client folders and approved outputs.
- `templates/new-build` for the reusable website template and its site-building skills.
- `sites/{client-id}` only when a client needs a site.
- `.claude/skills` as the shared authored skill pack, exposed into Codex/Agents through controlled links or generated mirrors rather than replacing system/plugin skills wholesale.
- GitHub issues/PRs for implementation tasks.

Does not own:

- Employee secrets.
- RAG embeddings.
- Ads OAuth tokens.
- Cross-client reporting surfaces.
- Internal workflow state.

### Layer 2: Knowledge And RAG Layer

Purpose: source-cited retrieval over Drive docs, approved outputs, and curated references.

Core rule: RAG is a curated publish target, not a raw sync target. Drive and Notion can be upstream sources, but automatic source sync should only mirror content into staging. It should not automatically promote every edit into the retrieval corpus.

Owns:

- Google Drive source registry.
- Markdown/text exports.
- Document hashes and version history.
- Parent-child chunking.
- Embeddings and full-text search.
- Source citations, freshness, category, skill mapping, and client scoping.

Recommended store:

- Neon Postgres with pgvector for `documents`, `document_versions`, `parent_chunks`, `chunks`, `skill_reference_map`, and retrieval evals.

Policy:

- RAG can suggest skill/reference updates.
- RAG cannot auto-edit production skills.
- Every answer shown to an employee includes title, source URL, synced date, and freshness status.
- Reference knowledge can re-index automatically after classification is trusted.
- Active client drafts should not enter RAG while they are being edited.
- Approved client deliverables can be indexed once as client-scoped, frozen references.
- Notion tasks/sprints are operational state and should be queried as structured data, not embedded as general RAG content.

Document lifecycle rules:

| Source State | Examples | Storage | RAG Behavior |
| --- | --- | --- | --- |
| Reference knowledge | Buyer Bible, Website Copy Handbook, StoryBrand | Drive upstream, staged raw mirror, distilled Markdown | Re-index on approved change; keep version history |
| Active client work | homepage draft v3, ad copy draft, internal notes | Google Docs or `clients/{id}/drafts` | Do not index until handoff/approval |
| Approved deliverable | final homepage copy, approved audit, approved email sequence | Drive final + frozen Markdown under `clients/{id}` | Index once as client-scoped; re-index only by explicit command |
| Stale/deprecated technical doc | Typeform/GTM 2024 code | staged raw only with stale flag | Exclude until human verifies current behavior |
| Notion operational state | sprint tasks, due dates, responsibility, status | Notion API or synced operational table | Query directly; do not treat as knowledge chunks |

### Layer 3: Agency OS App Layer

Purpose: employee cockpit, workflow orchestration, approvals, reporting, and controlled tool access for Codex/ChatGPT-style work.

Owns:

- Supabase Auth or equivalent app auth.
- Employees, roles, client assignments, audit logs.
- Client workspace records.
- Copy Studio and campaign builders.
- Review queues.
- Slack notifications and digests.
- Ads approval queue.
- Google Drive publishing.
- GitHub task creation.
- Hosted MCP server for Claude/Codex.
- Provider adapter registry for external tools.

Default user experience:

- Employees should not need `.env` files.
- Employees log into Agency OS and connect Codex/ChatGPT/Claude through scoped MCP tokens.
- Developers and power users can still run local repos with `.env` files.

## Employee Tooling And MCP Provider Layer

Agency OS should act as a broker over provider tools. Employees should not receive raw provider credentials or direct platform admin rights unless their role requires it.

### Provider Surfaces

| Provider | Employee Need | Agency OS Role | Risk Level |
| --- | --- | --- | --- |
| Google Drive / Docs | Read source docs, publish drafts, client approvals | Source sync, doc publishing, file inventory, citation links | Medium |
| Gmail / Email | Draft client emails, check assigned communications, send approved replies | Draft-first email tools, optional send approval, client-scoped search | High |
| Slack | Standups, approvals, alerts, daily digest | Post updates, read approval actions, notify channels | Medium |
| GitHub | Save outputs, create issues/PR tasks, track website work | Controlled commits/issues, repo mapping, PR status | High |
| Google Ads | Draft assets, queue campaigns, pull performance, create paused ads | Approval queue, MCC/client account scoping, paused push | High |
| Meta / Facebook Ads | Draft creatives, pull performance, create paused ads | Approval queue, OAuth scoping, creative/ad creation | High |
| GoHighLevel | Leads, contacts, forms, booking/funnel status | Client-scoped CRM read/write with approval for risky actions | High |
| Vercel | Deploy status, domain setup, preview/prod awareness | Read status by default; deploy only through approved runbooks | High |
| Stripe | Client billing/subscription state if Agency OS becomes sellable | Read/subscription workflows; writes gated by finance/admin | High |

### MCP Design Principle

Provider MCPs and APIs should not be exposed raw to every employee. Agency OS should expose business-level tools:

- `draft_google_ads_for_client`
- `queue_google_ads_push`
- `get_google_ads_performance`
- `draft_meta_ads_for_client`
- `queue_meta_ads_push`
- `publish_google_doc`
- `append_client_standup`
- `send_slack_update`
- `create_github_task`
- `get_client_email_context`

The provider adapter underneath may use official MCP servers, provider SDKs, OAuth APIs, or internal route handlers. The employee-facing surface should stay stable even if the provider implementation changes.

### Required Provider Guardrails

- All provider tools enforce `employee_id`, role, and `client_id` assignment.
- All writes have idempotency keys.
- High-risk writes require approval states.
- Ads are created paused by default.
- Email send tools default to draft, not send.
- Vercel production deploy tools require explicit manager/admin approval.
- Slack interactive webhooks verify signatures and deduplicate before side effects.
- Provider OAuth tokens are encrypted or stored in a real secret manager.
- Every tool call writes to `audit_log`.

## Primary User Flows

### Persona: Humberto / Power User

Default entry: `/Users/Humberto/Documents/GitHub/0000. Agency OS`

Working pattern:

1. Opens the root workspace in Codex.
2. Reviews cross-client status, skill gaps, Drive/Notion sources, and Agency OS app work.
3. Jumps into `apps/agency-os`, `templates/new-build`, or `sites/{client}` when the task requires code.
4. Uses provider MCP tools and GitHub directly when appropriate.
5. Promotes repeatable discoveries into shared skills and references.

Needs:

- Full visibility.
- Fast jumping between repos.
- Strong status surfaces.
- Ability to create new clients, new site forks, new skills, and new provider integrations.

Risk:

- Because everything is accessible, the system must make the current working context obvious before edits.

### Persona: Copywriter / Marketing Operator

Default entry: `/Users/Humberto/Documents/GitHub/0000. Agency OS/clients/{client-id}` or `/Users/Humberto/Documents/GitHub/0000. Agency OS`

Working pattern:

1. Opens Codex in the agency workspace.
2. Chooses client and workflow.
3. Reads brief, sprint, latest standup, approved examples, and RAG citations.
4. Writes output under `clients/{client-id}/outputs/`.
5. Runs `standup-entry`.

Needs:

- Clear "you are working on Client X" context.
- No need to understand product repos.
- Easy save/publish to Google Docs.
- Review queue and manager comments.

Risk:

- Should not be editing website code or pushing provider changes unless explicitly trained.

### Persona: Graphic Designer

Default entry: `/Users/Humberto/Documents/GitHub/0000. Agency OS/clients/{client-id}` or Agency OS asset view.

Working pattern:

1. Opens client assets, visual brief, brand references, current landing page/site links.
2. Creates image direction, ad creative brief, or visual QA notes.
3. Saves to `outputs/design/` or uploads/references Drive assets.
4. Marks blockers in standup.

Needs:

- Asset inventory.
- Links to Drive folders.
- Simple visual QA/checklist prompts.
- No Git/Vercel/provider complexity by default.

Risk:

- Needs clear distinction between source photos/assets, generated artifacts, and deployable website files.

### Persona: Trained Site Operator

Default entry: `/Users/Humberto/Documents/GitHub/0000. Agency OS/sites/{client-id}-website` only after a site exists.

Working pattern:

1. Starts from approved `landing-page-brief`.
2. Opens the client site repo.
3. Updates `lib/site.config.tsx`, `lib/content.config.ts`, images, and theme tokens.
4. Runs local checks.
5. Opens PR or deploys through approved runbook.

Needs:

- Narrow site-build instructions.
- Template-specific skills.
- Vercel/GHL checklist.

Risk:

- Should not confuse the reusable `templates/new-build` repo with the client fork.

### Persona: Manager

Default entry: Slack/email digest, MCP query, or Codex at `/Users/Humberto/Documents/GitHub/0000. Agency OS`.

Working pattern:

1. Reviews daily digest, stale standups, blocked clients, and pending approvals.
2. Approves copy, ads, emails, deployment requests.
3. Uses RAG/status tools for client check-ins.

Needs:

- Cross-client rollups.
- Approval history.
- Provider status.
- Accountability by employee/client.

Risk:

- Approval tools must be audited and scoped.

### Working Context Contract

Every agent session must start by resolving active context through a deterministic mechanism, not a vibe check.

Resolution order:

1. Explicit task command or prompt metadata: `client_id=studio-acme`, `surface=client`.
2. Current working directory:
   - `clients/{id}/**` resolves `active_client={id}`, `active_surface=client`.
   - `sites/{id}/**` resolves `active_client={id}`, `active_surface=client-site`.
   - `templates/new-build/**` resolves `active_surface=template`.
   - `apps/agency-os/**` resolves `active_surface=agency-os-app`.
3. `clients/{id}/context.yaml`, when present, supplies the final allowed paths, owner, site pointer, provider policy, and handoff rules.
4. If no active client can be resolved for client work, the agent must ask for the client id before writing.

Each client folder should include:

```text
clients/studio-acme/context.yaml
```

Example:

```yaml
workspace_root: "/Users/Humberto/Documents/GitHub/0000. Agency OS"
client_id: studio-acme
client_name: Studio Acme
active_surface: client
allowed_write_paths:
  - clients/studio-acme/**
allowed_read_paths:
  - clients/studio-acme/**
  - knowledge/distilled/**
  - .claude/skills/**
forbidden_without_confirmation:
  - templates/new-build/**
  - sites/*/**
  - apps/*/**
provider_write_policy: draft | approval-required | allowed
site_pointer: clients/studio-acme/site-pointer.yaml
handoff_path: clients/studio-acme/handoffs/
```

Root `AGENTS.md` / `CLAUDE.md` must instruct agents to:

- read the resolved `context.yaml` before client work
- state `active_client`, `active_surface`, and `allowed_write_paths` before editing
- refuse writes outside `allowed_write_paths` unless the user explicitly changes context
- treat provider writes as draft-only unless `provider_write_policy` allows more

This is the main safety device for non-technical users. They can be in one place, but the agent has a concrete contract for which sub-area is safe to touch.

### New Client 60-Day Sprint Flow

1. Manager creates a new client from the Notion "New Client - 60 Day Sprint Template" or its Agency OS equivalent.
2. Agency OS creates a local/client workspace skeleton:
   - `brief.md`
   - `sprint.md`
   - `standup-log.md`
   - `assets.md`
   - `tasks.md`
   - `outputs/`
3. Intake skill fills the brief from discovery notes, Notion fields, Slack messages, Drive files, and client assets.
4. Project-flow milestones are split into Client-owned and agency-owned tasks.
5. Codex sessions run against this client folder and call MCP tools for Drive/Notion/RAG/provider context.
6. Each completed work session appends to `standup-log.md` and updates task state.
7. Agency OS later may add a thin UI over the same sprint/task/status model if Slack/email/MCP queries become insufficient.

The principle: do not make employees choose between Notion and local files. Notion is current operational truth; the local workspace is the Codex execution mirror; Agency OS eventually becomes the productized source of truth.

### Copywriter Flow

1. Opens Codex/ChatGPT at the `agency` monorepo root.
2. Runs `list_assigned_clients`.
3. Selects a client and task, for example website copy or quiz copy.
4. Agency OS loads client brief, approved voice, latest standups, and relevant RAG citations.
5. Skill generates a structured draft.
6. Draft is saved to review queue and optionally a Google Doc.
7. Manager approves or requests edits.
8. Approved output is committed under `clients/{client-id}/outputs` and summarized to Slack.
9. `standup-entry` appends what changed, what is blocked, and next steps.

### Graphic Designer Flow

1. Opens Codex/ChatGPT at the `agency` monorepo root or the Agency OS asset view.
2. Reviews brand assets, image inventory, ad visual requirements, and landing page brief.
3. Uses RAG only for creative context, not as a source of visual truth.
4. Uploads or links final assets to Drive.
5. Marks assets ready for copy/ad/site workflow.
6. Standup entry records asset status and blockers.

### Manager Flow

1. Opens Slack digest, email report, MCP query, or thin admin view if it exists.
2. Reviews clients with stale standups, blocked tasks, and pending approvals.
3. Reviews queued ads and copy.
4. Approves/rejects with comments.
5. Approval writes to audit log, updates queue state, and notifies the client channel.

### Developer / Power User Flow

1. Maintains `agency-os`, `new-build`, and client-site boundaries.
2. Updates skills via PRs.
3. Converts recurring RAG discoveries into curated references.
4. Runs verification and security checks before exposing new MCP tools.
5. Creates client website forks only for clients that need deployable code.

### Client Flow

Future limited portal only:

- Intake.
- Asset upload.
- Copy review.
- Approval.
- Status view.

No access to internal RAG, other clients, raw agent logs, skill internals, GitHub, or platform secrets.

## Failure Modes And Feedback Loops

### Skill Quality Feedback Loop

Bad output must create a learning event, not disappear into Slack.

When a reviewer rejects or materially edits a draft, record a skill quality event:

```yaml
skill_name: deliver-homepage-copy
capability_skills:
  - photo-studio-website-copywriter
  - boudoir-copywriter
client_id: molly-seattle
niche: boudoir
deliverable_type: homepage-copy
failure_type: weak-angle | wrong-tone | missing-proof | factual-gap | off-brand | structure | other
what_was_wrong: <reviewer note>
what_changed: <summary of reviewer correction>
source_path: clients/molly-seattle/drafts/homepage-2026-xx-xx.md
reviewed_by: <user>
created_at: <timestamp>
```

Storage starts as Markdown/YAML under `clients/{id}/quality-events/`.

Aggregation starts as a file walk:

```bash
scripts/quality-events-report.ts clients/*/quality-events/*.yaml
```

The report groups events by composed workflow, capability skill, niche, and failure type, then writes a weekly summary to:

```text
knowledge/quality-reviews/{yyyy-mm-dd}.md
```

A Supabase `skill_quality_events` table can come later if volume or Slack approvals justify it.

Weekly review:

1. Group rejected outputs by skill, niche, and failure type.
2. Identify whether the issue belongs in:
   - composed workflow instructions
   - capability skill instructions
   - missing client intake field
   - missing reference pack
   - reviewer preference/training
3. Patch the skill/reference through PR.
4. Add or update a gold-standard example when the corrected version is strong.

This is how the system improves instead of silently degrading as edge cases accumulate.

### Client Lifecycle States

Every client should have an explicit lifecycle state:

| State | Meaning | Access | Knowledge / RAG | OAuth / Provider Tokens | Site |
| --- | --- | --- | --- | --- | --- |
| `prospect` | Not yet active, limited discovery | managers/admins only | no RAG except sanitized notes | none | none |
| `active` | current delivery client | assigned team | client-scoped approved deliverables allowed | active only if required | active/maintained if hosted |
| `paused` | temporarily inactive | account manager + managers | no new global ingestion; client-scoped retained | tokens disabled unless needed for reporting | leave live unless contract says otherwise |
| `churned` | no longer a client | managers/admins only | freeze client-scoped knowledge; exclude from active retrieval | revoke/rotate tokens | transfer, archive, or leave per contract |
| `archived` | retention-only | owner/admin only | cold storage only; not in normal RAG | no active tokens | archived or transferred |

Offboarding checklist:

- mark lifecycle state
- revoke or disable provider tokens
- remove employee assignment access
- freeze approved deliverables
- exclude active drafts from RAG
- archive or transfer hosted site
- confirm billing owner for any Vercel/Supabase/Neon/provider resource
- cancel, transfer, or downgrade client-specific paid resources
- retain only what contract/policy allows
- record final handoff/offboarding note

Cost ownership rule:

| Resource | Default Owner | Offboarding Rule |
| --- | --- | --- |
| Agency workspace GitHub repo | Agency | Retained; remove client assignment access |
| `apps/agency-os` Supabase/Neon | Agency | Retain operational records per policy |
| Client Vercel project | Agency unless contract transfers it | Transfer to client, archive, or shut down per contract |
| Client-specific Supabase project | Agency unless explicitly client-owned | Export/transfer or delete per contract |
| Provider OAuth connection | Client/provider account owner | Revoke agency token on churn |
| Google Drive client folder | Agency unless shared ownership contract says otherwise | Archive and remove employee access |

## Data Model Direction

Current implementation note: Agency OS application data now lives in Neon/Postgres, not Supabase. Supabase remains valid for explicit client-site CMS/storage work when a site needs it, but the internal app state should use the Neon migration lane under `apps/agency-os/db/neon`.

Use Neon/Postgres for Agency OS application data:

- `employees`
- `clients`
- `employee_clients`
- `workflow_runs`
- `workflow_steps`
- `review_items`
- `ads_push_queue`
- `standup_entries`
- `audit_log`
- `oauth_connections`
- `client_assets`
- `slack_events`
- `notion_sources`
- `notion_milestones`
- `drive_sources`

Use Neon/pgvector for knowledge retrieval:

- `documents`
- `document_versions`
- `parent_chunks`
- `chunks`
- `skill_reference_map`
- `retrieval_evals`
- `sync_runs`
- `notion_blocks`

Reason for split:

- Supabase gives app auth/RLS and product data.
- Neon gives isolated knowledge database, branching, pgvector, and RAG scaling without mixing embeddings into core app tables.

If operational overhead becomes more important than separation, this can be collapsed into one Postgres provider later, but the initial boundary is cleaner.

## MCP Surface Design

Agency OS MCP should expose controlled business tools, not raw database or raw provider access:

- `list_assigned_clients`
- `get_client_brief`
- `get_client_status`
- `query_knowledge`
- `create_copy_draft`
- `save_approved_output`
- `create_google_doc`
- `create_github_task`
- `append_standup_entry`
- `queue_ads_for_approval`
- `get_review_queue`
- `get_workflow_status`
- `list_provider_connections`
- `get_client_email_context`
- `draft_email_reply`
- `draft_google_ads`
- `draft_meta_ads`
- `get_ads_performance`
- `queue_provider_action`
- `approve_provider_action`

High-risk tools need approval states, not direct mutation:

- Ads push.
- Client-facing publishing.
- GitHub PR creation.
- Bulk Drive changes.
- Sending email.
- Posting public/client-visible Slack messages.
- Creating or activating ads.
- Production deploys.

## Security And Governance

Required before any real rollout:

- Employee role model with RLS.
- Client assignment enforcement at database and MCP tool layers.
- Audit log for every MCP tool call and approval action.
- Secrets stored server-side only.
- No employee `.env` requirement except developers.
- OAuth tokens encrypted or stored in a real secret manager.
- Ads operations create paused assets first.
- Idempotency keys for platform pushes and webhooks.
- Rate limits per employee and per tool.
- SSRF guard for any URL ingestion or document/image fetch.
- RAG prompt-injection neutralization and source visibility.

### Required Security Gates By Surface

These gates apply at the surface that triggers them. They are not a global prerequisite for employee onboarding or manual draft workflows.

| Gate | Applies To | Blocks |
| --- | --- | --- |
| New Table / RLS Gate | `apps/agency-os` Neon/Postgres tables and optional client-site Supabase tables | Any consumer of a new auth-scoped table |
| OAuth Token Gate | Provider integrations | Google Ads, Meta, Gmail, GHL, Slack OAuth writes |
| Webhook/Public POST Gate | Slack/public POST routes | Slash commands, interactivity, provider webhooks |
| URL Fetch / SSRF Gate | Any URL ingestion | Website scraping, asset fetches, Drive image fetches, callback URLs |
| Threat Model Gate | Authenticated MCP mutation tools | Tools that write, publish, queue, approve, send, or mutate provider state |

#### New Table / RLS Gate

For every new Supabase table, write a five-operation RLS audit before building consumers:

1. `SELECT`: who can read which rows?
2. `INSERT WITH CHECK`: who can create rows and for which client/account?
3. `UPDATE USING`: who can target existing rows?
4. `UPDATE WITH CHECK`: what final row state is allowed after update?
5. `DELETE`: who can delete, or is delete disallowed in favor of archival?
6. Admin/service-role bypass review: every service-role query must explicitly scope by client/account where applicable.

Applies to proposed tables such as employees, clients, assignments, tasks, handoffs, review items, audit logs, raw docs, distilled docs, OAuth connection metadata, and provider operation ledgers.

#### OAuth Token Gate

OAuth refresh tokens must not be stored as plain Supabase rows.

Choose one before implementation:

- Secret manager path: tokens live in a real secret manager; Supabase stores only references.
- Supabase Vault path: tokens live in Vault; app code reads via controlled server-side functions only.
- Encrypted-column path: AES-256-GCM encrypt before database write; encryption key stays outside the DB.

Until this is chosen, provider write integrations are blocked.

#### Webhook/Public POST Gate

Every public POST route must have a route template and tests for:

- HMAC/signature verification with no development fallback in production
- content-length cap before JSON/body parsing
- per-field `.slice()` caps before logging/storage/Slack rendering
- idempotency key or event ID dedupe
- explicit `runtime = "nodejs"` where Node crypto/provider SDKs are required
- structured error handling that does not leak secrets

#### URL Fetch / SSRF Gate

Before any workflow fetches user-provided URLs, existing websites, Drive image URLs, callback URLs, or remote assets, implement and test a DNS/IP guard:

- block localhost and loopback
- block RFC-1918 private ranges
- block link-local and metadata IPs
- resolve hostnames before fetch
- re-check after redirects
- cap response size and timeout

Utility name: `isPrivateOrLocalhost()` or equivalent.

#### Threat Model Gate

Before authenticated MCP/API implementation, write a threat model for:

- client assignment bypass
- prompt injection from Drive/Docs/websites
- malicious URLs/assets
- Slack command spoofing/replay
- OAuth token leakage
- provider write idempotency and retry behavior
- accidental cross-client retrieval

Lessons that directly constrain this plan:

- Route authority must be classified before choosing Supabase service role or authenticated client.
- Service-role access must scope every query and enrichment leg.
- RLS/auth integration needs real integration tests, not only mocked DB tests.
- Connector/webhook ledgers require mandatory idempotency keys.
- SSRF guards belong at every URL intake point.
- Long-running actions need operation ledgers.
- New security fixes need class-level guardrails, not one-off patches.
- External agent surfaces should not expand public MCP into privileged control-plane tools.

## Delivery Dependency Graph

Build order should be governed by dependencies, not artificial phases. With parallel agent execution, multiple nodes can start once their inputs are stubbed. Each node ships at full quality when its dependencies are complete.

```text
workspace skeleton + context contract
  -> employee operating flow
  -> intake-and-extract
  -> composed workflows
  -> curated knowledge
  -> ops surface
  -> optional site build
  -> provider integrations
  -> client portal
```

### Workspace Skeleton And Context Contract

Goal: employees can start using the workspace safely immediately.

Scope:

- Create the agency workspace skeleton at exact root `/Users/Humberto/Documents/GitHub/0000. Agency OS`.
- Add root `AGENTS.md` / `CLAUDE.md` operating rules.
- Add `.claude/skills/` as the authored skill source.
- Add `clients/sample-studio/` with safe stub materials.
- Add folder conventions: `context.yaml`, `intake.md`, `drafts/`, `outputs/`, `handoffs/`, `quality-events/`, `site-pointer.yaml`.
- Add baseline governance:
  - `.gitignore`
  - `CODEOWNERS`
  - branch naming convention
  - protected `main` once pushed to GitHub
  - markdown/path validation script
  - folder ownership notes

Acceptance criteria:

- A non-technical employee can produce one draft from a sample client without touching `apps/**`, `templates/**`, `sites/**`, provider tools, or live client-facing surfaces.
- The agent states `active_client`, `active_surface`, and `allowed_write_paths` before editing.
- Every output lands in the expected client folder.

### Employee Operating Flow

Depends on: workspace skeleton and context contract.

Goal: get employees working tomorrow without Slack bot, Supabase, RAG, or a finished app.

Manual flow:

1. Manager assigns by DM or channel message.
2. Employee opens the agency workspace.
3. Employee selects the client lane and runs an approved skill/workflow.
4. Employee saves output under the client folder.
5. Employee posts "ready for review" with the Markdown path.
6. Manager replies approved / revise with notes.
7. Employee records the decision in the handoff note.

First exercises:

| Exercise | Goal | Safe Output |
| --- | --- | --- |
| Run intake on a stub client | Learn client context structure | `clients/sample-studio/intake.md` |
| Rewrite one homepage section | Learn copy workflow and handoff | `clients/sample-studio/drafts/homepage-section.md` |
| Generate an ad draft only | Learn ads are draft/approval-only | `clients/sample-studio/drafts/google-ads.md` |
| Write handoff note | Learn status hygiene | `clients/sample-studio/handoffs/{date}.md` |

Slash commands and app automation are not required for this node.

### Notion Operating Model Extraction

Depends on: nothing; can start immediately.

Goal: read the real Master Task Board row structure before finalizing `sprint.md`, `tasks.md`, or any task schema.

Scope:

- Use Notion API or Notion MCP as the primary path; do not rely on an agent reading the board line by line.
- If the current connector path fails, use one of:
  - direct Notion API with an internal integration token
  - an alternate Notion MCP/query tool
  - CSV export from the Notion UI as a fallback
- Preserve task status, owner, due dates, files, notes, milestone, responsibility, and client relation fields.

Acceptance criteria:

- `clients/{id}/tasks.md` and any future Supabase task schema are based on actual Notion rows, not guessed board structure.

### Intake-And-Extract

Depends on: workspace skeleton; can use stubbed Notion/task fields until extraction finishes.

Goal: prove the system can turn messy real materials into a trustworthy `intake.md`.

Proof case: Molly Seattle, once materials are ready. Current local target should be `molly-editorial`, which is newer than `molly-seattle-boudoir` by filesystem timestamp and latest commit.

Scope:

- Build or refine the composed `intake-and-extract` workflow.
- Inputs: onboarding questionnaire, existing site URL, brand assets, pricing, prior copy, reviews, notes.
- Output: `clients/molly-seattle/intake.md`.
- Include niche, offer, voice, target audience, objections, proof, assets, missing info, and downstream workflow recommendations.
- Human review gate before strategy/copy/funnel work.

Acceptance criteria:

- The `intake.md` is good enough that Humberto would hand it to a senior copywriter.
- The workflow identifies missing data instead of hallucinating it.
- The workflow does not ingest active drafts or sensitive raw materials into RAG.

### Composed Workflows

Depends on: workspace skeleton; best results depend on approved intake.

Goal: encode the firing order for high-frequency deliverables.

Initial workflows:

1. `deliver-homepage-copy`
2. `deliver-website-copy`
3. `deliver-quiz-funnel`
4. `deliver-ad-package` as Markdown only
5. `deliver-reactivation-campaign`

Rules:

- Each composed workflow calls existing capability skills where possible.
- Each workflow reads from the approved intake/strategy artifact.
- Each workflow locates dependencies through `.claude/skills/registry.yaml`.
- Each workflow writes structured Markdown under `clients/{id}/`.
- Each workflow has a self-critique step.
- Each workflow ends with a handoff note and manager review request.
- No external provider writes in this node.

Acceptance criteria:

- Output quality is comparable to Humberto's expected delivery standard.
- Employees do not choose references manually; the workflow loads them.
- Existing skills are fixed only when a workflow exposes a real gap.

### Curated Knowledge

Depends on: workspace skeleton; can start in parallel with composed workflows.

Goal: support the workflows with clean references, not raw document dumping.

Implementation language:

- Default to TypeScript for Drive/Notion sync, manifests, Slack/email automation, and MCP/API helpers because the workspace and `new-build` ecosystem are already TypeScript/Next-oriented.
- Use Python only if a specific ingestion/chunking library materially reduces complexity.
- Do not introduce Java for this system.

Scope:

- Export the eight high-priority Drive docs into `knowledge/raw/`.
- Classify and distill them into `knowledge/distilled/`.
- Add frontmatter: scope, lifecycle, skill targets, freshness, niche, source URL.
- Wire composed workflows to read from distilled references.
- Add Drive sync with hash tracking after the manual process is proven.
- Add Notion sync through API/MCP for operational rows and allowed knowledge pages.
- Add RAG/vector search only after the corpus is clean enough to trust.

Acceptance criteria:

- Trusted references are clearly separated from active drafts and stale technical docs.
- A workflow can cite which source informed a claim.
- New documents enter staging, not RAG, until classified.

Sync rule:

```text
Source changed -> fetch via API/MCP -> compute version hash -> delete old staged/versioned chunks for that source -> insert new staged version -> promote to RAG only if lifecycle/classification allows it
```

### Ops Surface

Depends on: composed workflows producing real outputs.

Goal: reduce manual coordination once the manual flow becomes painful.

Candidate surfaces:

- `/agency assign`
- `/agency start`
- `/agency handoff`
- `/agency approve`
- `/agency ask`
- daily leadership digest email

Scope:

- Store task metadata in Supabase or a simple operational table only if manual handoffs are insufficient.
- Send Slack/email notifications for assignments, handoffs, blockers, approvals, and stale work.
- Keep deliverable creation in Codex/composed skills.

Acceptance criteria:

- An employee can receive a task, run the correct workflow, and hand off without choosing skills manually.
- A manager gets a daily digest of in-flight, blocked, overdue, and review-ready work.

### Optional Site Build

Depends on: workspace skeleton, context contract, and approved deliverable output.

Goal: support clients who need hosted web work without assuming every client has a site.

Scope:

- `site-pointer.yaml` describes each client's site situation:
  - none
  - external URL
  - standalone HTML
  - Cloudflare artifact
  - `sites/{client-id}` Next build
- For hosted builds, use `templates/new-build` and write only to `sites/{client-id}`.
- Preview deploy before production.

Acceptance criteria:

- Site work is optional and isolated.
- Client folders remain the source of operational context.
- Production deploys require review.

### Provider Integrations

Depends on: human-reviewed workflow chain, surface-specific security gates, and prior-art notes.

Goal: add Typeform, Google Ads, Meta, tracking, and deploy automation only after the workflow chain is reliable.

Scope:

- Verify current official API versions before implementation.
- Build dry-run mode first.
- Create ads and platform assets paused/unpublished by default.
- Require explicit approval before spend or public launch.
- Add audit logs, idempotency keys, retries, and rollback notes.

Acceptance criteria:

- No API action can spend money or publish client-facing material without approval.
- Every provider write has a ledger entry.
- Failed provider calls are recoverable and visible.

### Client Portal

Depends on: stable internal workspace and proven approval workflows.

Goal: add limited client-facing surfaces only after the internal system is stable.

Scope:

- Client portal remains later and limited: intake, assets, approvals, status.
- No client-facing surface exposes internal RAG, drafts, agent logs, or skill internals.

Acceptance criteria:

- Client-facing surfaces never expose internal RAG, agent logs, or drafts.

## Cut From The Supplied PRD For Now

These should not be in the first build slice:

- LangGraph workflow engine as a hard dependency. Start with explicit queue/job state in the app; add LangGraph only when workflow graph complexity justifies it.
- Automatic ads push in the first vertical.
- Client-facing portal in the first vertical.
- Broad whole-tree skill symlinks into all repos.
- Hardcoded `mcp.agency.internal` / internal UI domain assumptions before DNS/auth/deployment decisions.
- Google Ads API version pin until the official current version and client library are verified during implementation.
- Doppler as a hard dependency before comparing with Vercel/Supabase/1Password/team secret workflow.

## Open Decisions

1. Will Agency OS use Supabase Auth as the employee auth source from day one, or Google Workspace SSO through Supabase?
2. Should shared skills eventually be published as a separate `agency-skills` package/repo for reuse outside the monorepo? Recommendation: no for day one; keep authored source at root `.claude/skills`.
3. Which provider owns the production worker runtime: Vercel, Railway, Fly, or another always-on host?
4. Which provider integrations are first-class MCPs versus internal API adapters? Recommendation: expose stable Agency OS tools first, then choose implementation per provider.
5. Does Notion remain the operational source during migration, or does Agency OS become source of truth with Notion as an import/export surface? Recommendation: Notion source now, Agency OS source later.
6. Who besides Humberto can classify new knowledge sources? Recommendation: Humberto-only for the first 30-60 days, then add `knowledge-curator` role.

## Verification Plan

Before implementation handoff:

- Confirm live official docs for Drive sync, Neon pgvector, Supabase Auth/RLS, MCP SDK, OpenAI embeddings, Google Ads, Meta Marketing API, Slack, GitHub, and chosen worker host.
- Complete Notion row extraction for the Master Task Board before finalizing `tasks.md`, `sprint.md`, or Agency OS task schema.
- Check active worktrees and branches before touching shared registries or docs.
- Create a threat model for MCP tools before any mutation tools ship.
- Create retrieval evals before declaring RAG quality.
- Create one full employee walkthrough test per role: copywriter, designer, manager, developer.

## Source Notes

- `new-build` inspection: forkable Next/Tailwind photographer template, GHL active lead system, optional Supabase migrations only, `.claude/skills` authored source.
- Google Drive inspection: 39 documents in the linked folder; no nested folders returned by the connector listing.
- Notion inspection: "New Client - 60 Day Sprint Template" page, parent Master Task Board, embedded "Project Flow Board - 2025" data source with `Milestone`, `Notes`, `Responsibility`, and `Progress:` fields.
- Official docs checked during planning:
  - Claude MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
  - Google Drive changes: https://developers.google.com/workspace/drive/api/guides/manage-changes
  - Neon AI/pgvector: https://neon.com/docs/ai/ai-intro
  - Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
  - Google Ads release notes: https://developers.google.com/google-ads/api/docs/release-notes
