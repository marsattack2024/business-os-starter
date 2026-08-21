# Codex Doctor Audit Lenses

Load this file during the semantic audit. The mechanical script narrows the
search. These lenses decide what the evidence means.

## 1. Authority and Precedence

- Identify the highest-priority repository instruction file.
- Find nested instruction files that narrow behavior by path.
- Confirm mirrors resolve to one authored source.
- Flag copied doctrine that can drift independently.
- Confirm lower-level skills do not weaken repository rules.
- Treat source code and executable checks as stronger than prose.

## 2. Context and Routing

- Count each canonical skill once.
- Measure frontmatter descriptions separately from skill bodies.
- Model-routed skills need realistic trigger language.
- Manually invoked skills need concise outcome descriptions.
- Flag descriptions that contain procedures, examples, or history.
- Treat body length as a navigation signal, not a deletion rule.
- Split long bodies on coherent boundaries without breaking code fences.

The exact invocation metadata differs by runtime. Read the local convention
before interpreting a field.

## 3. Skill Semantics

For every named path, command, skill, and external target:

- Resolve repository-relative and skill-relative paths.
- Distinguish required input, generated output, optional input, and example.
- Verify package commands against the actual manifest.
- Verify script commands against executable files and current arguments.
- Confirm successor skills exist before replacing a missing skill call.
- Confirm the named framework matches lockfiles and imports.
- Confirm database and project identifiers from configuration or provider state.
- Confirm auth guidance from real route boundaries and middleware.
- Confirm deployment guidance from current operations configuration.

Search for old repository names and concepts. Common residue includes admin
registries, monorepo paths, copied database types, old framework APIs, and
machine-specific home directories.

## 4. Skill Lifecycle

Use evidence across every available invocation surface:

- Repository references
- Claude history or configuration
- Codex history or configuration
- Cursor history or configuration
- Automation, hooks, and scripts
- Explicit user invocation
- Replacement skill coverage

Absence from one log does not prove a skill is dead.

Remove a whole skill only when its outcome is obsolete or fully replaced.
Rewrite it when the outcome remains useful but its procedure is stale.

## 5. Hooks

- Parse the actual hook configuration.
- Confirm the command target exists.
- Confirm interpreter and executable requirements.
- Confirm project-root resolution does not depend on current working directory.
- Inspect failure behavior. Decide whether policy should fail open or closed.
- Check whether wrapper failures are visible.
- Confirm payload parsing matches the runtime's hook schema.
- Test outside the repository only when the test is safe.

Hooks have greater blast radius than skill prose. A broken hook can silently
remove a safety boundary from every task.

## 6. Symlinks and Mirrors

- Inspect both tracked symlinks and machine-local agent mirrors.
- Require repository symlinks to be relative.
- Reject links that point outside the repository unless they are deliberately
  machine-local and ignored.
- Confirm fresh-clone resolution.
- Avoid double-counting mirrored directories.
- Preserve real files when runtimes require different configuration formats.

A resolving link in the current checkout is weak evidence. The machine that
created an absolute link can make the defect invisible.

## 7. Mechanical Checks

A durable check should catch one well-defined failure class with low noise.

Before shipping a check:

- Plant one known-bad fixture and prove the check fails.
- Prove valid generated or ignored paths pass.
- Prove examples and quoted forbidden patterns do not become false positives.
- Prove intentional deletions do not crash the checker.
- Keep semantic claims out of regex-only checks.

If every reported error is noise, delete or redesign the check.

## 8. Git and CI Workflow

- Preserve unrelated dirty work.
- Inspect worktrees and open pull requests before shared-file changes.
- Branch before editing when repository rules require it.
- Stage filenames, not broad directories.
- Rebase or merge current upstream before final verification.
- Run local gates after reconciliation.
- Wait for the named CI job to appear and finish.
- Separate merge, deployment, migration, and provider changes.

## 9. Reporting

Every finding needs:

- Severity
- Component and canonical source
- Mechanical or semantic classification
- Evidence
- User impact
- Recommended decision
- Confidence or unresolved evidence

Explain what a passing check proves. Also explain its boundary.
