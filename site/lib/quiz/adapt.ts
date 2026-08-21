// lib/quiz/adapt.ts
// Merges the authoring contract (QuizOutput) + per-site presentation (SiteQuiz)
// into the renderer shape (QuizRunnerData). Pure and unit-tested.
import { RUNTIME_QUESTION_LIMIT } from "./flow";
import type {
  AnswerFormat,
  ContractQuestion,
  QuizOutput,
  QuizRunnerData,
  ResolvedQuizLabels,
  RunnerAnswerOption,
  RunnerQuestion,
  SiteQuiz,
} from "./types";

const LABELS = ["A", "B", "C", "D", "E", "F"];

/**
 * English defaults for every chrome string. A non-English client overrides any
 * subset via `quiz.labels`; unset fields keep these. This is the SINGLE source
 * of the engine's English copy, so no chrome string is hardcoded in a slide.
 * `{token}` placeholders are interpolated by the consuming slide.
 */
export const DEFAULT_QUIZ_LABELS: ResolvedQuizLabels = {
  start: "Take the quiz",
  decline: "Not yet",
  reconsider: "Go back",
  continue: "Continue",
  submit: "Submit",
  saving: "Saving…",
  offerEyebrow: "Almost there",
  questionProgress: "Question {current} of {total}",
  selectAllHint: "Select all that apply, then continue.",
  selectedHint: "{count} selected: pick all that apply, then continue.",
  emailLabel: "Email address",
  emailPlaceholder: "you@example.com",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  namePlaceholder: "Your name",
  nameRequired: "Please enter your name.",
  phonePlaceholder: "(555) 123-4567",
  phoneRequired: "Please enter your phone number.",
  phoneInvalid: "Please enter a valid phone number.",
  whyPlaceholder: "Tell us a bit…",
  close: "Close quiz",
  back: "Previous",
  next: "Next",
};

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Split a teaching statement into a lead sentence + the remainder. */
function splitStatement(statement: string): { title: string; body: string } {
  const s = statement.trim();
  const m = /^([\s\S]*?[.!?])\s+([\s\S]*)$/.exec(s);
  if (m && m[1].length <= 160) return { title: m[1].trim(), body: m[2].trim() };
  return { title: "", body: s };
}

/** Pull the human prompt from a descriptive info_collection field ("Label: prompt"). */
function fieldPrompt(fields: string[], index: number, fallback: string): string {
  const raw = fields[index];
  if (!raw) return fallback;
  const split = raw.split(/\s+[\u2014–-]\s+/);
  return (split.length > 1 ? split.slice(1).join(": ") : raw).trim() || fallback;
}

/**
 * Resolve which option texts are correct. `best_answer` holds the FULL text of
 * each correct option. Comma cannot be the delimiter because option prose contains
 * commas ("No: the studio is for every body, and guided posing..."), so:
 *   1. whole string equals one option → single answer (internal commas safe)
 *   2. canonical multi-answer → full option texts joined with "; " (semicolon)
 *   3. legacy fallback → comma-joined (only unambiguous when options are
 *      comma-free; kept for older authored data)
 */
function bestAnswerSet(q: ContractQuestion): Set<string> {
  const raw = q.best_answer.trim();
  const optionNorms = new Set(q.options.map(norm));
  if (optionNorms.has(norm(raw))) return new Set([norm(raw)]);
  if (raw.includes(";")) return new Set(raw.split(";").map(norm).filter(Boolean));
  return new Set(raw.split(",").map(norm).filter(Boolean));
}

function adaptQuestion(
  q: ContractQuestion,
  statementImage: string | null | undefined,
): RunnerQuestion {
  const bestSet = bestAnswerSet(q);
  const options: RunnerAnswerOption[] = q.options.map((text, i) => ({
    label: LABELS[i] ?? String(i + 1),
    text,
    isBest: bestSet.has(norm(text)),
  }));
  const { title, body } = splitStatement(q.statement);
  return {
    question: q.question,
    format: q.answer_format as AnswerFormat,
    options,
    statementTitle: title,
    statementBody: body,
    statementImageSrc: statementImage ?? null,
  };
}

export function adaptQuiz(quiz: SiteQuiz): QuizRunnerData {
  // Total / defensive: a build-validated config has every field, but adaptQuiz
  // runs at render. Guarding each deref (optional chaining + fallbacks) means a
  // partial/malformed config degrades to empty copy instead of throwing and
  // white-screening the page (paired with the quiz route error boundary).
  const c = quiz.content ?? ({} as QuizOutput);
  const liveQuestions = (c.main_questions ?? []).slice(0, RUNTIME_QUESTION_LIMIT);
  const questions = liveQuestions.map((q, i) =>
    adaptQuestion(q, quiz.statementImages?.[i] ?? null),
  );

  const fields = c.info_collection?.fields ?? [];
  const offer = c.offer_slide;
  // Every capture field is REQUIRED by default; a client relaxes one via
  // quiz.optionalFields (e.g. ["phone"]).
  const optional = new Set(quiz.optionalFields ?? []);

  // Resolve chrome strings: config overrides win field-by-field over the English
  // defaults; every field ends up present (ResolvedQuizLabels).
  const labels: ResolvedQuizLabels = { ...DEFAULT_QUIZ_LABELS, ...quiz.labels };

  return {
    id: quiz.id,
    // Pass the raw config theme; QuizRunner resolves final colors per-viewport
    // (light/dark) from design tokens.
    theme: quiz.theme,
    labels,
    background: quiz.background,
    welcome: {
      headline: c.title_slide?.headline ?? "",
      subheadline: c.title_slide?.subhead,
      startLabel: labels.start,
    },
    questions,
    offerGate: {
      question: offer?.headline ?? "",
      yesLabel: offer?.button_text ?? labels.continue,
      noLabel: labels.decline,
    },
    email: {
      offerHeadline: offer?.headline ?? "",
      benefits: offer?.benefit_bullets ?? [],
      cta: offer?.button_text ?? labels.continue,
    },
    fairEnough: {
      headline: c.fair_enough_slide?.headline ?? "",
      body: c.fair_enough_slide?.paragraph ?? "",
      continueLabel: c.fair_enough_slide?.second_chance_cta ?? labels.continue,
      reconsiderLabel: labels.reconsider,
    },
    nameLabel: fieldPrompt(fields, 1, "And your first name?"),
    phoneLabel: fieldPrompt(fields, 2, "Best phone number?"),
    finalQuestion: fieldPrompt(fields, 3, "What's making you think about this right now?"),
    phoneRequired: !optional.has("phone"),
    whyRequired: !optional.has("why"),
    thankYou: { headline: c.thank_you?.headline ?? "", lines: c.thank_you?.lines ?? [] },
    redirectTo: quiz.redirectTo ?? "/thank-you",
  };
}
