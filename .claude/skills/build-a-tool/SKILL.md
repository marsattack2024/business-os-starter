---
name: build-a-tool
description: Build a small working tool for the business — a calculator, quiz, form, or mini-app. Use when the owner wants something interactive on their site, or says they wish there was a thing that did X.
---

# Build a Tool

A small working thing on the owner's website: a price calculator, a quiz, an intake form, a booking helper. It lives inside their existing site, so there's nothing new to host and nothing new to learn.

## Read first

- `context/rules.md` — what this business may never claim or do. These rules beat anything below.
- `context/offer.md` — real prices, if the tool touches money
- `context/customers.md` — who's using it and what they already know
- `site/app/page.tsx` — the section-comment style to copy
- `site/app/globals.css` — the colors to reuse

## Steps

1. Get the tool down to **one sentence**: "someone types X and gets Y." If it takes two sentences, it's two tools — build the more useful one first and say so.

2. Ask what goes in and what comes out. For anything with numbers, get the actual math from the owner in their words. Never invent a pricing rule.

3. Build the smallest version that works:
   - One page at `site/app/tools/<tool-name>/page.tsx`
   - TypeScript, same as the rest of the site
   - Everything in one file until it genuinely won't fit
   - Reuse the colors and spacing from the existing site — a tool that looks bolted on gets ignored
   - Comment each part the way `site/app/page.tsx` does, so the owner can change the numbers later without asking anyone

4. No database, no accounts, no payments in the first version. If the tool needs to remember something or take money, build the version that doesn't, show it, and then talk about what connecting it would take.

5. Run `cd site && npm run build`. It must pass.

6. Have the owner try it while you watch. Give them three inputs to test, including a silly one. Fix what breaks.

7. Show the owner the local version and explain that it is ready for a separate
   explicit deployment request. Do not deploy, connect a host, or send anyone
   a public address as part of building the tool.

## Save it

`content/YYYY-MM-DD-tool-<name>.md` — what it does, the local route where the
owner tried it, and the numbers it uses so the owner can change them later.

## Done when

- `npm run build` passes.
- The owner has used it themselves and it did the right thing.
- The note in `content/` says the local route and how to change its numbers.
- No deploy or hosting account changed without a separate explicit request.
