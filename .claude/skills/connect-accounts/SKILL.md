---
name: connect-accounts
description: Connect an outside account so the employee can work in it directly — ads, email, YouTube, analytics. Use when the owner wants to connect something, or a skill said a connection was needed first.
---

# Connect an Account

> **Read this first.** Right now the employee writes things and the owner posts them. Connecting an account removes that step for one tool. It takes 10–30 minutes per tool and it's a one-time job.

## Read first

- `.env.local` in the repo root, if it exists — what's already connected
- The skill that sent them here, so you know exactly which connection is needed

## Steps

1. Ask what they're trying to stop doing by hand. Connect that one thing. Connecting everything on a Saturday is how people end up with five half-connected tools.

2. Tell them the honest picture for that tool, in one or two sentences:
   - **Some tools connect in one click** — sign in with the account they already have.
   - **Some need a key** — a long password-like string they copy from the tool's website and paste into a file here.
   - **Some need a developer account first** — real setup, usually 20+ minutes, sometimes an approval wait. Say so before they start, not halfway through.

3. Walk them through it **one step at a time**. Wait for "done" before the next step. Never send a numbered list of eight steps — they'll get lost on step three and blame themselves.

4. Keys and passwords:
   - The owner pastes their own key into `.env.local` themselves. You never type it, never ask them to send it in chat, never put it in any other file.
   - `.env.local` is already ignored by git, so keys never reach GitHub. Tell them that — it's the thing they're quietly worried about.
   - If they paste a key into the chat by accident, tell them immediately to go to that tool's website and delete it, then make a new one.

5. Test it before saying it's connected. Do the smallest real thing — read one number, list one campaign, load one video title. Show them the result. A connection nobody tested isn't a connection.

6. Write down what got connected in `context/business.md` under a **Connected tools** heading: the tool, what it can now do, and the date.

## Save it

`content/YYYY-MM-DD-connected-<tool>.md` — what was connected, what it can now do, and how to disconnect it if they change their mind.

## Done when

- One tool is connected and a real test came back with real data.
- The key lives only in `.env.local`.
- `context/business.md` lists the tool under Connected tools.
