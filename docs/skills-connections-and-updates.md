# Skills, connections, and updates

This repository has three different kinds of capability. Keeping them separate makes it easier to understand what the AI can do and what authority it has.

## Skills are instructions

The included skills live in `.claude/skills/`. The `.agents/skills` and `.codex/skills` links make that same project-local set available to different AI tools. There is only one copy to train.

You do not need to run an installer for the included skills. If you improve one, the change stays in this repository and can be reviewed like any other file.

## Connections grant account access

An MCP or account connection lets the AI use a service on behalf of the signed-in owner. It is not a skill and it does not belong in Git. Each owner signs into their own account. Never copy another person's token, cookie, workspace ID, or `.env` value into this repository.

Start with read-only discovery. Add write authority only for a named outcome. A successful connection is proven by one smallest useful read, not by seeing a credential on disk.

## Optional capabilities are curated

Optional third-party skills are listed in `capabilities/catalog.json`. The catalog pins the installer version, source commit, and exact skill. It does not authorize an automatic install.

Before adding one:

1. Read its source, references, scripts, and license.
2. Explain what new tools or authority it requests.
3. Confirm it is useful for this business now.
4. Refuse the install if its target directory already exists; an update must
   never overwrite a trained skill.
5. Install only that selected skill, project-local.
6. Record the installed directory in `.skill-paths.txt`, inspect the Git diff,
   and run `npm run check`.

Never bulk-install a collection, install globally, or run a mutable `@latest` command for a beginner's workspace. A skill is executable guidance; treat an unknown skill like unknown code.

## How updates work

Core starter updates arrive as a reviewable repository change, not a background update. The update must:

- show the owner what will change;
- leave business context, private work, and credentials untouched;
- never silently overwrite a locally trained skill;
- keep owner-created skills outside managed ownership;
- support declining or reverting the update.

There is no blind “update everything” command. Until a conflict-aware updater exists, compare and merge an update through Git so local changes remain visible.

## What belongs where

| Need | Correct home |
|---|---|
| How this business writes or works | A project-local skill |
| Business facts, voice, offers, or rules | `context/` |
| A case, client, job, or project | `work/<name>/` |
| Shared accountability and goals | The owner's Agents First connection |
| Access to an outside service | The owner's MCP/OAuth connection |
| A reusable optional method | A reviewed entry in the capability catalog |
