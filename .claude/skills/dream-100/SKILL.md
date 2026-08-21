---
name: dream-100
description: Build, research, score, and operate a focused Dream 100 list of high-value buyers, referral partners, creators, podcasts, communities, brands, or media. Use for Dream 100 strategy, influencer or collaboration outreach, partner prospecting, gifting campaigns, podcast promotion, business development, multi-channel outreach planning, and diagnosing low response. Produces a source-backed target list, value-first offers, compliant channel plan, personalized drafts, follow-up decisions, and outcome tracking. Defaults to research and drafts; outbound sends, gifts, spend, contracts, and publication require the applicable authority.
---

# Dream 100

Concentrate relationship-building on the small group that can materially change the outcome. The number is a focusing device, not a quota. Start with 12 or 25 when that is what the team can research and serve well.

The method has two useful forms:

- **Best accounts:** Chet Holmes focused effort on the buyers with disproportionate value.
- **Audience owners:** the modern adaptation focuses on creators, podcasts, newsletters, communities, brands, and partners who already have the right audience's trust.

Do not turn either form into automated pursuit. The strategy is better selection, better value, and disciplined learning—not contacting the same person everywhere until they give in.

## Operating modes

Name the mode before doing work:

1. `research_only`: discover, verify, score, and report targets. No contact data enrichment beyond legitimate public business sources and no sends.
2. `draft`: add the value hypothesis, channel plan, and personalized messages. No sends.
3. `execute`: use only when the user has explicitly asked to send or an existing approved workflow records that authority. Re-check sender, audience, channel, suppression, and offer terms before each batch. Use the provider's own skill/tool; this skill does not bypass its safeguards.

Gifts, paid partnerships, ads, contracts, usage rights, public posts, bulk sends, and provider mutations remain separately authorized even in `execute` mode.

## Ownership boundary

This skill owns program design: target selection, evidence, scoring, value hypotheses, channel/cadence decisions, relationship states, and learning. Use existing specialist skills or tools for contact enrichment, deep company research, discovery calls, objection handling, active-deal strategy, CRM writes, and provider execution. Do not duplicate those systems inside the Dream 100 ledger.

## Workflow

### 1. Define the outcome and target mode

Write one measurable business outcome and choose the target mode:

- `buyer`: a qualified account that may buy;
- `referral_partner`: a business or professional serving the same audience;
- `creator_or_media`: an influencer, podcast, newsletter, community, journalist, or publisher;
- `strategic_partner`: a brand, venue, association, sponsor, or collaborator.

Do not mix the modes in one generic pitch. A buyer needs relevance and discovery. A referral partner needs reciprocal client value. A creator needs an audience-fit idea and clear terms. Media needs a useful story, guest, or resource.

Record:

- the exact audience;
- the problem or opportunity;
- what a successful relationship looks like;
- the proof metric;
- the campaign owner and weekly capacity.

### 2. Build a source-backed list

Read [research-and-scoring.md](references/research-and-scoring.md).
When targets are **local SMBs**, also read [local-smb-prospecting.md](references/local-smb-prospecting.md)
for website-status scoring and Maps-safe discovery cues.

Start with 12 to 25 active targets and optionally up to 25 watch-list targets. Research public, legitimate sources. For each material claim—audience, reach, recent work, location, partnership history—record the source URL, observation date, and confidence. Never invent follower counts, list sizes, engagement, mutual connections, familiarity, or brand fit. Contact surfaces may include published business email, phone, Facebook Page, Instagram business profile, and an appropriate website form — never LinkedIn bulk scrape or personal/private data harvests.

Use [tracker-schema.md](references/tracker-schema.md). Deduplicate by account and person before any outreach.

### 3. Rank for fit, not fame

Score these dimensions independently:

- audience overlap;
- strategic or offer fit;
- credibility and content quality;
- relationship readiness;
- access and timing;
- brand, reputation, and compliance safety.

Reach is context, not a substitute for fit. A smaller highly aligned partner may outrank a famous but irrelevant account. If evidence is weak, label the score `LOW_CONFIDENCE` and keep the target in research or watch status.

### 4. Write a value hypothesis before an ask

Every active target must answer:

- Why this person or company?
- Why now?
- What can we give that is useful to them or their audience?
- What is the smallest sensible next step?

Useful offers include a tailored resource, relevant introduction, audience feature, guest invitation, co-created asset, reciprocal collaboration, or a genuinely complimentary product/service.

