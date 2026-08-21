# New-build Template Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the starter's simplified website with the current AgencyOS new-build template and align the website-management skills to the new architecture.

**Architecture:** Only `site/` is replaced from the audited local source template. The Business OS root remains private and unchanged. Existing owner-facing skills remain at the root; the website-specific instructions are revised to work with the template's typed configuration, MDX content folders, and existing verification scripts.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, template-local tests and verification scripts.

**Spec:** `docs/superpowers/specs/2026-08-21-new-build-template-migration-design.md`

## Global Constraints

- Source is `/Users/humbertogarcia/Downloads/P2P/000. agencyOS/templates/new-build` at local `main` revision `0b93cbb3`.
- Replace `site/` only; never copy source Git metadata, local environment files, or `node_modules/`.
- Retain root `context/`, root `content/`, `work/`, `inbox/`, `connections/`, root scripts, and Git history.
- Never expose or deploy the preserved private root folders.
- Commit the completed migration on `main` only after verification passes.

---

### Task 1: Record the migration baseline and transfer the public website

**Files:**
- Modify: `site/` (entire public website tree)
- Verify: source and destination manifests

**Interfaces:**
- Consumes: the source template tree and the current starter repository revision.
- Produces: a destination `site/` tree that is byte-for-byte equivalent to the source for tracked, non-local files.

- [x] **Step 1: Record the source and destination revisions**

Run:

```bash
git -C /Users/humbertogarcia/Downloads/P2P/000.\ agencyOS rev-parse HEAD
git -C /Users/humbertogarcia/Downloads/P2P/003.\ business-os-starter rev-parse HEAD
```

Expected: source resolves to the reviewed local main revision and destination has a recoverable pre-transfer commit.

- [x] **Step 2: Verify that no local environment files will transfer**

Run:

```bash
find /Users/humbertogarcia/Downloads/P2P/000.\ agencyOS/templates/new-build \
  -path '*/node_modules' -prune -o -name '.env' -o -name '.env.local' -print
```

Expected: no private source environment file is eligible for transfer.

- [x] **Step 3: Replace the destination site tree atomically from the source**

Run:

```bash
rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='.env.local' \
  /Users/humbertogarcia/Downloads/P2P/000.\ agencyOS/templates/new-build/ \
  /Users/humbertogarcia/Downloads/P2P/003.\ business-os-starter/site/
```

Expected: `site/` contains the full current template, with no copied Git data, dependencies, or secret-bearing local environment file.

- [x] **Step 4: Compare source and destination after transfer**

Run:

```bash
rsync -ain --delete \
  --exclude='.git/' --exclude='node_modules/' --exclude='.env' --exclude='.env.local' \
  /Users/humbertogarcia/Downloads/P2P/000.\ agencyOS/templates/new-build/ \
  /Users/humbertogarcia/Downloads/P2P/003.\ business-os-starter/site/
```

Expected: no output.

### Task 2: Align the starter's owner-facing website skills

**Files:**
- Modify: `.claude/skills/update-website/SKILL.md`
- Modify: `.claude/skills/publish-content/SKILL.md`
- Modify: `.claude/skills/live-preview-tweaks/SKILL.md`
- Test: the referenced template paths and template verification commands

**Interfaces:**
- Consumes: template locations `site/lib/site.config.tsx`, `site/lib/content.config.ts`, `site/content/blog/`, `site/components/ui/TweaksPanel.tsx`, and `site/lib/tweaks.config.ts`.
- Produces: owner-facing workflows that edit the new template at valid paths without changing its public/private boundary.

- [x] **Step 1: Rewrite `update-website` around the template's content owners**

Document that brand identity and CTA data live in `site/lib/site.config.tsx`, reusable page content lives in `site/lib/content.config.ts`, page composition lives under `site/app/(site)/` and `site/components/`, and public posts live in `site/content/blog/`.

- [x] **Step 2: Run a path validation before and after the rewrite**

Run:

```bash
test -f site/lib/site.config.tsx
test -f site/lib/content.config.ts
test -d site/content/blog
test -f site/components/ui/TweaksPanel.tsx
test -f site/lib/tweaks.config.ts
```

Expected: every documented owner path exists in the migrated template.

- [x] **Step 3: Rewrite `publish-content` for the new MDX public-content boundary**

Document that an explicitly approved root `content/` draft is copied into `site/content/blog/` only after the public MDX frontmatter is valid, keeping the root draft private. Require `npm run content:qa` and `npm run build` in `site/` after a publishable change.

- [x] **Step 4: Update `live-preview-tweaks` to the template panel contract**

Document the existing `site/components/ui/TweaksPanel.tsx` and `site/lib/tweaks.config.ts` interface, require a preview-only mount, and prohibit production exposure unless explicitly approved.

- [x] **Step 5: Verify the skill instructions reference only real paths**

Run:

```bash
rg -n 'site/(lib/site\.config\.tsx|lib/content\.config\.ts|content/blog|components/ui/TweaksPanel\.tsx|lib/tweaks\.config\.ts)' .claude/skills
```

Expected: the rewritten skills reference the migrated template's real public-site locations.

### Task 3: Install, validate, commit, and recheck the boundary

**Files:**
- Modify: `site/package-lock.json` only if `npm ci` requires no source changes
- Verify: `site/`, root `scripts/verify-build-boundary.mjs`, Git history

**Interfaces:**
- Consumes: migrated template and adjusted site-management skill instructions.
- Produces: a verified local main commit, ready for a separately authorized deployment.

- [x] **Step 1: Install exact template dependencies**

Run:

```bash
npm --prefix site ci --ignore-scripts
```

Expected: dependencies match the migrated `site/package-lock.json`; no package manifest drift.

- [x] **Step 2: Run the template's focused validation wall**

Run:

```bash
npm --prefix site run typecheck
npm --prefix site test
npm --prefix site run verify
```

Expected: TypeScript, template tests, content QA, lint, production build, and audit all pass.

- [x] **Step 3: Recheck the starter's public-build boundary**

Run:

```bash
npm run verify:build-boundary
```

Expected: no private Business OS root folder is traced into the public site build.

- [x] **Step 4: Inspect the final changes and commit to main**

Run:

```bash
git status --short
git add site .claude/skills/update-website .claude/skills/publish-content .claude/skills/live-preview-tweaks docs/superpowers
git commit -m "feat(starter): adopt current new-build website template"
git status --short --branch
```

Expected: one clean `main` commit containing the template migration, skill alignment, and its implementation records.

## Self-Review

- Spec coverage: Task 1 implements the `site/`-only replacement boundary; Task 2 updates the website-management skills; Task 3 validates and commits the result.
- Placeholder scan: no unresolved tasks, paths, or validation commands remain.
- Consistency: all managed website paths are rooted under `site/`, while private Business OS paths remain at the repository root.
