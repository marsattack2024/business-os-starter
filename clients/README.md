# Your clients

Some work is about your business as a whole — your website, your newsletter,
your offer. That work runs on the `context/` folder.

Other work is for one particular client. That work needs facts that are true
for them and nobody else — their situation, their deadline, the thing you must
never say about them.

This folder is where those live. One folder per client.

## When to use it

Make a folder for someone when you'd otherwise re-explain the same background
every time you start a task for them.

If it's a one-off, skip it. Just tell your employee what it needs to know.

## How to add one

1. Copy the `_template` folder and rename the copy to their name, lowercase,
   with dashes instead of spaces: `acme-roofing`, `smith-v-jones`,
   `12-oak-street`.
2. Open the two files inside and fill in what you know. Plain English.
   Half-filled is fine — you'll add to it as you go.
3. Then just say the name: **"write a follow-up email for Acme Roofing."**

Your employee reads that folder before it starts, and saves what it makes
inside that folder rather than in the shared `content/` folder.

## What's in each folder

| File | What goes in it |
|---|---|
| `context.md` | Who they are, what they need, the facts you'd have to repeat. |
| `rules.md` | Anything that's different for them — what never to say, who has to approve, how they like to be spoken to. |

A rule in a client's `rules.md` beats the general rule. If your voice is
casual everywhere but this one client wants it formal, write that in their
`rules.md` and it wins.

Leave `_template` alone so you can copy it again.
