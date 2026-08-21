import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreQuiz } from "./score";

test("scoreQuiz counts correct of total", () => {
  const questions = [
    { options: [{ label: "A", text: "x", isBest: true }, { label: "B", text: "y", isBest: false }] },
    { options: [{ label: "A", text: "x", isBest: false }, { label: "B", text: "y", isBest: true }] },
  ];
  const recorded = [
    { questionIndex: 0, selected: ["A"] },
    { questionIndex: 1, selected: ["A"] },
  ];
  assert.deepEqual(scoreQuiz(recorded, questions), { correct: 1, total: 2 });
});

test("scoreQuiz multi-select requires the full best set", () => {
  const questions = [
    {
      options: [
        { label: "A", text: "a", isBest: true },
        { label: "B", text: "b", isBest: true },
        { label: "C", text: "c", isBest: false },
      ],
    },
  ];
  assert.deepEqual(scoreQuiz([{ questionIndex: 0, selected: ["A", "B"] }], questions), {
    correct: 1,
    total: 1,
  });
  assert.deepEqual(scoreQuiz([{ questionIndex: 0, selected: ["A"] }], questions), {
    correct: 0,
    total: 1,
  });
});
