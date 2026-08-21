# Agency OS Drive Knowledge Inventory

Date: 2026-05-27  
Source folder: https://drive.google.com/drive/folders/1Q37EIcjoDVnE_FINSfcrenasCiQf1kAX  
Related Notion source: https://www.notion.so/tdms/New-Client-60-Day-Sprint-Template-e1a1e6be651e48d9aa1b6e024c78d28c  
Status: Inventory only. Content export, chunking, embeddings, and skill extraction not yet run.

## Purpose

This file inventories the current Google Drive source corpus that should become the first Agency OS RAG/library import. It also maps each document to the existing `new-build` skills and identifies missing skills or reference packs.

The Drive folder currently appears flat: 39 files, mostly Google Docs plus 3 Word documents. No nested folders were returned by the connector listing.

The linked Notion page is a separate operational source. It should not be treated as just another RAG document. It is the client-sprint workflow template that should shape `clients/{client-id}/sprint.md`, task states, responsibilities, and the first Agency OS client onboarding UI.

Important distinction: a document can be valuable without being globally reusable. Client-specific audits, named deliverables, real pricing, real emails, and real phone numbers must be isolated to the correct client lane or sanitized before any global RAG ingestion.

## Notion Source Inventory

| Source | Type | Observed Structure | Agency OS Use |
| --- | --- | --- | --- |
| New Client - 60 Day Sprint Template | Notion page | Parent in Master Task Board; includes callouts, team/onboarding info, FAQ, and embedded databases | Baseline for new client workspace creation and client portal/onboarding flow |
| Project Flow Board - 2025 | Notion data source | Properties: `Milestone`, `Notes`, `Responsibility` (`Client`, `P2P`), `Progress:` (`Not Started`, `In progress`, `For Review`, `Completed/Implemented`) | Translate into `sprint.md`, `tasks.md`, Agency OS task model, and status/reporting schema |
| Embedded secondary database | Notion database view | View of `Master Task Board`, data source `collection://00223b47-9991-498a-8c82-c3b26cb37481`; exposes `Assign`, `Client` relation, `Type`, `Start Date`, `Due by`, `Progress:`, `Files & Media`, `Website`, `Notes`, and `Name` | Must shape `tasks.md` and Agency OS workflow state; do not finalize sprint schema until task rows and view filters are extracted |

Notion connector note: the page and data-source schemas were fetched successfully. Row querying for the Project Flow Board failed in this session with a connector-side `notion-query-data-sources not found` error, so task-row extraction remains pending.

## Current Local Skills

Existing local skills in `new-build`:

- `asset-intake`
- `boudoir-copywriter`
- `build-funnel`
- `build-page`
- `debug`
- `deliverable-format`
- `frontend-design`
- `funnel-design`
- `google-ads-photographers`
- `intake`
- `launch-checklist`
- `manage-seo`
- `memory-maintenance`
- `photo-studio-website-copywriter`
- `react-best-practices`
- `read-screenshot`
- `safe-commit`
- `security-audit`
- `site-builder`
- `studio-booking-event`
- `studio-gtm-strategy`
- `studio-reactivation`
- `supabase-cms`
- `tail-wind-design`
- `typeform-quiz-popup-builder`
- `visual-qa`
- `webapp-testing`

## Drive Source Inventory

