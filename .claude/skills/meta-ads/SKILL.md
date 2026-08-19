---
name: meta-ads
description: Write and manage Facebook and Instagram ads. Use when the owner wants to run ads, needs ad copy, or asks how their campaigns are doing.
---

# Facebook and Instagram Ads

> **Needs a connection first.** Without a connected Facebook ad account, this skill writes everything and the owner pastes it into Ads Manager themselves — which works fine. Run `connect-accounts` when they want the launching and reading done here too.

## Read first

- `context/rules.md` — what this business may never claim or do. These rules beat anything below.
- `context/gtm.md` — who we're targeting and the angles. Empty? Run `launch-gtm` first — ads built on guesses cost real money.
- `context/offer.md` — the offer and the exact price
- `context/customers.md` — the words they use
- `context/voice.md`

## Steps

1. Ask three things:
   - What's the one action — message us, book, buy, get the free thing?
   - What's the daily budget?
   - Where does the click land? (An offer page from `build-offer-page` works well here.)

   If they have no landing spot, build that first. Ads pointing at a homepage waste money.

2. Write **three ad angles**, not three versions of one ad. Different angles fail differently, which is how you learn something. Each one gets:
   - Primary text — first line stands alone, because that's all most people read
   - Headline under 40 characters
   - A description of the image or video to use
   - The button

3. Write the audience in plain English: who, where, how old, what they're interested in. Say why. If `context/gtm.md` says these customers aren't really on Facebook, say that out loud before spending anything.

4. Add a **before you spend** note: what a good result looks like at this budget, and the number that tells them to stop. Owners without a stop number keep bad ads running for months.

5. Launching:
   - **Connected** — build the campaign paused, show the owner every setting, and let them press start themselves. Never start a campaign that spends money without them saying go.
   - **Not connected** — hand them the copy and the settings as a checklist they can follow in Ads Manager.

6. Once ads are running, `measure-results` reads what happened.

## Save it

`content/YYYY-MM-DD-meta-ads-<offer>.md` — three angles, the audience, the budget, and the stop number.

## Done when

- Three genuinely different angles exist.
- The owner knows what good looks like and when to stop.
- Nothing was set live without them saying go.
