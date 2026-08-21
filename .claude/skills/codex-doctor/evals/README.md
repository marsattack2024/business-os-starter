# Codex Doctor Evaluations

## Initial Evaluation

The initial evaluation used one read-only repository audit with the skill and
one matched baseline without it.

| Rubric dimension | With skill | Baseline |
|---|---:|---:|
| Workspace safety | 2 | 2 |
| Canonical ownership | 2 | 1 |
| Mechanical coverage | 2 | 2 |
| Semantic coverage | 2 | 2 |
| Lifecycle judgment | 2 | 1 |
| Silent-failure proof | 2 | 2 |
| Checker calibration | 2 | 1 |
| Delivery | 2 | 2 |
| **Total** | **16/16** | **13/16** |

The baseline was already strong. The skill improved the repeatable parts:

- It grouped mirrors by canonical ownership.
- It required explicit keep, tighten, split, rewrite, remove, or unresolved
  decisions.
- It separated mechanical proof from semantic proof.
- It caught a guarded-command false positive and required calibration.

## Trigger Evaluation

`trigger-cases.json` contains 10 positive and 10 negative prompts. A blind
description-only classification matched all 20 expected decisions.

The negative set includes medical uses of “doctor,” application bugs,
dependency audits, database audits, marketing audits, and production operations.

## Mechanical Script Evaluation

The script has regression fixtures for:

- Relative mirror deduplication
- Absolute tracked symlinks
- Unbalanced Markdown fences
- Missing package commands
- Guarded missing package commands
- Gitignored runtime artifacts
- Generated output paths

It was also run read-only against a marketing repository, an agency monorepo,
and a SaaS monorepo. Those runs exposed and corrected nested-worktree traversal,
root-only manifest checks, hook shell-expansion parsing, and excessive Markdown
output.

## Re-run

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s <skill-directory>/tests -v
```

For trigger evaluation, classify only the `query` values using the current
frontmatter description. Compare the results with `should_trigger` afterward.