If a product, service, payment, affiliate share, or other benefit is tied to content, an endorsement, usage rights, or deliverables, call it a partnership—not “no strings attached.” State the terms and disclosure requirement plainly. Do not imply that a gift has no obligation while privately expecting a post.

### 5. Choose a channel path

Read [channel-and-compliance.md](references/channel-and-compliance.md).

The six possible channels are a **map**, not a mandate. Pick the target's appropriate professional channel first. Add another only for a documented reason, genuinely new value, a real relationship trigger, and a permitted professional path. Do not spray the same pitch simultaneously across Instagram, Facebook, email, phone, text, and a web form.

A public phone number is not SMS consent. Silence is not permission to escalate to a more intrusive channel. Contact forms are for the purpose stated on the site; do not misuse support, booking, or personal forms.

### 6. Draft a specific, value-first message

Read [message-patterns.md](references/message-patterns.md).

Each message needs:

1. one current, verified reason the target fits;
2. who the sender is, in the terms that matter here;
3. one concrete value offer with only truthful numbers;
4. one low-friction next step;
5. a clear, pressure-free exit.

Drafts should sound like the sender, not a generic sales template. Never fabricate praise or imply the sender follows, knows, or admires work they did not inspect.

### 7. Execute only with authority

Before sending, confirm:

- the exact sender and account;
- the target and professional contact source;
- jurisdiction, channel rules, and the documented basis for contact;
- suppression, opt-out, prior objection, and duplicate-contact status;
- offer, compensation, disclosure, and usage-right terms;
- approval for this send or batch.

Send the smallest reviewed batch. Record the provider receipt or message link separately from delivery, reply, meeting, agreement, publication, and attributed outcome. Never claim one proves another.

### 8. Handle replies and silence correctly

Read [diagnosing-no-response.md](references/diagnosing-no-response.md) before changing copy, volume, or channel.

- Positive reply: qualify fit, timing, authority, constraints, and the next mutual-value step before pitching more.
- Question or objection: answer the real concern with evidence. Do not argue someone into a partnership.
- Explicit opt-out, do-not-contact request, complaint, legal restriction, or platform stop: set `SUPPRESSED` at the appropriate contact, account, or channel scope. There is no automatic reactivation.
- “Not interested” or no to this offer: set `DECLINED` or `CLOSED` for this campaign. Do not automatically nurture, retry the same pitch, or escalate channels; only a later inbound response or genuinely new, independently appropriate campaign can justify reconsideration.
- Wrong person or wrong audience: set `WRONG_CONTACT` or `WRONG_FIT`, close this path, and reroute only when a legitimate correct contact exists.
- No response: inspect deliverability, targeting, offer fit, and message quality. Set a campaign-specific cadence and cooldown from current platform rules, jurisdiction, account reputation, relationship context, new value, and human reply capacity. Do not copy the same pitch into more channels or switch to personal phone or text to overcome silence.

### 9. Review weekly

Track quality and outcomes, not activity theater:

- percentage of active targets with current evidence, value hypothesis, owner, next action, and channel/compliance decision;
- meaningful touches completed versus planned;
- replies, positive replies, conversations, meetings, collaborations, publications, qualified visits/leads, pipeline, revenue, and direct cost;
- opt-outs, complaints, duplicate outreach, platform warnings, and unauthorized sends—target zero;
- results by target segment, offer, and channel.

Do not optimize around open rate or raw send volume. Change one hypothesis at a time so the team can learn what worked.

## Quality gates

Do not call the work complete unless:

- every active target has a current source and a non-generic reason for inclusion;
- every planned touch gives real value and uses truthful claims;
- no target marked `SUPPRESSED`, `DECLINED`, `WRONG_CONTACT`, or `WRONG_FIT` is queued for the covered campaign;
- channel choice and cadence are justified rather than copied mechanically;
- gifts, compensation, deliverables, disclosure, and usage rights are unambiguous;
- one owner and one dated next action exist for every active relationship;
- the report separates draft, sent, delivered/accepted, replied, agreed, published, and attributed results.

## Completion report

Return:

1. objective and target mode;
2. active/watch counts and scoring rationale;
3. top target table with evidence confidence;
4. offer and channel hypotheses;
5. drafts created and whether anything was actually sent;
6. approval or compliance blockers;
7. next seven-day actions and weekly review date.
