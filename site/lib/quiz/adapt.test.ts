import { test } from "node:test";
import assert from "node:assert/strict";
import { adaptQuiz } from "./adapt";
import type { ContractQuestion, SiteQuiz } from "./types";

function q(overrides: Partial<ContractQuestion> = {}): ContractQuestion {
  return {
    question: "Q?",
    answer_format: "multiple_choice",
    options: ["Right one", "Wrong a", "Wrong b"],
    best_answer: "Right one",
    statement: "Here is the hook. Then the long teaching body explains everything in detail.",
    ...overrides,
  };
}

function fixture(overrides: Partial<SiteQuiz> = {}): SiteQuiz {
  return {
    id: "demo",
    theme: { font: "var(--font-x)", textColor: "#F1ECE3", buttonColor: "#2C2620" },
    background: { imageSrc: "/bg.jpg" },
    statementImages: ["/s0.jpg", null, null, null],
    content: {
      client_id: "demo",
      readiness_label: "review_draft",
      title_slide: { headline: "Title", subhead: "Sub" },
      main_questions: [q(), q(), q(), q({ best_answer: "A, B", options: ["A", "B", "C"] })],
      offer_slide: { headline: "Offer", benefit_bullets: ["x", "y", "z"], button_text: "Send it" },
      fair_enough_slide: { headline: "Fair", paragraph: "Para", second_chance_cta: "Just send it" },
      info_collection: {
        fields: [
          "Email — Where do we send results?",
          "First name — And your first name?",
          "Phone — Best number? (optional)",
          "Why — What brings you here?",
        ],
      },
      alternate_questions: [q(), q(), q(), q()],
      thank_you: { headline: "Thanks", lines: ["l1", "l2"] },
      follow_up_email: { subject: "s", body: "b" },
    },
    ...overrides,
  };
}

test("renders exactly the 4 live questions with A.. labels", () => {
  const data = adaptQuiz(fixture());
  assert.equal(data.questions.length, 4);
  assert.deepEqual(data.questions[0].options.map((o) => o.label), ["A", "B", "C"]);
});

test("isBest is set from best_answer (single + comma-joined)", () => {
  const data = adaptQuiz(fixture());
  assert.deepEqual(data.questions[0].options.map((o) => o.isBest), [true, false, false]);
  // Q4 best_answer "A, B" → first two options correct (legacy comma fallback)
  assert.deepEqual(data.questions[3].options.map((o) => o.isBest), [true, true, false]);
});

test("single best_answer that itself contains a comma still matches its option", () => {
  // The real bug: comma-splitting a single best_answer shreds it into fragments
  // that never match the full option. Whole-string match handles internal commas.
  const data = adaptQuiz(
    fixture({
      content: {
        ...fixture().content,
        main_questions: [
          q({
            options: ["No, and lighting does the work", "Yes", "Maybe"],
            best_answer: "No, and lighting does the work",
          }),
          q(),
          q(),
          q(),
        ],
      },
    }),
  );
  assert.deepEqual(data.questions[0].options.map((o) => o.isBest), [true, false, false]);
});

test("semicolon-joined multi-answer matches options that contain commas", () => {
  const data = adaptQuiz(
    fixture({
      content: {
        ...fixture().content,
        main_questions: [
          q({
            answer_format: "select_all",
            options: [
              "You work with one photographer, start to finish",
              "The studio is private, by appointment",
              "None of it — it's out of your hands",
            ],
            best_answer:
              "You work with one photographer, start to finish; The studio is private, by appointment",
          }),
          q(),
          q(),
          q(),
        ],
      },
    }),
  );
  assert.deepEqual(data.questions[0].options.map((o) => o.isBest), [true, true, false]);
});

test("statement splits into lead title + body and pulls index-aligned image", () => {
  const data = adaptQuiz(fixture());
  assert.equal(data.questions[0].statementTitle, "Here is the hook.");
  assert.match(data.questions[0].statementBody, /^Then the long teaching body/);
  assert.equal(data.questions[0].statementImageSrc, "/s0.jpg");
  assert.equal(data.questions[1].statementImageSrc, null);
});

test("theme passes through raw (runner resolves final colors per-viewport)", () => {
  const data = adaptQuiz(fixture());
  assert.equal(data.theme.font, "var(--font-x)");
  assert.equal(data.theme.buttonColor, "#2C2620");
});

test("info_collection prompts map to name/phone/final by index", () => {
  const data = adaptQuiz(fixture());
  assert.equal(data.nameLabel, "And your first name?");
  assert.equal(data.phoneLabel, "Best number? (optional)");
  assert.equal(data.finalQuestion, "What brings you here?");
});

test("capture fields are REQUIRED by default; optionalFields relaxes them", () => {
  const data = adaptQuiz(fixture());
  assert.equal(data.phoneRequired, true);
  assert.equal(data.whyRequired, true);

  const relaxed = adaptQuiz(fixture({ optionalFields: ["phone"] }));
  assert.equal(relaxed.phoneRequired, false);
  assert.equal(relaxed.whyRequired, true); // only the listed field is relaxed

  const both = adaptQuiz(fixture({ optionalFields: ["phone", "why"] }));
  assert.equal(both.phoneRequired, false);
  assert.equal(both.whyRequired, false);
});

test("labels: English defaults apply when none configured; a partial override wins per-field", () => {
  // No labels configured → every chrome string resolves to the English default.
  const data = adaptQuiz(fixture());
  assert.equal(data.labels.start, "Take the quiz");
  assert.equal(data.labels.decline, "Not yet");
  assert.equal(data.labels.reconsider, "Go back");
  assert.equal(data.labels.continue, "Continue");
  assert.equal(data.labels.questionProgress, "Question {current} of {total}");
  assert.equal(data.welcome.startLabel, "Take the quiz");
  assert.equal(data.offerGate.noLabel, "Not yet");
  assert.equal(data.fairEnough.reconsiderLabel, "Go back");

  // A partial override wins for its field; every other field keeps the default.
  const localized = adaptQuiz(fixture({ labels: { start: "Empezar" } }));
  assert.equal(localized.labels.start, "Empezar");
  assert.equal(localized.welcome.startLabel, "Empezar");
  assert.equal(localized.labels.decline, "Not yet");
  assert.equal(localized.labels.reconsider, "Go back");
  assert.equal(localized.labels.submit, "Submit");
});

test("offer + redirect defaults", () => {
  const data = adaptQuiz(fixture());
  assert.equal(data.offerGate.yesLabel, "Send it");
  assert.equal(data.offerGate.noLabel, "Not yet");
  assert.deepEqual(data.email.benefits, ["x", "y", "z"]);
  assert.equal(data.redirectTo, "/thank-you");
  assert.equal(adaptQuiz(fixture({ redirectTo: "/done" })).redirectTo, "/done");
});
