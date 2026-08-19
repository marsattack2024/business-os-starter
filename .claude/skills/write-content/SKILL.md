---
name: write-content
description: Write a blog post, newsletter, or social post in the owner's voice. Use when the owner asks for a post, an article, a newsletter, a caption, or something to publish.
---

# Write Content

## Read first

- `context/rules.md` — what this business may never claim or do. These rules beat anything below.
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

## Save the private draft

`content/YYYY-MM-DD-<platform>-<topic>.md` — use today's date, for example `content/YYYY-MM-DD-blog-why-most-quotes-go-cold.md`.

Start every draft with these four lines, exactly, before the writing itself:

```
---
title: Why most quotes go cold
date: YYYY-MM-DD
published: false
---
```

This folder is private: no draft saved here appears on the website. Do not
change that value as a shortcut. For a blog post, show the finished draft to
the owner and wait for explicit approval. Only then use **publish this post**
to make a public copy in `site/content/`. Newsletters and social posts stay
private drafts until the owner sends or publishes them through their chosen
channel.

## Done when

- The draft is saved in `content/`, with the platform in the filename.
- The file starts with the four-line block and stays `published: false`.
- The owner knows this is a private draft and that website publication is a separate explicit request.
- Every fact in it came from `context/`, from the owner, or from something you actually looked up.
- The owner has seen it.
