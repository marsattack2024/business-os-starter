---
name: manage-capabilities
description: Review, add, or update optional project skills and account connections without overwriting the owner's trained Business OS. Use when the owner asks to install a skill, add a plugin, connect a tool, update capabilities, or asks what belongs locally versus globally.
---

# Manage capabilities

Read `docs/skills-connections-and-updates.md` and `capabilities/catalog.json` first.

## Route the request

- A **skill** is readable project guidance. Keep business-specific skills project-local.
- An **MCP or OAuth connection** grants access to the signed-in owner's service. Never store its credential in the repo.
- A **plugin** may combine skills and connections. Inspect both before recommending it.

## Add an optional skill

1. Use only an entry already listed in `capabilities/catalog.json`. If it is not listed, stop with a short source/license/authority review for the owner; do not install it yet.
2. Confirm the owner explicitly wants that capability now.
3. Inspect the pinned source and the selected skill, including referenced files and scripts.
4. State what it can read, write, publish, spend, or connect to.
5. Resolve the selected skill's target directory under `.claude/skills/`. If
   that directory already exists or is a symlink, stop before running `npx`;
   do not let an installer overwrite or merge into a trained skill.
6. Run only the pinned, project-local command from the catalog. Never add `-g`, `--global`, `--all`, or substitute `@latest`.
7. Inspect the resulting Git diff. Never overwrite an existing or locally trained skill; stop and show the conflict instead.
8. Add the installed skill directory name to `.skill-paths.txt`. That file is the explicit project inventory; do not add anything that was not actually installed and reviewed.
9. Run `npm run check` and report what was actually proven.

Installing a skill does not authorize publishing, deploying, sending, spending, or connecting an account.

## Update a capability

Do not run a bulk updater. Compare the pinned old and proposed new sources, update the catalog record, and land the reviewed diff through Git. Owner-created and modified skill content must survive unchanged unless the owner explicitly accepts the shown edit.
