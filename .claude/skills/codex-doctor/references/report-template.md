# Codex Doctor Report Template

## Verdict

State whether the harness is healthy, partly healthy, or unsafe. Name the
highest-impact failure and the evidence boundary.

## What Already Works

Separate proven working behavior from assumptions. Examples:

- Canonical instruction source
- Resolving skill mirrors
- Registered hooks
- Existing mechanical checks
- Current context budget

## Findings

| Priority | Component | Layer | Verdict | Evidence | Recommended action |
|---|---|---|---|---|---|
| Critical–Low | Path or skill | Mechanical or semantic | Keep, tighten, split, rewrite, remove, unresolved | Command, path, or live result | One bounded action |

## Context Inventory

| Skill | Canonical scope | Mirrors | Invocation mode | Description size | Decision |
|---|---|---|---|---:|---|

Report the total description characters and estimated tokens. State the context
window assumption instead of presenting the estimate as exact.

## Symlink Map

Show canonical ownership:

```text
authored source
├── runtime mirror
└── runtime mirror
```

Call out real configuration files that cannot be mirrors.

## Previous Fixes Versus Remaining Work

Explain which earlier changes repaired plumbing and which semantic risks remain.
A passing wiring check does not validate the content it loads.

## Recommended Order

Rank three to six changes by impact and effort:

1. Silent safety failures
2. Wrong repository or provider guidance
3. Broken execution references
4. Portability and canonical ownership
5. Context and progressive disclosure

## Confirmation Gate

In audit mode, end with the exact files or categories proposed for repair. Do not
edit until the user confirms.

## Repair Receipt

After an authorized repair, add:

- Branch and commit
- Pull request
- Local checks
- Fresh-clone checks
- CI terminal result
- Residual findings
- Unrelated work left untouched
