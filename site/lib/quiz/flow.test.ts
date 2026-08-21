import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildFlow,
  nextScreen,
  prevScreen,
  screenToQuestionIndex,
  RUNTIME_QUESTION_LIMIT,
} from "./flow";

test("buildFlow emits welcome → q/e pairs → capture tail", () => {
  assert.deepEqual(buildFlow(2), [
    "welcome",
    "q1", "e1",
    "q2", "e2",
    "offer", "email", "fair-enough", "name", "phone", "final-question", "thank-you",
  ]);
});

test("buildFlow caps questions at RUNTIME_QUESTION_LIMIT", () => {
  const flow = buildFlow(10);
  const qScreens = flow.filter((s) => /^q\d+$/.test(s));
  assert.equal(qScreens.length, RUNTIME_QUESTION_LIMIT);
  assert.equal(qScreens.at(-1), `q${RUNTIME_QUESTION_LIMIT}`);
});

test("screenToQuestionIndex parses qN/eN, else -1", () => {
  assert.equal(screenToQuestionIndex("q1"), 0);
  assert.equal(screenToQuestionIndex("e3"), 2);
  assert.equal(screenToQuestionIndex("offer"), -1);
  assert.equal(screenToQuestionIndex("welcome"), -1);
});

test("nextScreen / prevScreen advance and clamp at the bounds", () => {
  const flow = buildFlow(4);
  assert.equal(nextScreen("welcome", flow), "q1");
  assert.equal(prevScreen("q1", flow), "welcome");
  // Clamp: no screen before welcome, none after thank-you.
  assert.equal(prevScreen("welcome", flow), "welcome");
  assert.equal(nextScreen("thank-you", flow), "thank-you");
});

test("nextScreen walks a statement reveal to the next question", () => {
  const flow = buildFlow(4);
  assert.equal(nextScreen("e1", flow), "q2");
  assert.equal(nextScreen("e4", flow), "offer");
});
