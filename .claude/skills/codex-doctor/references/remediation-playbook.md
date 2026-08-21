# Codex Doctor Remediation Playbook

## Choose the Smallest Durable Decision

### Keep

Keep a skill when its outcome, instructions, and routing are current.

### Tighten

Shorten always-loaded metadata when the body already holds the procedure. Keep
the trigger words needed for model routing.

### Split

Move stable detail into `references/` when a long body is hard to navigate.
Leave the workflow, routing rules, and reference map in `SKILL.md`.

Check Markdown fences before and after the split.

### Rewrite

Rewrite when users still need the outcome but the implementation names old
repositories, tools, frameworks, providers, or paths.

Preserve proven business rules. Replace procedures with current source-backed
steps.

### Remove

Remove only when the outcome is obsolete or fully covered elsewhere. Confirm:

- No current repository caller
- No user-facing invocation need
- No other agent surface evidence
- A real successor covers the outcome
- No bundled resource remains referenced

## Repair Canonical Sources

Edit the authored source. Keep runtime mirrors as symlinks when formats permit.

Use relative links inside repositories. A project mirror should not point to a
home directory or another repository.

Global skills belong outside product repositories. Mirror them into runtime
skill roots from one machine-level canonical source.

## Replace Stale Calls

When a named successor skill does not exist:

1. Determine the intended outcome.
2. Find an available skill that fully owns it.
3. Otherwise write the direct procedure using current repository primitives.
4. Do not invent a slash command.

## Repair Wrong-Repository Guidance

Verify each replacement from:

- Imports and callers
- Framework and package manifests
- Database types and migration configuration
- Runtime environment configuration
- Provider project metadata
- Auth middleware and route checks
- Deployment topology

Do not replace one stale document claim with another document claim.

## Add Checks Carefully

Automate silent, syntactic failure classes. Examples include dangling links,
unbalanced fences, missing hook executables, and nonexistent package commands.

Do not automate semantic truth with a broad word list.

Add fixtures for:

- Known failure
- Valid path
- Generated output
- Ignored runtime artifact
- Optional reference
- Example containing forbidden text
- Intentional deletion

## Protect Concurrent Work

If the primary checkout is dirty:

1. Record the unrelated changes.
2. Use the repository's worktree or branch workflow.
3. Edit only task-owned files.
4. Stage explicit filenames.
5. Recheck the primary checkout before handoff.

## Verify the Repair

Use the proof appropriate to the failure:

| Failure | Required proof |
|---|---|
| Broken hook path | Safe execution from outside the repository |
| Symlink portability | Fresh clone |
| Missing command | Manifest lookup and command execution |
| Wrong framework or provider | Source or live provider evidence |
| Skill routing | Trigger evaluation and direct invocation |
| Context bloat | Before and after metadata measurement |
| CI race | Named job registered and terminal |

Do not claim a broader result than the proof supports.
