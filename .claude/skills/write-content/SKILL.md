---
name: write-content
description: Write a blog post, newsletter, or social post in the owner's voice. Use when the owner asks for a post, an article, a newsletter, a caption, or something to publish.
---

# Write Content

## Read first

- `context/voice.md` — the sample is the target. Read it twice.
- `context/customers.md` — you are writing to one person from this file
- `context/gtm.md` — the angles worth writing about (skip if it's still empty)
- `context/offer.md` — if the piece points at anything they sell

## Steps

1. Settle three things before writing. Ask only for what the owner hasn't said:
   - What is this, and where does it go? (blog post, newsletter, Instagram, LinkedIn)
   - What's the one idea?
   - Is there a real story, customer, or number behind it?

   If the owner has no idea in mind, offer three drawn from `context/gtm.md` and `context/goals.md`, and let them pick.

2. Write it for the length that platform actually wants. A LinkedIn post is not a blog post with line breaks.

3. Rules that hold every time:
   - Open with something true and specific — a moment, a number, a thing a customer said. Never open with a definition or "In today's world."
   - One idea per piece. A second good idea is a second piece; note it in `context/goals.md`.
   - Real details only. If you need a story the owner hasn't told you, ask for it — do not invent a customer, a result, or a number.
   - End with one thing to do, or one thing to think about. Pick one.

4. Read it back against `context/voice.md`. Cut anything that sounds like marketing rather than like the owner.

5. Show the draft. Say which idea you built it on and what you'd cut if it needs to be shorter.

6. If the owner rewrites a line in their own words, that's voice data — add the pattern to `context/voice.md` in the same turn and say so.

## Save it

`content/YYYY-MM-DD-<platform>-<topic>.md` — for example `content/2026-08-22-blog-why-most-quotes-go-cold.md`.

Start the file with these four lines, exactly, before the writing itself:

```
---
title: Why most quotes go cold
date: 2026-08-22
published: true
---
```

`published: true` is what puts the piece on the owner's website — it shows up on the homepage under "Latest writing" and at `/blog`. Set it that way for a **blog post or a newsletter**, which is where it belongs.

Write `published: false` for anything that isn't a page on their site — an Instagram caption, a LinkedIn post, a script. Same file, same folder, just not on the website.

## Done when

- The draft is saved in `content/`, with the platform in the filename.
- The file starts with the four-line block, and `published:` is true or false on purpose.
- If it's true, tell the owner it's on their site now, where to look, and that changing that one word to `false` takes it down.
- Every fact in it came from `context/`, from the owner, or from something you actually looked up.
- The owner has seen it.
