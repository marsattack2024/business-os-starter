---
name: build-offer-page
description: Write and build a page that sells one offer. Use when the owner wants a landing page, a sales page, an offer page, or a page for one specific service.
---

# Build an Offer Page

One page, one offer, one action. Not a brochure.

## Read first

- `context/rules.md` — what this business may never claim or do. These rules beat anything below.
- `context/offer.md` — the offer, its exact name and price
- `context/gtm.md` — who we're going after and what we're saying to them. If this is empty, run `launch-gtm` first; a page built without it is guesswork.
- `context/customers.md` — the objections and the words they use
- `context/voice.md` — the whole page is in the owner's voice

## Steps

1. Ask which offer, and what the one action is — book a call, buy, get a quote, join the list. One action. If the owner names two, ask them to pick.

2. Write the copy in this order, and show it to the owner **before building anything**:
   - **Headline** — what they get, who it's for
   - **The problem**, in the customer's own words
   - **What this is** — plain description, no adjectives doing the work
   - **What's included** — a list they could hold you to
   - **Proof** — real testimonials, numbers, or work samples from `context/`. No proof yet? Leave it out. A fake testimonial ends a business.
   - **Price**, exactly as written in `context/offer.md`
   - **Objections** — three real ones, answered straight
   - **The action**, twice: once after the proof, once at the end

3. Get approval on the copy. Then build.

4. Add the page at `site/app/<offer-slug>/page.tsx`. Copy the section-comment style from `site/app/page.tsx` so the owner can find their way around it. Reuse the colors from `site/app/globals.css` — don't introduce new ones.

5. Run `cd site && npm run build`. Fix anything that fails.

6. Tell the owner the address to look at: `http://localhost:3000/<offer-slug>` while `npm run dev` is running.

## Save it

`content/YYYY-MM-DD-offer-page-<offer>.md` — the approved copy, so it can be reused in emails and ads.

## Done when

- The copy was approved before the page was built.
- `npm run build` passes and the page loads.
- Every number and price on the page came from `context/offer.md`.