| # | Title | Type | Initial Category | Existing Skill Fit | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Atlantic_Copywriting_Notes.docx | Word doc | client/example copy | `photo-studio-website-copywriter`, `boudoir-copywriter` | Treat as `client-specific` by default. Stage under a dedicated client lane, likely `clients/atlantic/`, unless anonymized and approved for global examples. |
| 2 | Atlantic Boudoir Pricelist Audit.docx | Word doc | pricing/audit | `boudoir-copywriter`, `studio-gtm-strategy` | Treat as `client-specific` by default. Can inform pricing-audit frameworks only after client names, pricing, contact details, and proprietary context are stripped. |
| 3 | Casey_Quist_Pillar_V6.docx | Word doc | pillar content | `photo-studio-website-copywriter`, `manage-seo` | Treat as `client-specific` by default because filename appears to identify a real deliverable. Do not use globally until reviewed and sanitized. |
| 4 | THE BOUDOIR BUYER BIBLE | Google Doc | boudoir buyer psychology | `boudoir-copywriter`, `studio-gtm-strategy` | High-priority core reference. |
| 5 | Boudoir Copywriting Handbook | Google Doc | boudoir copywriting | `boudoir-copywriter` | High-priority core reference. |
| 6 | Follow Up: 5x5 rule | Google Doc | follow-up/sales | `studio-reactivation`, `studio-gtm-strategy` | Missing dedicated follow-up skill/reference pack. |
| 7 | Boudoirs Ads, Reviews, and Fears | Google Doc | boudoir ads/social proof/objections | `boudoir-copywriter`, `google-ads-photographers`, `studio-gtm-strategy` | High-priority objection and proof reference. |
| 8 | Google Ads - FAQ | Google Doc | Google Ads | `google-ads-photographers` | Core ads FAQ reference. |
| 9 | Quiz Newborn - Great Example and Lessons (annotated) | Google Doc | quiz/newborn | `typeform-quiz-popup-builder`, `studio-gtm-strategy` | Needs niche reference pack: newborn. |
| 10 | Prospecting Handbook | Google Doc | prospecting/sales | `studio-gtm-strategy`, `studio-reactivation` | Missing prospecting/outbound skill. |
| 11 | Facebook Ads Handbook for Photography Studios | Google Doc | Meta ads | `funnel-design`, `studio-gtm-strategy` | Missing dedicated Meta ads skill. |
| 12 | Video Testimonial Instructions | Google Doc | social proof/testimonials | `photo-studio-website-copywriter`, `funnel-design` | Missing social-proof collection skill/reference. |
| 13 | SEO for Photographers | Google Doc | SEO | `manage-seo`, `photo-studio-website-copywriter` | Core SEO reference. |
| 14 | Lead Generation Quiz Example Output | Google Doc | quiz/example output | `typeform-quiz-popup-builder` | Good gold-standard example candidate. |
| 15 | Facebook Ads - Carousel Ads | Google Doc | Meta ads/carousels | `studio-gtm-strategy` | Missing Meta carousel/ad creative reference. |
| 16 | Blogging Guide to Rank on Google | Google Doc | blogging/SEO | `manage-seo` | Missing blog/content skill if we want production blog workflows. |
| 17 | Frequently Asked Questions - Photography to Profits | Google Doc | P2P FAQ/sales | `studio-gtm-strategy`, `funnel-design` | Product/company FAQ; likely Agency OS/P2P reference, not client copy. |
| 18 | Website Training Video #1 | Google Doc | website ops/training | `build-page`, `site-builder` | Determine if transcript or implementation SOP. |
| 19 | Quiz Boudoir- Great Example and Lessons (annotated) | Google Doc | quiz/boudoir | `typeform-quiz-popup-builder`, `boudoir-copywriter` | High-priority quiz reference. |
| 20 | Typeform GTM Install Code 2024 | Google Doc | Typeform/tracking | `typeform-quiz-popup-builder`, `studio-gtm-strategy` | `stale-check-required`. Verify against current Typeform embed behavior and current GTM container/tag patterns before it becomes a skill reference. Do not embed unverified code snippets. |
| 21 | Typeform - Photography Studio Lead Generation Quiz Instructions and Templates | Google Doc | quiz/templates | `typeform-quiz-popup-builder` | High-priority core reference. |
| 22 | Detailed FAQ for Photographers | Google Doc | FAQ/social proof | `photo-studio-website-copywriter`, `studio-gtm-strategy` | Good FAQ source for website and sales flows. |
| 23 | Website Setup for Photographers | Google Doc | website setup | `build-page`, `site-builder`, `launch-checklist` | Candidate SOP/reference for employee onboarding. |
| 24 | Website Copy Handbook | Google Doc | website copy | `photo-studio-website-copywriter`, `build-page` | High-priority core reference. |
| 25 | 40 over 40 - FAQ | Google Doc | campaign/FAQ | `studio-booking-event`, `photo-studio-website-copywriter` | Needs campaign reference pack. |
| 26 | SEO: Alt Text | Google Doc | SEO/images | `manage-seo`, `asset-intake` | Candidate reference for asset/image workflows. |
| 27 | Mastering Copywriting in the Online Entrepreneur Space: A Comprehensive Guide | Google Doc | general copywriting | `photo-studio-website-copywriter`, `studio-gtm-strategy` | Broad copy reference; distill carefully to avoid generic bloat. |
| 28 | UTM Parameters and Keyword Insertion Google Ads | Google Doc | tracking/Google Ads | `google-ads-photographers`, `studio-gtm-strategy` | Current docs check required before operationalizing. |
| 29 | Best Email Subject Lines Handbook | Google Doc | email copy | `studio-reactivation`, `studio-gtm-strategy` | Missing dedicated email-sequence skill. |
| 30 | S.T.U.D.I.O. Profit Rocket System (SPRS) | Google Doc | GTM framework | `studio-gtm-strategy` | High-priority core strategy reference. |
| 31 | 40 over 40 Campaign Handbook | Google Doc | campaign system | `studio-booking-event`, `studio-gtm-strategy` | Candidate reference for booking-event/campaign systems. |
| 32 | Quiz Weddings - Great Example and Lessons (annotated) | Google Doc | quiz/wedding | `typeform-quiz-popup-builder`, `studio-gtm-strategy` | Needs niche reference pack: wedding. |
| 33 | Studio Growth Stategies - Video | Google Doc | training/GTM | `studio-gtm-strategy` | Likely transcript; classify after export. |
| 34 | THE FAMILY PHOTOGRAPHY | Google Doc | family photography buyer/copy | `photo-studio-website-copywriter`, `studio-gtm-strategy` | Needs niche reference pack: family. |
| 35 | Google Ads - Handbook for Photographers | Google Doc | Google Ads | `google-ads-photographers` | High-priority core ads reference. |
| 36 | Maximizing Leads with Paid Ads - Video | Google Doc | paid ads training | `google-ads-photographers`, `studio-gtm-strategy` | Could feed both Google and Meta ad references. |
| 37 | Building a Profitable Studio - Video | Google Doc | business strategy | `studio-gtm-strategy` | Candidate core strategy reference. |
| 38 | Prospecting Transcript Video Training | Google Doc | prospecting/sales | `studio-gtm-strategy`, `studio-reactivation` | Missing prospecting/outbound skill. |
| 39 | StoryBrand Copywriting for Photography Studios | Google Doc | copywriting framework | `photo-studio-website-copywriter`, `studio-gtm-strategy` | Candidate framework reference. |

