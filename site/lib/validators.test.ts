import { test } from "node:test";
import assert from "node:assert/strict";
import { InquirySchema, QuizLeadSchema } from "./validators";

test("InquirySchema accepts a minimal website inquiry", () => {
  const inquiry = InquirySchema.parse({
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
  });

  assert.equal(inquiry.name, "Jane Doe");
  assert.equal(inquiry.email, "jane@example.com");
  assert.equal(inquiry.phone, undefined);
});

test("InquirySchema rejects invalid lead identity", () => {
  assert.equal(
    InquirySchema.safeParse({ name: "J", email: "not-an-email" }).success,
    false
  );
});

test("QuizLeadSchema trims email and coerces score", () => {
  const lead = QuizLeadSchema.parse({
    stage: "complete",
    email: "  jane@example.com  ",
    score: "42",
    whyQuestion: "What brings you here?",
    answers: [{ q: "Goal", a: "Confidence" }],
  });

  assert.equal(lead.email, "jane@example.com");
  assert.equal(lead.score, 42);
  assert.equal(lead.whyQuestion, "What brings you here?");
});

test("QuizLeadSchema rejects missing email", () => {
  assert.equal(QuizLeadSchema.safeParse({ stage: "email", email: "" }).success, false);
});
