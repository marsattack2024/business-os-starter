import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { renderUnderstandingPack } from "./render-understanding-pack.mjs";
import { countPrimaryWords, validateUnderstandingPack } from "./understanding-pack-lib.mjs";

const decisionFixture = readFixture("valid-pack.json");
const trainingFixture = readFixture("valid-training-pack.json");

test("decision and training reference fixtures satisfy the v2 contract", () => {
  assert.deepEqual(validateUnderstandingPack(decisionFixture), []);
  assert.deepEqual(validateUnderstandingPack(trainingFixture), []);
  assert.ok(countPrimaryWords(decisionFixture) <= 1100);
  assert.ok(countPrimaryWords(trainingFixture) <= 2600);
});

test("v1 packs fail with an explicit regeneration message", () => {
  const legacy = structuredClone(decisionFixture);
  legacy.schemaVersion = "1.0";
  const errors = validateUnderstandingPack(legacy);
  assert.ok(errors.some((error) => error.includes("v1 packs must be regenerated")));
});

test("decision briefs reject training content and visual overload", () => {
  const invalid = structuredClone(decisionFixture);
  invalid.trainingPack = structuredClone(trainingFixture.trainingPack);
  invalid.visuals.push(structuredClone(invalid.visuals[0]));
  const errors = validateUnderstandingPack(invalid);
  assert.ok(errors.some((error) => error.includes("trainingPack: must be omitted")));
  assert.ok(errors.some((error) => error.includes("no more than two visuals")));
});

test("quiz validation rejects answer leakage and broken review links", () => {
  const invalid = structuredClone(trainingFixture);
  invalid.trainingPack.quiz.questions.forEach((question) => {
    question.correctIndex = 0;
  });
  invalid.trainingPack.quiz.questions[0].reviewTarget = "walkthrough:missing-step";
  const errors = validateUnderstandingPack(invalid);
  assert.ok(errors.some((error) => error.includes("distinct option positions")));
  assert.ok(errors.some((error) => error.includes("rendered teaching passage")));
});

test("quiz validation rejects invented fields and string options", () => {
  const invalid = structuredClone(trainingFixture);
  invalid.trainingPack.quiz.introduction = "do not invent this field";
  invalid.trainingPack.quiz.questions[0].optionRationales = ["leak"];
  invalid.trainingPack.quiz.questions[0].options = ["a", "b", "c", "d"];
  invalid.trainingPack.discussionPrompts = [
    { prompt: "ok?", suggestedLens: "bad", sourceIds: ["skill"] },
  ];
  const errors = validateUnderstandingPack(invalid);
  assert.ok(
    errors.some((error) => error.includes("introduction") || error.includes("not allowed")),
    errors.join("\n"),
  );
  assert.ok(
    errors.some((error) => error.includes("options[0]") || error.includes("must be an object")),
    errors.join("\n"),
  );
  assert.ok(
    errors.some(
      (error) =>
        error.includes("discussionPrompts") &&
        (error.includes("suggestedLens") ||
          error.includes("sourceIds") ||
          error.includes("why") ||
          error.includes("not allowed")),
    ),
    errors.join("\n"),
  );
});

test("human-intent claims require client or resolution-boundary evidence", () => {
  const invalid = structuredClone(decisionFixture);
  invalid.decisionBrief.rationale.body = "Only a human can approve and the model cannot invoke resolution.";
  invalid.decisionBrief.rationale.sourceIds = ["server-token"];
  const errors = validateUnderstandingPack(invalid);
  assert.ok(errors.some((error) => error.includes("client or resolution trust boundary")));
});

test("renderer escapes source-derived markup and has no network dependencies", () => {
  const hostile = structuredClone(decisionFixture);
  hostile.title = '</title><script data-attack="true">alert(1)</script>';
  hostile.visuals[0].items[0].detail = '<img src=x onerror="alert(1)">';
  const html = renderUnderstandingPack(hostile);
  assert.equal(html.includes('<script data-attack="true">'), false);
  assert.equal(html.includes('<img src=x onerror="alert(1)">'), false);
  assert.ok(html.includes("&lt;script data-attack=&quot;true&quot;&gt;"));
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.equal(/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/iu.test(html), false);
});

test("decision rendering is concise, diagrammatic, and quiz-free", () => {
  const html = renderUnderstandingPack(decisionFixture);
  assert.ok(html.includes('data-profile="decision-brief"'));
  assert.ok(html.includes('class="flow-canvas"'));
  assert.ok(html.includes('class="comparison-grid"'));
  assert.equal(html.includes('id="quiz-form"'), false);
  assert.equal(html.includes("source-chip"), false);
  assert.ok(html.includes('class="citation"'));
});

test("every visual kind uses a purpose-built layout", () => {
  const expectedClasses = {
    flow: "flow-canvas",
    comparison: "comparison-grid",
    "state-timeline": "timeline-track",
    mapping: "mapping-table",
    "guided-steps": "guided-layout"
  };
  for (const [kind, expectedClass] of Object.entries(expectedClasses)) {
    const fixture = structuredClone(trainingFixture);
    fixture.visuals[0].kind = kind;
    fixture.visuals[0].links = kind === "flow"
      ? [{ from: "author", to: "validate" }, { from: "validate", to: "present" }]
      : [];
    if (kind === "comparison") fixture.visuals[0].items = fixture.visuals[0].items.slice(0, 2);
    const html = renderUnderstandingPack(fixture);
    assert.ok(html.includes(`class="${expectedClass}`) || html.includes(` ${expectedClass}"`), `${kind} should render ${expectedClass}`);
  }
});

test("training rendering includes answer marking, explanations, passage links, and reset", () => {
  const html = renderUnderstandingPack(trainingFixture);
  assert.ok(html.includes('id="quiz-form"'));
  assert.ok(html.includes('type="submit" disabled'));
  assert.equal((html.match(/class="quiz-question"/gu) ?? []).length, 3);
  assert.equal((html.match(/class="review-link"/gu) ?? []).length, 3);
  assert.ok(html.includes("correct-answer"));
  assert.ok(html.includes("incorrect-answer"));
  assert.ok(html.includes("Review the supporting passage"));
  assert.ok(html.includes("[hidden]{display:none!important}"));
  assert.ok(html.includes("grid-template-columns:repeat(3,minmax(0,1fr))"));
  assert.ok(html.includes("form.addEventListener('reset'"));
  assert.equal(html.includes("ready to participate"), false);
});

function readFixture(name) {
  const url = new URL(`../evals/fixtures/${name}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}
