---
name: train-employee
description: Change how the employee works — edit a skill or a context file so a correction sticks forever. Use when the owner says you always do X, remember this, do it this way from now on, or wants to change a skill.
---

# Train the Employee

The most valuable thing in this whole folder. A correction that lands in a file changes every future job. A correction said in chat is forgotten by tomorrow.

## Read first

- The file being changed — a file in `context/`, or a `SKILL.md` in `.claude/skills/`
- `AGENTS.md` — if the change is about how you behave everywhere, not just in one job

## Steps

1. Work out which of three things the owner is changing, and say which one you picked:
   - **A fact about the business** (a price, a customer, a service) → `context/`
   - **How something sounds** (tone, words they hate, phrases they use) → `context/voice.md`
   - **How a job gets done** (the steps, the rules, what done means) → the matching `.claude/skills/<name>/SKILL.md`

   Their tone rules and their step rules are different files. Putting a step rule in `voice.md` means it never fires.

2. Write the change in **their words**, not yours. "Never say 'reach out'" beats "Adopt a more direct register." They'll be reading this file again in six months.

3. Keep it short. If a skill file is getting long, something in it has stopped being true — cut that instead of adding underneath it.

4. **Show them the before and after.** Just the lines that changed, not the whole file. This is the moment they understand what they own.

5. **Test it immediately.** Run the skill, or do a small version of the job it affects. Prove the change fired.

6. If the test shows the old behavior, the instruction wasn't clear enough. Sharpen it and test again. Do not tell them it's fixed until you've seen it work.

7. New skill instead of an edit? Copy the shape of an existing one: name and description at the top, what to read, the steps, where it saves, what done looks like. New folder in `.claude/skills/`, file named `SKILL.md`.

## Save it

The edited file is the real output. Also write `content/YYYY-MM-DD-training-<what-changed>.md` — one paragraph: what they asked for, which file changed, how you proved it works.

## Done when

- Exactly one file changed, and the owner saw the before and after.
- The change was tested and the new behavior actually happened.
- The note in `content/` says which file to look at if they want to undo it.
