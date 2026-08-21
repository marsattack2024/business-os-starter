import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  formatUsPhone,
  isValidPhone,
  toE164,
  validateSiteQuizAlignment,
  contrastRatio,
} from "./validate";
import type { ContractQuestion, SiteQuiz } from "./types";

test("isValidEmail accepts real addresses, rejects junk", () => {
  for (const ok of ["a@b.co", "carly.hudson@example.com", "x+tag@mail.org"]) {
    assert.equal(isValidEmail(ok), true, ok);
  }
  for (const bad of ["", "nope", "a@b", "a@@b.com", "a b@c.com", "a@b.c", "@b.com"]) {
    assert.equal(isValidEmail(bad), false, bad);
  }
});

test("formatUsPhone formats progressively", () => {
  assert.equal(formatUsPhone(""), "");
  assert.equal(formatUsPhone("65"), "(65");
  assert.equal(formatUsPhone("650"), "(650");
  assert.equal(formatUsPhone("650321"), "(650) 321");
  assert.equal(formatUsPhone("6503219725"), "(650) 321-9725");
  // already-formatted re-formats stably
  assert.equal(formatUsPhone("(650) 321-9725"), "(650) 321-9725");
});

test("formatUsPhone leaves international numbers alone", () => {
  assert.equal(formatUsPhone("+447911123456"), "+447911123456");
  assert.equal(formatUsPhone("+1 650 321 9725"), "+1 650 321 9725");
});

test("isValidPhone needs >=10 digits / valid E.164", () => {
  assert.equal(isValidPhone("(650) 321-9725"), true);
  assert.equal(isValidPhone("6503219725"), true);
  assert.equal(isValidPhone("+447911123456"), true);
  assert.equal(isValidPhone("650321"), false);
  assert.equal(isValidPhone(""), false);
  assert.equal(isValidPhone("abc"), false);
});

test("toE164 canonicalizes US numbers", () => {
  assert.equal(toE164("(650) 321-9725"), "+16503219725");
  assert.equal(toE164("6503219725"), "+16503219725");
});

/* --------------------- validateSiteQuizAlignment --------------------- */

function qq(overrides: Partial<ContractQuestion> = {}): ContractQuestion {
  return {
    question: "Q?",
    answer_format: "multiple_choice",
    options: ["Right", "Wrong a", "Wrong b"],
    best_answer: "Right",
    statement: "Hook. Body explains it.",
    ...overrides,
  };
}

function quizFixture(overrides: Partial<SiteQuiz> = {}): SiteQuiz {
  return {
    id: "demo",
    theme: { font: "var(--font-x)", mode: "light" },
    background: { imageSrc: "/bg.jpg" },
    statementImages: ["/s0.jpg", null, null, null],
    content: {
      contract_version: "1.0",
      client_id: "demo",
      readiness_label: "review_draft",
      title_slide: { headline: "Title" },
      main_questions: [qq(), qq(), qq(), qq()],
      offer_slide: { headline: "Offer", benefit_bullets: ["x", "y", "z"], button_text: "Go" },
      fair_enough_slide: { headline: "Fair", paragraph: "Para", second_chance_cta: "Send" },
      info_collection: {
        fields: ["Email — where?", "First name — name?", "Phone — number?", "Why — reason?"],
      },
      alternate_questions: [qq(), qq(), qq(), qq()],
      thank_you: { headline: "Thanks", lines: ["l1", "l2"] },
      follow_up_email: { subject: "s", body: "b" },
    },
    ...overrides,
  };
}

test("validateSiteQuizAlignment accepts a well-formed config", () => {
  const res = validateSiteQuizAlignment(quizFixture());
  assert.deepEqual(res, { ok: true });
});

test("validateSiteQuizAlignment flags a missing background image", () => {
  const res = validateSiteQuizAlignment(
    quizFixture({ background: { imageSrc: "" } }),
  );
  assert.equal(res.ok, false);
  assert.ok(!res.ok && res.errors.some((e) => e.includes("background.imageSrc")));
});

test("validateSiteQuizAlignment flags statementImages not aligned to live questions", () => {
  const res = validateSiteQuizAlignment(
    quizFixture({ statementImages: ["/s0.jpg", "/s1.jpg"] }),
  );
  assert.equal(res.ok, false);
  assert.ok(!res.ok && res.errors.some((e) => e.includes("statementImages")));
});

test("validateSiteQuizAlignment accepts var() and hex color overrides, rejects keywords", () => {
  assert.equal(
    validateSiteQuizAlignment(
      quizFixture({ theme: { font: "var(--f)", accentColor: "var(--color-accent)", buttonColor: "#2C2620" } }),
    ).ok,
    true,
  );
  const bad = validateSiteQuizAlignment(
    quizFixture({ theme: { font: "var(--f)", textColor: "rebeccapurple" } }),
  );
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.errors.some((e) => e.includes("textColor")));
});

test("validateSiteQuizAlignment accepts a valid overlay rgb triple, rejects a bad one", () => {
  assert.equal(
    validateSiteQuizAlignment(
      quizFixture({ background: { imageSrc: "/bg.jpg", overlayColor: "255, 255, 255", overlayColorMobile: "0, 0, 0" } }),
    ).ok,
    true,
  );
  const bad = validateSiteQuizAlignment(
    quizFixture({ background: { imageSrc: "/bg.jpg", overlayColor: "300, 0, 0" } }),
  );
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.errors.some((e) => e.includes("overlayColor")));

  const malformed = validateSiteQuizAlignment(
    quizFixture({ background: { imageSrc: "/bg.jpg", overlayColor: "white" } }),
  );
  assert.equal(malformed.ok, false);
  assert.ok(!malformed.ok && malformed.errors.some((e) => e.includes("overlayColor")));
});

test("contrastRatio: black vs white is ~21", () => {
  assert.ok(contrastRatio("#000000", "#FFFFFF") > 20);
});

test("validateSiteQuizAlignment rejects a low-contrast accent hex pair", () => {
  const res = validateSiteQuizAlignment(
    quizFixture({
      theme: { font: "var(--f)", accentColor: "#FFFF00", accentTextColor: "#FFFFFF" },
    }),
  );
  assert.equal(res.ok, false);
  assert.ok(!res.ok && res.errors.some((e) => e.includes("accent contrast")));
});

test("validateSiteQuizAlignment accepts a high-contrast accent hex pair", () => {
  assert.equal(
    validateSiteQuizAlignment(
      quizFixture({
        theme: { font: "var(--f)", accentColor: "#000000", accentTextColor: "#FFFFFF" },
      }),
    ).ok,
    true,
  );
});

test("validateSiteQuizAlignment does not contrast-check token (var()) accent refs", () => {
  const res = validateSiteQuizAlignment(
    quizFixture({
      theme: {
        font: "var(--f)",
        accentColor: "var(--color-accent)",
        accentTextColor: "var(--color-cream)",
      },
    }),
  );
  assert.equal(res.ok, true);
});

test("validateSiteQuizAlignment requires >=3 info_collection fields and a font", () => {
  const res = validateSiteQuizAlignment(
    quizFixture({
      theme: { font: "" },
      content: {
        ...quizFixture().content,
        info_collection: { fields: ["only one"] },
      },
    }),
  );
  assert.equal(res.ok, false);
  assert.ok(!res.ok && res.errors.some((e) => e.includes("info_collection.fields")));
  assert.ok(!res.ok && res.errors.some((e) => e.includes("theme.font")));
});
