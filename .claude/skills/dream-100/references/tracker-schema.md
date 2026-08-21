# Tracker schema

Use a spreadsheet, database, CRM, or Markdown table. Do not introduce a new vendor merely to run this method.

## Accounts

- `campaign_id`
- `account_id`
- `account_name`
- `target_mode` — buyer, referral_partner, creator_or_media, strategic_partner
- `account_type`
- `primary_url`
- `country_region`
- `audience_summary`
- `audience_overlap_evidence`
- `evidence_source_url`
- `evidence_observed_at`
- `evidence_confidence` — HIGH, MEDIUM, LOW
- `reported_reach` — optional, source-labelled
- six raw scores and `weighted_score`
- `tier`
- `why_now`
- `value_hypothesis`
- `smallest_ask`
- `owner`
- `status`
- `next_action`
- `next_action_due`
- `last_meaningful_touch`
- `cooldown_until`
- `system_of_record`
- `crm_record_id` — optional, never a secret

## Contacts and permissions

- `contact_id`, `account_id`, `name`, `role`
- `professional_contact_point`
- `contact_source_url`, `source_observed_at`
- `jurisdiction`, `time_zone`
- `preferred_channel`
- `lawful_basis_or_consent_status`
- `consent_or_authority_evidence`
- `privacy_notice_status`
- `DNC_or_preference_checked_at`
- `do_not_contact`
- `opt_out_or_objection_at`
- `suppression_reason`
- `suppression_scope` — contact, account, or channel

Do not store secret credentials or unnecessary sensitive personal data.

## Touchpoints

- `touch_id`, `account_id`, `contact_id`
- `occurred_at`, `channel`, `direction`
- `touch_type` — public_value, introduction, value_offer, follow_up, reply, discovery, meeting
- `personalization_evidence`
- `message_or_asset_reference`
- `sender`
- `approval_or_authority_reference`
- `provider_receipt`
- `delivery_or_acceptance_status`
- `outcome`, `sentiment`
- `next_step`, `next_step_due`

Do not collapse `sent`, `delivered/accepted`, `replied`, and `agreed` into one status.

## Opportunities and outcomes

- `opportunity_type`
- `compensation_or_gift`
- `deliverables`
- `disclosure_required`
- `usage_rights_status`
- `stage`
- `agreement_date`
- `publish_date`
- `earned_mentions_or_shares`
- `qualified_visits`, `leads`, `pipeline_value`, `revenue`
- `direct_cost`
- `attribution_method`
- `evidence_link`

## State transitions

`RESEARCH -> WATCH | ACTIVE -> CONTACT_PLANNED -> SENT -> REPLIED -> QUALIFIED -> AGREED -> PUBLISHED -> MEASURED`

Any state may move to `CLOSED`. Use `DECLINED` for a no to this offer/campaign, `WRONG_CONTACT` or `WRONG_FIT` for a mismatch, and `SUPPRESSED` only for an opt-out, do-not-contact request, complaint, legal/platform stop, or another binding prohibition. `SUPPRESSED` has no automatic reactivation path; record whether its scope is the contact, account, or channel.

## Weekly view

Show:

- active accounts missing an owner, current source, value hypothesis, channel decision, or dated next action;
- actions due this week;
- replies needing a human response;
- suppressed targets accidentally queued—must be zero;
- results by segment, offer, and channel;
- the one hypothesis to change next week.
