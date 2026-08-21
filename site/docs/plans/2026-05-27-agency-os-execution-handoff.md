# Agency OS Execution Handoff

Date: 2026-05-27  
Status: Kickoff handoff  
Source plan: `docs/plans/2026-05-27-agency-os-production-plan.md`

## Decision

Build a new guarded agency workspace repo.

```text
Local root: /Users/Humberto/Documents/GitHub/0000. Agency OS
GitHub repo: agency-workspace
```

This is the shared operating workspace for client delivery, skills, curated knowledge, optional client sites, and thin Agency OS automation.

P2P SaaS and the P2P main website do not live in this repo. If Agency OS ever reads P2P data, it should happen through a later read-only integration. No P2P product code is imported here.

Definition of done:

> Agency OS is operational when a non-technical employee can independently deliver a full new-client engagement matching Humberto's delivery standard, with Humberto's involvement limited to approval.

## Folder Structure To Create

```text
/Users/Humberto/Documents/GitHub/0000. Agency OS/
  README.md
  AGENTS.md
  CLAUDE.md
  .gitignore
  .github/
    CODEOWNERS
    workflows/
  .claude/
    skills/
    skills/registry.yaml
  apps/
    agency-os/
  templates/
    new-build/
  sites/
  clients/
    sample-studio/
      context.yaml
      brief.md
      intake.md
      site-pointer.yaml
      drafts/
      outputs/
        copy/
        ads/
        email/
        design/
        landing-page/
      handoffs/
      quality-events/
  knowledge/
    raw/
    distilled/
    manifests/
    quality-reviews/
  scripts/
```

Keep `packages/ui` out for now. Add shared packages only when reuse is real.

## Active Context Mechanism

Every client folder gets a `context.yaml`.

```yaml
client_id: sample-studio
client_name: Sample Studio
active_surface: client
allowed_write_paths:
  - clients/sample-studio/**
allowed_read_paths:
  - clients/sample-studio/**
  - knowledge/distilled/**
  - .claude/skills/**
forbidden_without_confirmation:
  - templates/new-build/**
  - sites/*/**
  - apps/*/**
provider_write_policy: draft
site_pointer: clients/sample-studio/site-pointer.yaml
handoff_path: clients/sample-studio/handoffs/
```

Root `AGENTS.md` and `CLAUDE.md` must tell agents to resolve context by explicit command, current path, then `context.yaml`. If no active client is resolved for client work, the agent asks for the client id before writing. Agents must refuse writes outside `allowed_write_paths` unless the user explicitly changes context.

## Tomorrow Operating Flow

No Slack bot, Supabase, RAG, or app UI is required for first employee onboarding.

1. Manager assigns a safe sample task by Slack/DM.
2. Employee opens `/Users/Humberto/Documents/GitHub/0000. Agency OS`.
3. Employee reads `AGENTS.md` and the client `context.yaml`.
4. Employee runs an approved existing skill against `clients/sample-studio`.
5. Employee saves output under `drafts/` or `outputs/`.
6. Employee posts "ready for review" with the Markdown path.
7. Manager replies approved / revise with notes.
8. Employee records the decision in `handoffs/{date}.md`.

Safe exercises:

| Exercise | Output |
| --- | --- |
| Intake on sample client | `clients/sample-studio/intake.md` |
| Homepage section rewrite | `clients/sample-studio/drafts/homepage-section.md` |
| Google Ads draft only | `clients/sample-studio/drafts/google-ads.md` |
| Handoff note | `clients/sample-studio/handoffs/{date}.md` |

## Molly Proof Case

Use Molly Seattle as the first deep proof case after the skeleton and intake workflow are ready.

Local project check:

- Newer target: `/Users/Humberto/Documents/GitHub/molly-editorial`
- Older/dirty target: `/Users/Humberto/Documents/GitHub/molly-seattle-boudoir/molly-seattle-boudoir`

`molly-editorial` is newer by filesystem timestamp and latest commit. The older boudoir repo currently has a modified `next-env.d.ts`, so do not treat it as the clean kickoff target unless Humberto explicitly chooses it.

Initial Agency workspace target:

```text
clients/molly-seattle/
  context.yaml
  brief.md
  intake.md
  site-pointer.yaml
  drafts/
  outputs/
  handoffs/
  quality-events/
```

The Molly proof should validate `intake-and-extract` first. Do not start by trying to automate the full launch.

