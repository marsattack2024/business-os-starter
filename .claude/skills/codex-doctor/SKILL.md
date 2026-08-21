---
name: codex-doctor
description: Audit and repair a repository's AI-agent harness — CLAUDE.md/AGENTS.md, skills routing, hooks, symlink mirrors, stale paths, and fresh-clone portability. Use for "codex doctor", agent-context cleanup, or skills not loading. Not for general application bugs.
---

# Codex Doctor

Diagnose the repository machinery that guides coding agents. This skill audits
both whether the machinery loads and whether its instructions still describe the
repository.

The default mode is read-only. A green mechanical check proves wiring, not
semantic accuracy.

## Modes

| Mode | Behavior |
|---|---|
| `audit` | Inspect, rank findings, and stop before changes. This is the default. |
| `fix` | Audit first, then repair findings the user explicitly placed in scope. |
| `verify` | Re-run the applicable proofs after a prior repair. |

If the request does not clearly authorize changes, use `audit`.

## What This Skill Owns

- Agent instruction files and their precedence
- Project and global skill routing
- Skill metadata, trigger descriptions, and context cost
- Hook configuration and executable resolution
- Symlink mirrors and fresh-clone portability
- Stale paths, commands, frameworks, providers, databases, and successor skills
- Agent workflow safety around worktrees, staging, pull requests, and CI

Use `audit-360` for a whole product or codebase scorecard. Use `codex-doctor`
when the subject is the agent harness itself.

## Phase 0: Protect the Workspace

Before the audit:

1. Resolve the repository root.
2. Read the repository instruction files that govern this task.
3. Run `git status --short --branch` and `git worktree list --porcelain`.
4. Record unrelated changes and active worktrees.
5. Make no edits, staging changes, branches, or external mutations in audit mode.

Docs can be stale. Verify claims against source, configuration, executable
checks, Git state, and provider state when relevant.

## Phase 1: Establish Canonical Ownership

Inventory these surfaces when present:

- `CLAUDE.md`, `AGENTS.md`, and nested instruction files
- `.claude/`, `.codex/`, `.cursor/`, `.agents/`
- Repository scripts that validate or generate agent configuration
- Package commands that run harness checks
- Global skills referenced by project instructions

Resolve every symlink and real path. Group mirrors by canonical target so one
skill is not counted several times.

Classify each skill as:

- **Project-authored:** the source travels with this repository.
- **Global-authored:** one machine-level source serves many repositories.
- **Project mirror:** a symlink to an authored project skill.
- **Plugin or system skill:** owned by an external package.
- **Copy fork:** duplicated content with no shared source.
- **Broken mirror:** dangling, absolute when portability matters, or misdirected.

Do not replace plugin or system roots wholesale. Edit the authored source only.

## Phase 2: Run the Mechanical Audit

Resolve this skill's directory, then run:

```bash
python3 <skill-directory>/scripts/doctor_audit.py \
  --root "$(git rev-parse --show-toplevel)" \
  --format markdown
```

Add `--include-global` when the audit includes total machine-level skill context.

The script checks:

- Unique skills and mirrored copies
- Description size and estimated listing cost
- Invocation mode
- Balanced Markdown fences
- Tracked and local agent-surface symlinks
- Hook command resolution and current-working-directory dependence
- Backticked path candidates
- Referenced package commands
- Machine-specific absolute paths

Treat script findings as evidence candidates. It cannot determine whether a
path is an input, generated output, optional reference, or prose example.

If the repository already has a doctor or harness command, run it too. Record
what each command proves and what it cannot prove.

## Phase 3: Audit Meaning

Read `references/audit-lenses.md`. Apply every relevant lens.

For each skill or instruction:

1. Resolve named paths against the repository root and the skill directory.
2. Confirm commands from package manifests or executable files.
3. Confirm named skills exist in the current runtime or repository.
4. Verify framework, database, project, provider, auth, and deployment claims
   from source or live evidence.
5. Separate broken inputs from generated outputs and guarded optional files.
6. Search for old repository names, home-directory paths, obsolete admin
   surfaces, and copied architecture.
7. Compare instructions with their actual imports, callers, routes, scripts,
   schemas, and configuration.

Do not call a skill unused from one tool's logs. Claude, Codex, Cursor, users,
plugins, and automation can invoke the same skill through different surfaces.

Take a position only when evidence supports it:

- **Keep:** current, useful, and correctly routed.
- **Tighten:** valid skill with excessive metadata or duplicated doctrine.
- **Split:** valid body needs progressive disclosure.
- **Rewrite:** valid outcome, obsolete procedure.
- **Remove:** obsolete outcome with no current caller or replacement need.
- **Unresolved:** evidence is insufficient.

## Phase 4: Test Silent-Failure Surfaces

Silent failures deserve stronger proof because absence can look like success.

### Hooks

Inspect each hook command before execution. Confirm its target exists and its
path does not assume the repository is the current directory.

Execute a hook from outside the repository only when inspection proves the test
is read-only and the payload cannot trigger a mutation. Otherwise report the
execution test as blocked by safety.

### Symlinks

Check tracked links with Git and inspect local agent mirrors. Repository links
must be relative and resolve.

For committed repairs, clone the branch into a temporary directory and repeat
the mirror check there. A local working copy can hide absolute-link failures.

### CI

Wait for the named CI job to register and reach a terminal state. “No pending
checks” is not proof because it is also true before a workflow appears.

## Phase 5: Report and Stop

Use `references/report-template.md`.

Rank findings in this order:

1. **Critical:** a safety control appears active but never runs.
2. **High:** instructions target the wrong repository, provider, database, auth
   boundary, deployment path, or destructive workflow.
3. **Medium:** missing paths, unavailable successor skills, copy forks, stale
   snapshots, and non-portable local dependencies.
4. **Low:** context bloat, long bodies, duplicated explanation, and naming drift.

Report mechanical and semantic findings separately. Name the evidence for every
verdict. Stop after the report unless `fix` was explicitly authorized.

## Phase 6: Repair

Read `references/remediation-playbook.md` before changes.

The repair order is:

1. Restore safety controls and correct wrong targets.
2. Repair canonical ownership and portable mirrors.
3. Rewrite valid workflows that describe obsolete procedures.
4. Remove proven dead content.
5. Reduce always-loaded context.
6. Split long on-demand bodies when it materially improves navigation.

Preserve unrelated work. Use an isolated branch or worktree when the primary
checkout is dirty. Stage explicit filenames.

Do not ship a checker whose findings are mostly false positives. Calibrate it
against generated outputs, optional files, ignored runtime artifacts, examples,
and guidance that quotes forbidden patterns.

## Phase 7: Verify and Deliver

Run the repository's applicable gates and the mechanical audit again.

For symlink or portability changes, use a fresh clone. For hook changes, test
safe hooks from a non-root directory. For semantic changes, repeat the stale
reference searches against the final diff.

Open a pull request when the repository workflow requires one. Report:

- Commit and pull request
- Exact checks run
- Fresh-clone evidence
- CI terminal state
- Unresolved findings
- Untouched unrelated work

## Bundled Resources

- `references/audit-lenses.md`: detailed semantic inspection lenses
- `references/report-template.md`: audit and repair report shape
- `references/remediation-playbook.md`: durable repair decisions
- `scripts/doctor_audit.py`: dependency-free mechanical audit
- `tests/test_doctor_audit.py`: script regression tests
- `evals/README.md`: latest evaluation results and rerun instructions
- `evals/trigger-cases.json`: trigger and non-trigger examples
- `evals/audit-rubric.md`: skill evaluation rubric
