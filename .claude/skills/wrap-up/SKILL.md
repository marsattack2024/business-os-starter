---
name: wrap-up
description: Finish a working session cleanly: verify what changed, back up intended work, capture useful efficiency lessons, and inventory local branches, worktrees, and stashes without deleting unknown work. Use when the owner says wrap up, close this out, finish for today, or asks for session status.
---

# Wrap Up

Finish the session without turning cleanup into another project.

## 1. Reconcile what exists

Run:

```bash
git status --short
git diff --cached --name-only
git branch --show-current
git stash list
git worktree list --porcelain
```

Read `.session-observations.md` if it exists. Treat it as temporary evidence,
not a permanent backlog. Distinguish work completed in this session from
unknown or separately owned work.

## 2. Prove the result in proportion to risk

- If code, site structure, packages, scripts, or skills changed, run
  `npm run check` once near the end.
- If only business context or a private draft changed, inspect those exact
  files and use the matching skill's focused completion check. Do not buy a
  full build merely for ceremony.
- State separately what was drafted, approved, committed, pushed, published,
  sent, connected, or deployed. Never let one receipt stand in for another.

Fix a small in-scope defect found by the proof. Do not expand into unrelated
improvements just because wrap-up noticed them.

## 3. Save intended work

Follow `save-my-work` for the files that should survive. A wrap-up request
authorizes backup to the repository's existing private GitHub remote; it does
not authorize a public publish, provider write, send, spend, deployment, new
account connection, or force-push.

## 4. Clean without losing work

Classify every visible branch, worktree, and stash as current, separately
owned, safely absorbed, or uncertain. Remove only a throwaway artifact created
by this session when its useful work is proven elsewhere and its ignored state
has been checked. Never delete a branch, worktree, stash, or untracked file
because it is merely old, merged-looking, or inconvenient.

Do not delete dependency folders or build caches by default. Mention unusually
large disposable state when it matters; cleanup must save more time than it
costs.

## 5. Distill the learning

From the temporary observations, report only:

- repeated friction, rework, waiting, or avoidable spend;
- an efficiency that should be repeated;
- the smallest owning fix, if one is justified;
- one concrete next action for anything still open.

When a lesson is durable and the owning instruction is obvious, update that
skill, rule, test, or document now and verify it. Otherwise record it once in a
substantial project wrap-up note under `content/`; do not create a permanent
lesson file for routine noise. Clear `.session-observations.md` only when this
session created it or its owner and contents are confirmed fully absorbed.
Otherwise preserve it and name that fact in the report.

## Final report

In plain language, give the owner:

1. what is complete;
2. what proof passed;
3. what is saved remotely and what is not public/deployed/sent;
4. local branch/worktree/stash status and any item deliberately preserved;
5. the important efficiency lesson and next action.

Keep it short enough to read once. Do not make the owner reconstruct the
session from tool logs.
