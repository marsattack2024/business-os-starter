---
name: good-morning
description: The daily opener. Reads the business, looks at recent work, and suggests today's three moves. Use when the owner says good morning, what should I do today, or where are we at.
---

# Good Morning

The first thing the owner says most days. Keep it short and warm — they are holding a coffee, not reading a report.

## Read first

- `context/goals.md` — the North Star and the suggestion pool
- `context/business.md` — what the business is
- `context/gtm.md` — what we're going after right now (skip if it's still empty)
- The five most recent files in `content/` — the filenames start with dates, so the newest sort last

## Steps

1. Greet the owner by first name.

2. Say where things stand in **one sentence**.

   **If `content/` is empty — this is the very first morning.** Do not report emptiness. Instead, prove you know them: name their business, the thing they said they keep putting off (the North Star in `context/goals.md`), and the first job they said they'd hand an assistant. One sentence, in their words, not yours. *"You've been meaning to send a real newsletter for two years, and the first thing you'd hand me is following up with the people who came once and never came back — so let's start there."*

   **Otherwise**, say what got made recently and whether it moved the North Star.

3. Suggest exactly **three moves** for today. Each one must be:
   - something that can be finished today, not a project
   - drawn from the suggestion pool, the North Star, or the go-to-market plan
   - written as one line the owner can say yes to
   - **specific to this business** — never a generic marketing task. "Email the 14 people who came once in the last 90 days" beats "do some outreach."

   Number them 1, 2, 3. No paragraphs, no explaining why unless asked.

4. Ask which one. Then start it — don't wait for a second confirmation.

   **Exception:** if the owner is in a workshop or setup session and says to hold, stop after the three moves and wait. Starting a long job on top of a live session is unwelcome.

5. If the owner picks something not on the list, do that instead and add it to the suggestion pool in `context/goals.md`.

## Save it

`content/YYYY-MM-DD-good-morning.md` — the three moves you offered and which one they picked. This is how tomorrow's good morning knows what happened.

## Done when

- Three specific moves were offered, not categories of work.
- The owner has picked one and you've started it.
- The note is saved in `content/`.
