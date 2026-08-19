---
name: save-my-work
description: Save the session's work to GitHub. Use when the owner says save my work, I'm done, back this up, or at the end of a working session.
---

# Save My Work

The end-of-session ritual. Everything made today gets a safe copy on GitHub, where it can't be lost with a laptop.

The owner does not need to understand git. Do the steps, then tell them in one sentence that their work is backed up.

## Read first

Nothing. This one is about what just happened, not what's known.

## Steps

1. Look at both unstaged and already staged work:

   ```bash
   git status --short
   git diff --cached --name-only
   ```

   If the staged list is not empty, reconcile every staged path with the owner
   before adding anything else. Never mix unknown work into today's save.

2. Say it back in plain language before saving anything — file names in English, not paths. "Today you made a follow-up email for Maria, a blog post about pricing, and changed the headline on your homepage." If the owner says something shouldn't be saved yet, leave it out.

3. Check the candidate files before staging them. Never save `.env`, credentials,
   tokens, cookies, private keys, or an unexplained large generated folder. Do
   not open secret values just to decide this; the filename and source of the
   change should be enough. If a suspicious file is present, leave it unstaged
   and explain why.

4. Stage only the named files the owner intends to keep. Never stage every
   changed path in one sweep:

   ```bash
   git add -- <approved-path-1> <approved-path-2>
   git diff --cached --name-only
   git diff --cached --stat
   git diff --cached --check
   git commit -m "<what got made today, in plain words>"
   git push
   ```

   Read the staged file list back in plain language before committing. The
   commit message is a sentence the owner would recognize in six months.

5. Confirm in one sentence: "Saved. Your work is on GitHub — you could lose this laptop and get everything back."

6. If something goes wrong, stay calm and explain it in one line:
   - **"nothing to commit"** — nothing changed since last time. Say "already saved, nothing new to back up."
   - **push is rejected** — someone or something else saved first. Run `git fetch`, compare the two histories, and preserve both sets of work. Do not force-push or blindly rebase unknown work.
   - **no remote / repository not found** — the repo isn't connected to GitHub yet. Tell the owner that plainly and offer to set it up; don't try to guess a repository address.
   - **asks for a password** — it needs them to sign in to GitHub. Walk them through it. Never type or store a password or token yourself.

7. Run `git status --short` again. Close with one line about anything deliberately left unsaved and what is worth picking up next time.

## Save it

Nothing new to write — this skill saves everything else. `git log` is the record.

## Done when

- `git status` is clean, or the only things left are what the owner asked to hold back.
- The push succeeded.
- The owner heard a plain-English sentence confirming it.
