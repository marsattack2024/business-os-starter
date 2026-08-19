---
name: prototype-an-idea
description: Make a quick local prototype to answer one uncertain product or workflow question. Use when the owner wants to see or try an idea before deciding whether to build it; do not use this skill to publish or launch it.
---

# Prototype an Idea

A prototype answers a question. It is not the first version of a product.

## Start with the decision

State the one thing the owner needs to learn, in plain language: for example,
"Can a customer understand this flow without help?" or "Which of these three
layouts makes the choice clearest?"

Read the relevant files in `context/` before using the business's customers,
offers, voice, or rules. Ask one short question only when a missing answer would
change what gets tested.

## Make the cheapest useful proof

- For logic or a workflow, make one small self-contained local experience.
- For look and feel, make a few meaningfully different options rather than
  polishing one guess.
- Put disposable prototype files under `/tmp/business-os-prototypes/<name>/`
  by default. Do not create a branch, worktree, or tracked application just to
  hold a temporary experiment.
- Keep state in memory and label example content as sample data. Never use real
  customer data, credentials, or claims that are not supported by `context/`.
- Do not add a database, login, payment, analytics, email send, provider SDK, or
  external API. If one of those appears necessary, simulate its result locally;
  the purpose is to test the idea, not its infrastructure.

Run the prototype locally and let the owner try the question it was built to
answer. Fix only what prevents that test. Then report one outcome: keep the
idea, change it, or stop.

If the owner decides to build the idea inside the existing website, use
`build-a-tool`. If they explicitly ask to make a validated app public or share
it with other people, use `launch-a-small-app`. Do not deploy, connect an
account, or turn the prototype into production as part of this skill.

## Done when

- The named question has an observed answer.
- The prototype is still local, disposable, and free of real secrets or data.
- The owner knows what was learned and what the next decision is.
- Any temporary location is reported plainly; nothing is hidden in a stale
  branch or worktree.

Maintainers can review the source method and adaptation in
`references/provenance.md`.
