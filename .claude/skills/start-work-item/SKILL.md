---
name: start-work-item
description: Create a separate, source-aware workspace for a client, case, matter, job, property, project, or engagement. Use when the owner begins repeat work with its own facts, files, rules, status, and deliverables.
---

# Start a work item

Read `work/README.md` and `work/_template/` first.

## Steps

1. Ask what the owner calls this unit of work and what outcome makes it complete.
2. Choose a short lowercase slug with dashes. Refuse to overwrite an existing folder.
3. Copy `work/_template/` to `work/<name>/`. The root path stays `work/` for every industry.
4. Fill `context.md`, `rules.md`, `status.md`, and `tasks.md` from known information. Mark unknowns; never invent a fact.
5. Put supplied originals in `sources/`. Record their origin and preserve the original file.
6. Tell the owner what was created, what is still unknown, and the next action.

## Boundaries

- Never carry facts, rules, sources, or results between work items.
- A client/account and a work item are not automatically the same; one client may have several matters or projects.
- Save finished output in `deliverables/`, not beside source material.
- Creating a work item does not send, publish, file, sign, spend, or deploy anything.

## Done when

The new folder has a clear objective, current status, next action, governing rules, and a named place for sources and deliverables.