## Heavy Site Work Rule

Heavy site builds stay inside the monorepo by default.

The site operator uses an isolated branch or worktree and works only under:

```text
sites/{client-id}/
```

Normal flow:

1. Branch or worktree from current `main`.
2. Work in `sites/{client-id}/`.
3. Run local checks for that site.
4. Push branch.
5. Open PR.
6. Vercel creates a preview deploy for that one site project.
7. Reviewer approves.
8. Merge triggers production deploy for that site only.

Concurrent work is safe because collisions happen at the file level. A copywriter in `clients/atlantic/**`, a site operator in `sites/molly-seattle/**`, and a manager editing `.claude/skills/**` can push separate branches without blocking each other.

A site leaves the monorepo only when:

- the client owns the site code,
- the stack diverges from the standard Next.js template,
- or asset weight is impractical for Git.

When that happens, `clients/{id}/site-pointer.yaml` records the external repo, Vercel project, Cloudflare artifact, Webflow/WordPress URL, or no-site status. `clients/{id}/` remains the operational record.

## Dependency Graph

Build by dependency, not phase labels.

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

Parallel work is allowed when dependencies are stubbed. For example, curated knowledge can start while `intake-and-extract` is being refined, as long as unclassified raw docs do not enter RAG.

## Composed Workflow Registry

Create:

```text
.claude/skills/registry.yaml
```

Start with:

```yaml
workflows:
  intake-and-extract:
    composed_skill: .claude/skills/intake-and-extract/SKILL.md
    capability_skills:
      - .claude/skills/intake/SKILL.md
      - .claude/skills/asset-intake/SKILL.md
    output_path_template: clients/{client_id}/intake.md

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

Do not create new capability skills until a composed workflow proves a gap.

## Knowledge Rules

RAG is a curated publish target, not a raw sync target.

Source lifecycle:

| State | Behavior |
| --- | --- |
| Reference knowledge | stage, distill, then RAG after approved classification |
| Active client work | do not index while in progress |
| Approved deliverable | index once as client-scoped, frozen reference |
| Stale technical doc | exclude until verified |
| Notion operational state | query/sync as structured data, not general RAG |

Sync rule:

```text
Source changed -> fetch via API/MCP -> compute hash -> replace staged version -> promote only if lifecycle/classification allows it
```

Default implementation language is TypeScript. Use Python only if a specific ingestion/chunking library materially reduces complexity. Do not introduce Java.

## Notion Prerequisite

Extract the real Master Task Board rows before finalizing `tasks.md`, `sprint.md`, or any Supabase task schema.

Use Notion API/MCP first. If blocked, use CSV export from Notion UI. Do not have agents read the board line by line as the primary method.

## Security Gates

Security gates apply at the surface that triggers them:

| Gate | Applies To |
| --- | --- |
| RLS gate | `apps/agency-os` Neon/Postgres tables and optional client-site Supabase tables |
| OAuth token gate | provider integrations |
| Webhook gate | Slack/public POST routes |
| SSRF gate | URL ingestion |
| Threat model gate | authenticated MCP mutation tools |

Manual employee onboarding and draft-only workflows do not wait on provider-write security gates.

## Quality Loop

Rejected or heavily edited work becomes a quality event:

```text
clients/{client-id}/quality-events/{date}-{workflow}.yaml
```

Weekly aggregation:

```text
scripts/quality-events-report.ts clients/*/quality-events/*.yaml
```

Output:

```text
knowledge/quality-reviews/{yyyy-mm-dd}.md
```

Use these events to patch composed workflows, capability skills, reference packs, or intake requirements.

## Immediate Next Actions

1. Create `/Users/Humberto/Documents/GitHub/0000. Agency OS`.
2. Add the folder skeleton above.
3. Copy or mirror current authored skills into `/Users/Humberto/Documents/GitHub/0000. Agency OS/.claude/skills/`.
4. Add `sample-studio` client folder with `context.yaml`.
5. Add root `AGENTS.md` and `CLAUDE.md` enforcing active context.
6. Add `CODEOWNERS`, `.gitignore`, and branch rules before real employee work.
7. Extract Notion task rows through API/MCP or CSV.
8. Stage the eight high-priority Drive docs into `knowledge/raw/`.
9. Create `clients/molly-seattle/` after sample flow is validated.
10. Build `intake-and-extract` against Molly when materials are ready.
