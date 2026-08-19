# Quiz quality

Use a quiz only for the `training-pack` profile. It is retrieval practice, not
an approval gate or a mandatory ending.

## Mandatory authoring path (do this first)

1. Copy the `trainingPack.quiz` object from
   `evals/fixtures/valid-training-pack.json` into your draft pack.
2. Replace prompts, options, rationales, `supportingClaim`, `reviewTarget`, and
   `sourceIds` — keep the field names and option object shape exactly.
3. Confirm each `reviewTarget` matches a rendered passage:
   - `visual:<visual.id>`
   - `walkthrough:<walkthrough.id>`
   - or `foundation` / `edges` when those sections are the teaching home
4. Write `supportingClaim` as the exact proposition the correct option asserts,
   then confirm cited `sourceIds` prove that whole proposition before setting
   `correctIndex`.

Do **not** invent fields. These are invalid and will fail validation:

- `introduction`, `passingGuidance`, `optionRationales`
- string options (must be `{ "label", "rationale" }` objects)
- `discussionPrompts[].suggestedLens` or `discussionPrompts[].sourceIds`
  (`discussionPrompts` only allow `prompt` + `why`)

## Length and mix

Use three questions for a focused lesson and up to five for a substantial
employee workflow. Across the set, prioritize:

- mechanism;
- prediction after an input or state change;
- source boundary or ownership;
- edge case or failure mode;
- next-change tradeoff.

Do not manufacture five questions when three cover the participation goal.

Spread `correctIndex` values: at least two distinct positions in a three-question
quiz; no index more than twice in a longer quiz.

## Option construction

- Exactly four comparable options.
- One unambiguously best answer.
- Plausible distractors representing nearby misconceptions.
- A useful rationale for every option.
- No trivia, joke choices, “all of the above,” or answer-length leakage.

## Evidence challenge

Before encoding `correctIndex`, write the exact proposition the correct option
asserts and confirm the cited sources prove the whole proposition. Do not let a
metaphor or cryptographic property stand in for a different claim.

For example, an encrypted request token can prove integrity, binding, expiry,
and replay properties. It does not alone prove human intent or that the model
cannot submit the resolution. Those claims require evidence about the client
interaction boundary and callable resolution surface.

If the sources prove only part of the answer, narrow the answer or teach the
remaining point explicitly as inference or uncertainty. A structurally valid
but under-supported answer fails the quiz quality bar.

## Interaction behavior

- Keep checking disabled until every question is answered.
- Do not reveal correct answers on an incomplete submission.
- After checking, mark the correct option and reveal the selected rationale and
  correct rationale.
- Link each question back to the exact visual or walkthrough passage that
  teaches the answer.
- Provide a reset/retry control.
- Report a neutral score; never say “approved,” “passed,” or “ready.”
- Store no result and send no analytics.
