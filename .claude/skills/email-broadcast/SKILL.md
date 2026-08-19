---
name: email-broadcast
description: Write and send an email to the whole list. Use when the owner wants to email their list, send a newsletter, or announce something to everyone.
---

# Email the List

> **Needs a connection first.** Without a connected email tool (Mailchimp, ConvertKit, Klaviyo, whatever they use), this skill writes the email and the owner pastes it in and presses send. Run `connect-accounts` when they want sending handled here too.
>
> This is different from `write-email`, which writes to one person. This one goes to everybody at once, so the bar is higher and nothing gets sent without the owner's explicit go-ahead.

## Read first

- `context/rules.md` — what this business may never claim or do. These rules beat anything below.
- `context/voice.md` — a broadcast that sounds like marketing gets deleted
- `context/offer.md` — the exact offer and price
- `context/customers.md` — the people receiving it
- `context/gtm.md` — the angle we're running (skip if empty)
- The last few broadcasts in `content/` — so this doesn't repeat the last one

## Steps

1. Ask three things:
   - What's this about, and why now?
   - Who's it going to — everyone, or one group?
   - What's the one thing you want them to do?

2. Write it as one person writing to one person. A list of 400 is 400 individual people reading alone on a phone.
   - Subject line under 8 words. It says the thing; it doesn't tease it.
   - One idea. One ask.
   - Short paragraphs. Most of them will read it standing up.
   - Prices exactly as written in `context/offer.md`.

3. Write **two subject lines** and say which you'd send.

4. Check three things before showing it to the owner:
   - Every claim is true and traceable to `context/` or to them
   - There's an obvious way to unsubscribe (their email tool adds it — confirm it's on)
   - Nothing in it breaks a rule in the **Never** section of `context/voice.md`

5. Show the owner the whole thing and say who it's going to and how many people that is.

6. Sending:
   - **Connected** — load it as a **draft** in their email tool and send them the preview link. They press send. Never send to a list yourself, no matter how clearly they approved the copy — approving words is not the same as approving a send.
   - **Not connected** — hand over the subject and body to paste in.

## Save it

`content/YYYY-MM-DD-broadcast-<topic>.md` — both subject lines, the body, and who it went to.

## Done when

- The owner has read it and knows exactly who receives it.
- If connected, it sits as a draft for the owner to send; if not connected, the owner has the final copy to paste.
- If the owner chooses to send it, they press send themselves. A saved draft is also a complete outcome.