## Import Gates

RAG is a curated publish target, not a raw sync target. Drive and Notion can sync into staging automatically, but promotion into `knowledge/distilled/` and the vector index depends on source lifecycle and classification.

Every source must pass these gates before entering global RAG:

1. **Scope gate**
   - `global`: reusable agency knowledge.
   - `client-specific`: belongs under `clients/{client-id}/knowledge` or `clients/{client-id}/outputs`, not global RAG.
   - `unknown`: blocked from ingestion until reviewed.

2. **Sanitization gate**
   - Scan exported Markdown for emails, phone numbers, real client names, pricing, private URLs, account IDs, and person-specific deliverables.
   - If sensitive material is found, route to client-specific storage or create an anonymized derivative.

3. **Transcript gate**
   - Raw transcripts do not go directly into RAG.
   - Distill into structured summaries, frameworks, examples, and checklists first.

4. **Staleness gate**
   - Technical docs involving Typeform, GTM, Google Ads, Meta Ads, tracking, or platform APIs require current-doc verification before becoming operational references.

5. **Operational-template gate**
   - Notion boards, sprint templates, and task databases become schemas/workflow state, not loose vector chunks.

## Document Lifecycle Policy

| Lifecycle | Examples | Default Treatment |
| --- | --- | --- |
| Reference knowledge | Buyer Bible, Website Copy Handbook, StoryBrand, SPRS | Mirror to raw, distill, index after trusted classification |
| Active client work | homepage draft, ad draft, audit in progress | Keep out of RAG until handoff/approval |
| Approved client deliverable | final Google Doc, approved website copy, approved audit | Freeze Markdown copy and index only as client-scoped |
| Stale/deprecated technical source | Typeform/GTM 2024 code, old platform instructions | Exclude from RAG until current-doc verification |
| Notion operational state | tasks, due dates, responsibilities, status | Query as structured operational data, not vector knowledge |

Promotion rule:

```text
Drive/Notion change -> raw staging mirror -> classification -> distillation -> approved RAG publish
```

The only exception is a trusted, already-classified reference document. Those may auto-refresh after hash change, but the system still records version history and freshness.

## Missing Or Underpowered Skills

These are not all new skills yet. Some should start as reference packs under existing skills and only become standalone skills when they have a distinct workflow.

### Likely New Skills

1. `meta-ads-photographers`
   - Why: Facebook/Meta docs are substantial enough to need platform-specific workflow separate from Google Ads.
   - Source docs: Facebook Ads Handbook, Facebook Carousel Ads, Boudoirs Ads Reviews and Fears, paid ads videos.

2. `email-sequence-builder`
   - Why: email subject lines, follow-up rules, reactivation, and promo sequences are recurring deliverables.
   - Source docs: Best Email Subject Lines, Follow Up 5x5, prospecting docs, GTM references.

3. `prospecting-outreach`
   - Why: prospecting is not the same as reactivation; it likely needs scripts, daily activity standards, platform-specific outreach, and tracking.
   - Source docs: Prospecting Handbook, Prospecting Transcript Video Training.

4. `social-proof-builder`
   - Why: testimonials, review prompts, FAQ, proof mining, and video testimonial instructions are repeated assets across websites, funnels, and ads.
   - Source docs: Video Testimonial Instructions, Detailed FAQ, P2P FAQ, Boudoirs Ads Reviews and Fears.

5. `blog-content-seo`
   - Why: current `manage-seo` may cover strategy, but production blog workflows need post briefs, outlines, source handling, alt text, internal links, and publish checks.
   - Source docs: Blogging Guide to Rank on Google, SEO for Photographers, SEO Alt Text.

