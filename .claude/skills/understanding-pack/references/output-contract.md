# Output contract

`references/output-schema.json` defines the v2 machine shape. The validator
adds semantic and density checks that JSON Schema alone does not express.

## Shared shape

- `schemaVersion` is `2.0`.
- `profile` is `decision-brief` or `training-pack`.
- `mode` is `change`, `system`, or `guided`.
- `sourceScope` records an exact revision and at least one source.
- `visuals` contains one to three deterministic visual definitions.
- Every referenced source ID exists.
- Source IDs are implementation detail; the renderer exposes subtle numbered
  references linked to the source map.
- `limitations` records unresolved evidence without turning it into confident
  prose elsewhere.

## Decision brief

A decision brief:

- contains `decisionBrief` and omits `trainingPack`;
- states `question`, `recommendation`, and source-grounded `rationale`;
- separates one to four `currentState` claims from one to four
  `proposedChange` claims;
- contains two to five `approvalCriteria`, each naming the evidence required and
  its present status (`proven`, `missing`, or `planned`);
- contains one to four material `risks` and zero to four `openQuestions`;
- uses one or two visuals;
- contains at most 1,100 primary words, with 600–900 preferred;
- never contains a quiz unless the user explicitly requested a training pack
  instead.

The recommendation may be approve, reject, approve-with-conditions, defer, or a
plain-language equivalent. Do not infer approval from green tests alone.

## Training pack

A training pack:

- contains `trainingPack` and omits `decisionBrief`;
- has two to five observable learning objectives;
- contains one to three prerequisite sections;
- states one short essence and one concrete input/result example;
- contains two to seven causal walkthrough steps;
- contains one to five edge cases;
- may include a quiz of three to five questions;
- contains at most 2,600 primary words.

Do not add an analogy merely to satisfy a template. Use one only when it
clarifies a mechanism without hiding a security or ownership boundary.

## Claims and sources

Source-grounded objects use `sourceIds`. Use `status: inference` only when the
text explicitly identifies the inference. Use `status: unknown` for unresolved
behavior rather than filling the gap with a plausible claim.

For repository sources, use repo-relative locators and narrow line ranges when
practical. Never include secrets, environment values, private messages, or
personal data.

## Visuals

Supported kinds:

- `flow`
- `comparison`
- `state-timeline`
- `mapping`
- `guided-steps`

Each kind has its own renderer. Items remain concise labels plus one useful
detail. `flow` links must reference item IDs. Comparison uses exactly two items.
See `figure-patterns.md`.

## Quiz

Clone shape from `evals/fixtures/valid-training-pack.json` before rewriting
content. Each question needs four `{ label, rationale }` options, one
`correctIndex`, a `supportingClaim`, a `reviewTarget` linking to a rendered
visual or walkthrough passage, and `sourceIds` that prove the correct claim.
Quiz root fields are only `instructions` + `questions` — no
`introduction` / `passingGuidance` / parallel rationale arrays. Correct
positions use at least two distinct indexes in a three-question quiz (three
when four or five questions), and no index appears more than twice.

The UI does not reveal answers until every question has a selection. After
checking, it visibly marks the correct option, reveals the selected rationale
and correct rationale, links back to the supporting passage, supports reset,
stores nothing, and never declares the learner approved or qualified.

## Generated files

Keep JSON beside rendered HTML. JSON is reviewable source; HTML is deterministic
output. A durable committed pack generally commits JSON and regenerates HTML.
