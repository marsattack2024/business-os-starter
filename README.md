# {{BUSINESS_NAME}} — Business OS

This folder is your AI employee: everything it knows about your business, everything it can do, your homepage, and everything it produces for you. It lives on your computer and on your GitHub — it's yours.

## Start your day

1. Open **Terminal** (press `Cmd + Space`, type `Terminal`, press Enter).
2. Type `cd ~/Documents/AI-Workspace/{{REPO_NAME}}` and press Enter.
3. Type `codex` and press Enter.
4. Say: **good morning**

That's the whole habit. Your employee reads up on your business, looks at what you made recently, and suggests today's three moves.

## What's in here

| Folder | What it is |
|---|---|
| `context/` | What your employee **knows** — your business, customers, offer, voice, goals. Open these files; they're plain English. Correcting them makes your employee smarter. |
| `.claude/skills/` | What your employee **can do** — each skill is a short readable file. Edit one and the behavior changes forever. |
| `site/` | Your website. See `site/README.md` for the two commands. |
| `content/` | Private drafts and work product — dated, in Finder, yours. Nothing here appears on the website until you explicitly approve a blog post for `site/content/`; see `content/README.md`. |
| `work/` | Separate facts, rules, sources, status, and deliverables for each client engagement, case, job, property, project, or matter. The path stays stable; see `work/README.md`. |
| `connections/` | Plain-English setup and boundaries for services each owner connects themselves. Credentials never live here. |
| `capabilities/` | The reviewed, pinned catalog of optional project skills. Nothing installs automatically. |
| `inbox/` | Drop any file here (a price list, a brochure, meeting notes), then say **"read my inbox"** — your employee studies it and updates what it knows. |

## What your employee can do

Ask in your own words — you never have to remember these names.

**Every day**
- **good morning** — reads up on your business and suggests today's three moves
- **write an email** — any business email, in your voice
- **write a post** — blog, newsletter, or social
- **change my website** — plain-language edits to your site
- **weekly review** — what got made, what moved, what's next
- **save my work** — backs everything up to GitHub
- **wrap up** — proves the work, saves it, captures lessons, and checks local cleanup
- **start a work item** — creates a clean workspace for a client, case, job, property, or project

**Getting customers**
- **launch my go-to-market** — researches your market and writes the plan everything else runs on
- **plan my content** · **repurpose this** · **build an offer page** · **build a lead magnet**
- **follow up on leads** · **ask for reviews** · **research a competitor**
- **dream 100** — builds a focused prospect list across public business contacts (email, phone, Facebook, Instagram, website form)
- **watch this video** — transcribes and reviews public YouTube, TikTok, or Instagram videos
- **property scout** — practices listing search on synthetic sample data (not a live MLS)

**Building things**
- **build me a tool** — a calculator, quiz, or form on your site
- **prototype this idea** — answers one design question with a disposable local demo before anyone buys or connects anything
- **launch a small app** — turns a proven idea into a separately approved public app, using the simplest suitable hosting and Neon when it truly needs accounts or data
- **generate a video** — remote Veo/Gemini video when you have an API key (Remotion stays optional in the catalog)
- **generate story ads** — Meta-size ad images when you have Gemini/OpenAI keys
- **live preview tweaks** — on-page design toggles while the website is still a placeholder
- **help me understand this** — turns complicated work into a sourced visual decision brief or a training pack
- **make this better** — improves anything against a standard you set
- **train my employee** — change how it works, forever
- **codex doctor** — audits the AI employee harness itself

**Once you connect your accounts**
- **connect an account** — walks you through it
- **connect Agents First** — links your own Accountability workspace for daily check-ins and goals
- **daily accountability** · **weekly accountability** · **plan my business goals**
- **run Facebook ads** · **publish to YouTube** · **email my list** · **how are we doing?**
- **vercel** · **neon** — docs-first hosting and database pointers (no silent project create)

Optional capabilities, such as code-rendered Remotion video, are reviewed and added one at a time. See `docs/skills-connections-and-updates.md`; never bulk-install an unknown skill collection. Delete any skill folder under `.claude/skills/` you do not want — then remove its name from `.skill-paths.txt`.

You also have **onboard me**, which fills in anything your employee still doesn't know about you.

## Your employee's next training goal

> {{FIRST_JOB}}

You said this is the first thing you'd hand a great assistant. In week two, we build it into a skill together.
