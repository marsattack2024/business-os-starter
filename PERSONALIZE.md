# PERSONALIZE.md — the Thursday pipeline

**Operator file. Not for students.** Delete it from each student's copy (step 10 below).

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
grep -rn '{{[A-Z][A-Z0-9_]*}}' --include='*.md' --include='*.tsx' --include='*.css' \
  --exclude-dir='.claude' --exclude-dir='node_modules' --exclude-dir='.next' .
```

When every token is filled, **strip the operator notes**: every `context/` file opens with an `<!-- PIPELINE: ... -->` comment addressed to you, not the student. Delete every one — README tells students these files are plain English, and the first thing they'd read is a note about intake question numbers they never saw. The gate in step 7 now checks.

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
| `{{VOICE_RULE_1}}`, `{{VOICE_RULE_2}}`, `{{VOICE_RULE_3}}` | distilled from Q10 + their posts | context/voice.md |
| `{{NEVER_RULE_1}}` | leave as `Ask me.` — `onboard-me` fills it Friday | context/voice.md |
| `{{NORTH_STAR}}` | Q11, **verbatim** — this gets quoted back at the $99 close | context/goals.md |
| `{{FIRST_JOB}}` | Q12 | context/goals.md, README.md |
| `{{SUGGESTION_1}}`, `{{SUGGESTION_2}}` | Q12, Q13, and anything obvious from enrichment | context/goals.md |
| `{{EXTRA_CLAIM_RULES}}` | Business-specific claims that are unsupported or forbidden; use `- None beyond the universal rules.` when confirmed | context/rules.md |
| `{{REGULATED_RULES}}` | Rules confirmed by the owner or their qualified adviser; never invent legal/compliance requirements | context/rules.md |

`context/gtm.md` stays empty. `launch-gtm` fills it live Friday morning — that's the block-2 wow, and a pre-filled file kills it.

### Site

Tokens live in `site/app/page.tsx` (the page copy), `site/app/layout.tsx` (the browser tab title), `site/app/blog/layout.tsx` (the bar above and below every blog page — `{{BUSINESS_NAME}}`, twice), and `site/README.md`. Write real copy drafted from context, not placeholder text — bar is "shockingly decent," not "finished."

| Token | Filled from |
|---|---|
| `{{TAGLINE}}` | one line under the business name |
| `{{HERO_HEADLINE}}` | their offer's promise, in their words |
| `{{HERO_SUBTEXT}}` | one sentence — who it's for and what they get |
| `{{CTA_LABEL}}` / `{{CTA_LINK}}` | A label plus the owner's explicit public booking/intake URL. If none exists, remove the CTA rather than inventing one. |
| `{{SERVICE_1_TITLE}}`, `{{SERVICE_2_TITLE}}`, `{{SERVICE_3_TITLE}}` | Exact offer/service names from Q7a |
| `{{SERVICE_1_TEXT}}`, `{{SERVICE_2_TEXT}}`, `{{SERVICE_3_TEXT}}` | Specific customer-facing descriptions supported by context |
| `{{TESTIMONIAL_QUOTE}}` / `{{TESTIMONIAL_NAME}}` | a real review. None? Delete the whole Proof section. |
| `{{CLOSING_HEADLINE}}` | the ask, once more |
| `{{PUBLIC_CONTACT_EMAIL}}` | An address the owner explicitly approves for the public website. Q2 is an intake/contact answer, not automatic publication permission. If none is approved, remove the public email block. |
| `{{LEGAL_NOTICE}}` | Owner-confirmed public legal, licensing, jurisdiction, or advertising notice; use an empty string only when the owner confirms none is required. |

Colors: set the brand color in the `@theme` block of `site/app/globals.css` to something from their existing brand. One hex change, big perceived effort.

## 4. Employee track (Q3 = "I work in someone else's business")

Only if Q3 says employee. Keep every shared context contract, repurpose
`context/offer.md` for the company offer, and add two files:

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

**Keep `context/offer.md`.** Shared skills read it. On the employee track,
`offer.md` describes what the *company* sells (the thing this person's work
supports), with a first line saying so. Then add `role.md` and `company.md`
alongside it.

Then add the two new files to the pointers:
- `AGENTS.md` — "Before every task" list gains `context/role.md` and `context/company.md`
- `.claude/skills/write-email/SKILL.md` and `write-content/SKILL.md` — "Read first" lists gain the same two

No skill deletions, no other edits. `write-email`, `write-content`, and `good-morning` work identically for a role.

## 5. Set the work-item language

The filesystem path is always `work/<name>/`. Do not rename or delete it by
industry; stable paths let shared skills and future updates keep working.

Choose the plain-language label the owner will hear in conversation—client
engagement, case, matter, job, property, project, or another real term—and add
it under a short **How we name work** heading in `context/business.md`. The
underlying folder stays `work/`.
One client/account may own several work items, so never assume a customer and a
case or project are the same record.

Do not pre-create empty work items. The owner can say **start a work item** when
the first real unit appears.

## 6. Install and build the site

```bash
cd site && npm install && npm run build && cd ..
```

Both must pass. Leave `node_modules/` in place — Friday's venue wifi is not a dependency you want.

## 7. Smoke test — the real gate

In the student's repo folder, open Codex and run these five. Do not skip it because the files "look right."

1. **`good-morning`** — does it name their business, their North Star, and suggest three moves that are actually about them? Generic advice here means a context file is thin. Fix the file, not the answer.
2. **`update-website`** — ask for one word change on the homepage. Confirm `npm run build` still passes.
3. **`npm run dev`** in `site/`, open `http://localhost:3000` — the homepage looks like their business, no `{{TOKENS}}` visible on screen.
4. **`write a blog post`** — ask for a short post. Confirm it is saved as a
   private draft in `content/` with `published: false` and does **not** appear
   on the website. Then explicitly say **publish this post**, naming that
   file. Confirm only its approved copy appears under "Latest writing" and at
   `/blog`. This proves both sides of the publication boundary.
