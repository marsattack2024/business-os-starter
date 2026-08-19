# Your website lives in this folder

This folder holds your homepage. You do not need to understand all of it.
There are only two files you will ever touch, and they are listed below.

## See it on your screen

Open Terminal, go into this folder, and run these two commands.

**The first time only:**

```
npm install
```

This downloads the pieces your site needs. It takes a minute or two and
prints a lot of text. That is normal.

**Every time you want to see your site:**

```
npm run dev
```

Then open your web browser and go to:

```
http://localhost:3000
```

That is your site, running on your own computer. Nobody else can see it yet.

Leave the Terminal window open while you work. When you save a change to a
file, the page in your browser updates by itself within a second or two.

## Change your words

Open **`app/page.tsx`**.

That one file is your whole homepage. It is split into seven labeled
sections — header, hero, services, proof, latest writing, call to action,
footer — and each one has a plain-English note above it telling you what it
does.

Look for placeholders in double curly braces — the headline one is near the top.
Replace the placeholder with your own words and keep the quote marks:

```
before:  {"...the headline placeholder..."}
after:   {"Wedding photography in Austin, without the stress"}
```

Save the file and look at your browser.

## Publish a blog post intentionally

You do not add blog posts in `page.tsx`. Ask your employee to write a post and
it saves a **private draft** in the `content/` folder at the top of this
project. Private drafts never appear on the website.

When you have approved the exact draft, ask your employee to **publish this
post**. It copies that one file to `site/content/`, where the website can read
it, and runs a build check. Publishing never deploys the site.

Every public post starts with a small block like this:

```
---
title: Why most quotes go cold
date: YYYY-MM-DD
published: true
---
```

`published: true` means the public copy is shown on your site. Change it to
`false` to take that public copy down. The private draft remains in `content/`.

## Change your colors

Open **`app/globals.css`**.

Every color, the font, and how round the corners are — all of it is at the
top of that file, with a note explaining each one. Change a hex code like
`#2f6fed` to your own color, save, and the whole site changes.

## Stop the server

Click on the Terminal window and press **Ctrl+C** (hold Control, press C).

That stops the site. `http://localhost:3000` will go blank until you run
`npm run dev` again.

## If something breaks

Press Ctrl+C to stop the server, then run `npm run dev` again. That fixes
most things. If the page shows a red error box, it usually names the file
and the line — most often a missing quote mark.
