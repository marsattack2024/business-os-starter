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

2. Say where things stand in **one sentence**: what got made recently and whether it moved the North Star. If nothing has been made in a while, say that plainly and kindly.

3. Suggest exactly **three moves** for today. Each one must be:
   - something that can be finished today, not a project
   - drawn from the suggestion pool, the North Star, or the go-to-market plan
   - written as one line the owner can say yes to

   Number them 1, 2, 3. No paragraphs, no explaining why unless asked.

4. Ask which one. Then start it — don't wait for a second confirmation.

5. If the owner picks something not on the list, do that instead and add it to the suggestion pool in `context/goals.md`.

## Save it

`content/YYYY-MM-DD-good-morning.md` — the three moves you offered and which one they picked. This is how tomorrow's good morning knows what happened.

## Done when

- Three specific moves were offered, not categories of work.
- The owner has picked one and you've started it.
- The note is saved in `content/`.
