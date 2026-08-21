// lib/quiz/flow.ts
// Linear flow used for progress %, prev/next nav, and back navigation.
// The forward path branches at "offer" (driven by explicit setScreen calls in
// QuizRunner). Per the doctrine, the title slide carries the offer + claim, then
// goes straight to Q1 — there is no separate "claim" slide.
import type { QuizScreen } from "./types";

export const RUNTIME_QUESTION_LIMIT = 4;

export function buildFlow(questionCount: number): QuizScreen[] {
  const capped = Math.min(questionCount, RUNTIME_QUESTION_LIMIT);
  const flow: QuizScreen[] = ["welcome"];
  for (let i = 1; i <= capped; i += 1) {
    flow.push(`q${i}` as QuizScreen, `e${i}` as QuizScreen);
  }
  flow.push("offer", "email", "fair-enough", "name", "phone", "final-question", "thank-you");
  return flow;
}

/** Returns the 0-based question index for a `qN`/`eN` screen, else -1. */
export function screenToQuestionIndex(screen: QuizScreen): number {
  const m = /^[qe](\d+)$/.exec(screen);
  return m ? Number(m[1]) - 1 : -1;
}

export function nextScreen(screen: QuizScreen, flow: QuizScreen[]): QuizScreen {
  const i = flow.indexOf(screen);
  return flow[Math.min(i + 1, flow.length - 1)];
}

export function prevScreen(screen: QuizScreen, flow: QuizScreen[]): QuizScreen {
  const i = flow.indexOf(screen);
  return flow[Math.max(i - 1, 0)];
}