5. **This returns nothing** (it ignores this file, the skills, and real JSX braces):

   ```bash
   grep -rn '{{[A-Z][A-Z0-9_]*}}' --include='*.md' --include='*.tsx' --include='*.css' \
     --exclude='PERSONALIZE.md' --exclude-dir='.claude' --exclude-dir='node_modules' \
     --exclude-dir='.next' .
   ```

This also returns nothing (operator notes were stripped from student files):

```bash
grep -rn 'PIPELINE' --include='*.md' --include='*.tsx' \
  --exclude='PERSONALIZE.md' --exclude-dir='.claude' --exclude-dir='node_modules' \
  --exclude-dir='.next' .
```

Delete the smoke-test draft and public copy afterward. Remove or rewrite the
shipped example in `site/content/`; a personalized site must not launch with a
generic example attributed to the owner.

## 8. Per-student checklist

Copy this per student. Nobody ships without all ten.

```
[ ] 1 repo copied + renamed        [ ] 6 npm install + build pass
[ ] 2 enriched from site/socials   [ ] 7 smoke test: good-morning names them
[ ] 3 all tokens filled            [ ] 8 draft private; approved post public
[ ] 4 track correct (owner/emp)    [ ] 9 no {{ or PIPELINE left; drafts clean
[ ] 5 work-item label confirmed    [ ] 10 pushed + invite sent
```

## 9. Git and GitHub

```bash
cd ~/Documents/GitHub/firstname-business-os
git init
git add .
git commit -m "Business OS for {{BUSINESS_NAME}}"
gh repo create <your-org>/firstname-business-os --private --source=. --push
gh api --method PUT repos/<your-org>/firstname-business-os/collaborators/<their-github-username> -f permission=admin
```

If Q14 came back as "I promise I'll create one" and they still haven't, chase it. No username = no repo Friday morning.

**End-of-day ceremony:** transfer each repo to the student's own account. Settings → General → Transfer ownership. That's the "it's yours now" beat — don't do it Thursday.

## 10. Last step

```bash
rm PERSONALIZE.md
git add -- PERSONALIZE.md && git commit -m "docs: remove operator notes" && git push
```

Students should never see this file.
