// lib/quiz/score.ts
// Challenge-quiz scoring. The flow never blocks on the score — every statement
// teaches regardless - but the score still drives lightweight analytics.
import type { RunnerQuestion } from "./types";

// Scoring is on the resolved `isBest` flags (set by adaptQuiz from best_answer),
// never re-parsed from the best_answer string at submit time.

/** Counts questions where the selected labels exactly equal the isBest set. */
export function scoreQuiz(
  recorded: { questionIndex: number; selected: string[] }[],
  questions: Pick<RunnerQuestion, "options">[],
): { correct: number; total: number } {
  let correct = 0;
  for (const r of recorded) {
    const q = questions[r.questionIndex];
    if (!q) continue;
    const bestSet = new Set(q.options.filter((o) => o.isBest).map((o) => o.label));
    const selSet = new Set(r.selected);
    if (bestSet.size > 0 && bestSet.size === selSet.size && [...bestSet].every((l) => selSet.has(l))) {
      correct += 1;
    }
  }
  return { correct, total: questions.length };
}
