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

Look for placeholders in double curly braces, like `{{HERO_HEADLINE}}`.
Replace the placeholder with your own words and keep the quote marks:

```
before:  {"{{HERO_HEADLINE}}"}
after:   {"Wedding photography in Austin, without the stress"}
```

Save the file and look at your browser.

## Your blog writes itself onto the site

You do not add blog posts in `page.tsx`. Ask your employee to write a post; it
saves the post as a file in the `content/` folder at the top of this project,
and your site puts it up on its own — on the homepage under "Latest writing"
and at `http://localhost:3000/blog`.

One line decides it. Every post file starts with a small block like this:

```
---
title: Why most quotes go cold
date: 2026-08-22
published: true
---
```

`published: true` means it's on your site. Change it to `false` and the post
comes off. The other files in `content/` — your emails, plans and notes — have
no such line, so your website ignores them.

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