6. `campaign-launcher`
   - Why: SPRS, 40 over 40, booking-event, campaign handbook, and campaign FAQ docs represent a launch operating system, not only copy or GTM strategy.
   - Source docs: S.T.U.D.I.O. Profit Rocket System, 40 over 40 Campaign Handbook, 40 over 40 FAQ, studio-booking-event patterns.
   - Gate: read SPRS in full first. If it contains a complete campaign workflow with phases, assets, approvals, and launch/optimization steps, promote this to a standalone skill instead of overloading `studio-gtm-strategy`.

### Better As Reference Packs First

1. Niche packs under `studio-gtm-strategy` and `photo-studio-website-copywriter`:
   - `niches/boudoir.md`
   - `niches/newborn.md`
   - `niches/wedding.md`
   - `niches/family.md`
   - `niches/40-over-40.md`

2. Quiz packs under `typeform-quiz-popup-builder`:
   - `references/boudoir-quiz-patterns.md`
   - `references/newborn-quiz-patterns.md`
   - `references/wedding-quiz-patterns.md`
   - `examples/lead-generation-quiz-output.md`

3. Website copy packs under `photo-studio-website-copywriter`:
   - `references/website-copy-handbook.md`
   - `references/storybrand-for-photographers.md`
   - `references/faq-patterns.md`

4. Ads packs under `google-ads-photographers` and future `meta-ads-photographers`:
   - `references/google-ads-faq.md`
   - `references/google-ads-handbook.md`
   - `references/utm-keyword-insertion.md`
   - `references/meta-ads-handbook.md`
   - `references/carousel-ads.md`

## RAG Preparation Schema

Each imported Drive document should become a source record with:

```yaml
source_type: drive
source_id: <drive-file-id>
title: <drive-title>
mime_type: <drive-mime-type>
source_url: <drive-url>
category: <initial category>
skill_targets:
  - <skill-name>
client_scope: global | client-specific | unknown
client_id: null | <client-slug>
reuse_level: core-reference | example | transcript | stale-check-required | client-specific
sanitization_status: pending | passed | requires-redaction | isolated-client-only
sensitivity_flags:
  - email
  - phone
  - real-client-name
  - pricing
  - private-url
  - account-id
  - named-deliverable
  - none
last_modified_at: <drive modified time>
synced_at: null
content_hash: null
```

Each imported Notion source should become a separate operational source record:

```yaml
source_type: notion
source_id: <page-or-data-source-id>
title: <notion-title>
source_url: <notion-url>
source_role: sprint-template | task-board | client-portal-doc | knowledge-doc
schema_snapshot: <properties and options>
client_scope: global-template | client-specific | unknown
operational_mapping:
  sprint_md: true
  tasks_md: true
  agency_os_task_model: true
rag_ingestion_policy: never | summarized-only | allowed
last_synced_at: null
content_hash: null
```

## Next Import Steps

1. Create the new repo or sister workspace skeleton before importing content.
2. Export each Drive file to Markdown/text into a staging folder outside production site code.
3. Fetch Notion page/database content into a separate `notion-manifest.json`.
4. Compute hashes and create `drive-manifest.json`.
5. Classify each document as global, client-specific, stale-check-required, example, or operational template.
6. Run the content sanitization pass before chunking:
   - detect email addresses
   - detect phone-number patterns
   - detect known client/person names from filenames and manifests
   - detect pricing/account/private URL patterns
   - flag anything that must move to `clients/{client-id}` or be anonymized
7. Inspect the Notion Master Task Board rows and view filters before finalizing the sprint/task schema.
8. Translate the Notion 60-day sprint into `sprint.md` and `tasks.md` templates.
9. Build source-cited summaries per category.
10. Distill high-priority references into existing skills.
11. Only then create new skills for categories with unique workflows.
12. Build Neon RAG ingestion against the staged Markdown and manifests.

## High-Priority First Pass

Start with:

1. THE BOUDOIR BUYER BIBLE
2. Boudoir Copywriting Handbook
3. Website Copy Handbook
4. Typeform - Photography Studio Lead Generation Quiz Instructions and Templates
5. Google Ads - Handbook for Photographers
6. Facebook Ads Handbook for Photography Studios
7. S.T.U.D.I.O. Profit Rocket System (SPRS)
8. StoryBrand Copywriting for Photography Studios

These appear most likely to improve current skills immediately.

## Immediate Client-Specific Isolation

Create or reserve client-scoped lanes before export:

```text
clients/
  atlantic/
    knowledge/
      raw/
      sanitized/
    outputs/
      audits/
      copy/
  casey-quist/
    knowledge/
      raw/
      sanitized/
    outputs/
      seo/
      pillar-content/
```

The folder names above are provisional. Confirm actual client slugs before committing. The important rule is that named/client-specific Word docs are not global inputs by default.
