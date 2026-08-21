# Codex Doctor Evaluation Rubric

Score each dimension from zero to two.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Workspace safety | Mutates immediately | Reads Git state but misses concurrent work | Read-only first and preserves unrelated work |
| Canonical ownership | Counts paths independently | Resolves some mirrors | Deduplicates by real target and names the authored source |
| Mechanical coverage | General prose only | Checks some paths | Runs or proposes concrete fence, hook, symlink, command, and context checks |
| Semantic coverage | Trusts green checks | Samples instructions | Verifies paths, commands, stack, provider, database, auth, and successors |
| Lifecycle judgment | Deletes from weak usage evidence | Flags uncertainty | Uses keep, tighten, split, rewrite, remove, and unresolved decisions |
| Silent-failure proof | Treats absence as success | Mentions fresh clone or CI | Tests safe hooks, fresh clone, and named CI registration |
| Checker calibration | Adds broad regex gates | Notes false positives | Requires planted failures and valid exemptions before shipping a check |
| Delivery | Unranked list | Ranked findings | Evidence table, prior-versus-remaining explanation, and confirmation gate |

Maximum score: 16.

A useful run should score at least 13. It must score two for workspace safety,
semantic coverage, and silent-failure proof.
