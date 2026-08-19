# PERSONALIZE.md — the Thursday pipeline

**Operator file. Not for students.** Delete it from each student's copy (step 9 below).

One pass per student, working from the template plus their intake row. Budget 30–40 minutes each the first time, 15 after that. Do them one at a time and finish each one completely — a half-personalized repo is worse than an unmodified template, because the student can't tell which parts are about them.

Intake form: `VanGhnk5`. Question numbers below refer to `003. AF Workshops/INTAKE-QUESTIONNAIRE.md`.

---

## 1. Copy the template

```bash
cd ~/Documents/GitHub
cp -R business-os-starter firstname-business-os
cd firstname-business-os
rm -rf .git site/node_modules site/.next
```

Repo naming: `firstname-business-os` (lowercase, no spaces). That name also fills `{{REPO_NAME}}`.

Two different paths, on purpose: you build in `~/Documents/GitHub/`, students clone into `~/Documents/AI-Workspace/` — which is the path `README.md` tells them to `cd` into Friday morning. Have them make that folder during the morning setup block.

## 2. Enrich before you fill

Read their website (Q8) and every social link they gave (Q9) **before** touching a context file. Their form answers are thin; their public presence isn't. Pull out: real prices, testimonial quotes, how they actually describe themselves, the three things they repeat.

Over-delivery lives here. Their context files should know things they never typed into the form.

## 3. Fill every token

Search the repo for `{{` and work the list down. Skills legitimately contain `{{TOKENS}}` and `{{LIKE_THIS}}` as prose examples — skip `.claude/skills/`:

```bash
grep -rn '{{[A-Z0-9_]*}}' --include='*.md' --include='*.tsx' --include='*.css' . | grep -v '.claude/skills/'
```

### Context and docs

| Token | Filled from | Lives in |
|---|---|---|
| `{{BUSINESS_NAME}}` | Q5a business name / Q5b company name | AGENTS.md, README.md, all context, site |
| `{{OWNER_NAME}}` | Q1 full name | AGENTS.md |
| `{{OWNER_FIRST_NAME}}` | Q1 first name | context/voice.md |
| `{{REPO_NAME}}` | you, step 1 | README.md |
| `{{BUSINESS_DESCRIPTION}}` | Q5a, in their words + enrichment | context/business.md |
| `{{WHAT_WE_SELL}}` | Q5a + Q7a | context/business.md |
| `{{DIFFERENTIATOR}}` | Q6a second half + enrichment | context/business.md |
| `{{WEBSITE}}` | Q8 | context/business.md |
| `{{SOCIALS}}` | Q9 | context/business.md |
| `{{IDEAL_CUSTOMER}}` | Q6a / Q7b on the employee track | context/customers.md |
| `{{WHY_THEY_PICK_US}}` | Q6a second half + reviews | context/customers.md |
| `{{CUSTOMER_QUOTES}}` | real reviews/testimonials only — never invented. None found? Write "None yet." | context/customers.md |
| `{{OFFERS_AND_PRICING}}` | Q7a, exact names and prices | context/offer.md |
| `{{PRIMARY_OFFER}}` | Q7a + Q11 — the one that moves their North Star | context/offer.md |
| `{{VOICE_SAMPLE}}` | Q10, **verbatim, untouched** | context/voice.md |
| `{{VOICE_RULE_1..3}}` | distilled from Q10 + their posts | context/voice.md |
| `{{NEVER_RULE_1}}` | leave as `Ask me.` — `onboard-me` fills it Friday | context/voice.md |
| `{{NORTH_STAR}}` | Q11, **verbatim** — this gets quoted back at the $99 close | context/goals.md |
| `{{FIRST_JOB}}` | Q12 | context/goals.md, README.md |
| `{{SUGGESTION_1}}`, `{{SUGGESTION_2}}` | Q12, Q13, and anything obvious from enrichment | context/goals.md |

`context/gtm.md` stays empty. `launch-gtm` fills it live Friday morning — that's the block-2 wow, and a pre-filled file kills it.

### Site

Tokens live in `site/app/page.tsx` (the page copy), `site/app/layout.tsx` (the browser tab title), and `site/README.md`. Write real copy drafted from context, not placeholder text — bar is "shockingly decent," not "finished."

