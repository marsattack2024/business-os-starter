---
name: update-website
description: Change the owner's website from a plain-language request. Use when the owner wants to change words, colors, sections, or anything about how their site looks or reads.
---

# Update the Website

The owner describes what they want in their own words. You make the smallest change that gets it.

## Read first

- `site/app/page.tsx` — every word on the homepage, in commented sections
- `site/app/globals.css` — the `@theme` block at the top holds the colors and fonts
- `context/voice.md` and `context/offer.md` — before writing any new words on the page

## Steps

1. Work out which of two things they're asking for:
   - **Words** → `site/app/page.tsx`. Find the commented section that matches what they described.
   - **Look** → `site/app/globals.css`. Most color and font requests are one line in the `@theme` block.

   If a request needs a section that doesn't exist yet, say so plainly and ask if they want you to add one.

2. Make the change. Keep the section comments intact — they're how the owner finds their way around this file. If you add a section, give it a comment block in the same style.

3. Check it still runs: `cd site && npm run build`. If it fails, read the error, fix it, and run it again. Never hand back a site that doesn't build.

4. Tell the owner what changed, in one sentence, and to look at their browser tab. If the site isn't running, tell them: open a second Terminal window, `cd` into the `site` folder, type `npm run dev`, then open `http://localhost:3000`.

5. If they don't like it, change it back. Their site, their call — don't defend a version.

## Save it

`content/YYYY-MM-DD-website-<what-changed>.md` — one short note: what they asked for, what you changed, which file. This is the record of how the site got the way it is.

## Done when

- `npm run build` passes.
- The change is exactly what they asked for and nothing else moved.
- The owner has looked at it.