| Token | Filled from |
|---|---|
| `{{TAGLINE}}` | one line under the business name |
| `{{HERO_HEADLINE}}` | their offer's promise, in their words |
| `{{HERO_SUBTEXT}}` | one sentence — who it's for and what they get |
| `{{CTA_LABEL}}` / `{{CTA_LINK}}` | "Book a call" / their booking link or `mailto:` |
| `{{SERVICE_1..3_TITLE}}` / `{{SERVICE_1..3_TEXT}}` | Q7a offers |
| `{{TESTIMONIAL_QUOTE}}` / `{{TESTIMONIAL_NAME}}` | a real review. None? Delete the whole Proof section. |
| `{{CLOSING_HEADLINE}}` | the ask, once more |
| `{{CONTACT_EMAIL}}` | Q2 |

Colors: set the brand color in the `@theme` block of `site/app/globals.css` to something from their existing brand. One hex change, big perceived effort.

## 4. Employee track (Q3 = "I work in someone else's business")

Only if Q3 says employee. Two swaps:

```bash
rm context/offer.md
```

**`context/role.md`** — what they're responsible for:

```markdown
# {{OWNER_FIRST_NAME}}'s Role at {{BUSINESS_NAME}}

## The job
<!-- Q6b: title first, then the real week-to-week list. -->
{{ROLE_DESCRIPTION}}

## What I'm actually responsible for
{{RESPONSIBILITIES}}

## Who I serve
<!-- Q7b: customers, a boss, a team — and what they ask for. -->
{{WHO_I_SERVE}}

## What good looks like here
{{WHAT_GOOD_LOOKS_LIKE}}
```

**`context/company.md`** — the business they work inside:

```markdown
# About {{BUSINESS_NAME}}

<!-- Q5b + enrichment from the company website. -->
{{COMPANY_DESCRIPTION}}

## What the company sells
{{WHAT_THE_COMPANY_SELLS}}

## Where I fit
{{WHERE_I_FIT}}
```

Then fix the three pointers to `offer.md` so nothing points at a deleted file:
- `AGENTS.md` — "Before every task" list → `context/role.md` and `context/company.md`
- `.claude/skills/write-email/SKILL.md` and `write-content/SKILL.md` — "Read first" lists

Skills need no other changes. `write-email`, `write-content`, and `good-morning` work identically for a role.

## 5. Install and build the site

```bash
cd site && npm install && npm run build && cd ..
```

Both must pass. Leave `node_modules/` in place — Friday's venue wifi is not a dependency you want.

## 6. Smoke test — the real gate

In the student's repo folder, open Codex and run these four. Do not skip it because the files "look right."

1. **`good-morning`** — does it name their business, their North Star, and suggest three moves that are actually about them? Generic advice here means a context file is thin. Fix the file, not the answer.
2. **`update-website`** — ask for one word change on the homepage. Confirm `npm run build` still passes.
3. **`npm run dev`** in `site/`, open `http://localhost:3000` — the homepage looks like their business, no `{{TOKENS}}` visible on screen.
4. **`grep -rn '{{' --include='*.md' --include='*.tsx' . | grep -v '.claude/skills/'`** returns nothing.

Then delete anything the smoke test created in `content/` so their repo starts empty.

## 7. Per-student checklist

Copy this per student. Nobody ships without all nine.

```
[ ] 1 repo copied + renamed        [ ] 6 smoke test: good-morning names them
[ ] 2 enriched from site/socials   [ ] 7 smoke test: site builds + looks right
[ ] 3 all tokens filled            [ ] 8 no {{ tokens left
[ ] 4 track correct (owner/emp)    [ ] 9 pushed + invite sent
[ ] 5 npm install + build pass
```

## 8. Git and GitHub

```bash
cd ~/Documents/GitHub/firstname-business-os
git init
git add .
git commit -m "Business OS for {{BUSINESS_NAME}}"
gh repo create <your-org>/firstname-business-os --private --source=. --push
gh repo add-collaborator <your-org>/firstname-business-os <their-github-username> --permission admin
```

If Q14 came back as "I promise I'll create one" and they still haven't, chase it. No username = no repo Friday morning.

**End-of-day ceremony:** transfer each repo to the student's own account. Settings → General → Transfer ownership. That's the "it's yours now" beat — don't do it Thursday.

## 9. Last step

```bash
rm PERSONALIZE.md
git add -A && git commit -m "Remove operator notes" && git push
```

Students should never see this file.
