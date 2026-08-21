// lib/quiz/deliver.test.ts
// Orchestration coverage for quiz-lead delivery. deliver.ts itself imports
// `server-only` (cannot load in node:test), so the I/O-free orchestrator
// (runDelivery) + the pure payload helpers it composes are tested here. This
// exercises the same reduction the route depends on: no-targets, single-target
// success, partial success, and total failure.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runDelivery,
  selectTargets,
  buildQuizTags,
  answersToNote,
  deliveryStage,
} from "./deliver-helpers";

const ok = () => Promise.resolve(true);
const fail = () => Promise.resolve(false);

test("no targets configured → integration_not_configured", async () => {
  const res = await runDelivery(
    { wantGhl: false, wantWebhook: false },
    { ghl: ok, webhook: ok },
  );
  assert.deepEqual(res, { ok: false, error: "integration_not_configured" });
});

test("GHL-only success → delivered:[ghl]", async () => {
  const res = await runDelivery(
    { wantGhl: true, wantWebhook: false },
    { ghl: ok, webhook: fail },
  );
  assert.deepEqual(res, { ok: true, delivered: ["ghl"] });
});

test("webhook-only success → delivered:[webhook]", async () => {
  const res = await runDelivery(
    { wantGhl: false, wantWebhook: true },
    { ghl: fail, webhook: ok },
  );
  assert.deepEqual(res, { ok: true, delivered: ["webhook"] });
});

test("both wanted, GHL fails but webhook succeeds → delivered:[webhook]", async () => {
  const res = await runDelivery(
    { wantGhl: true, wantWebhook: true },
    { ghl: fail, webhook: ok },
  );
  assert.deepEqual(res, { ok: true, delivered: ["webhook"] });
});

test("both wanted, both succeed → delivered:[ghl, webhook]", async () => {
  const res = await runDelivery(
    { wantGhl: true, wantWebhook: true },
    { ghl: ok, webhook: ok },
  );
  assert.deepEqual(res, { ok: true, delivered: ["ghl", "webhook"] });
});

test("both wanted, both fail → all_targets_failed", async () => {
  const res = await runDelivery(
    { wantGhl: true, wantWebhook: true },
    { ghl: fail, webhook: fail },
  );
  assert.deepEqual(res, { ok: false, error: "all_targets_failed" });
});

test("a webhook failure never blocks GHL (both run)", async () => {
  let ghlRan = false;
  let hookRan = false;
  const res = await runDelivery(
    { wantGhl: true, wantWebhook: true },
    {
      ghl: async () => {
        ghlRan = true;
        return true;
      },
      webhook: async () => {
        hookRan = true;
        return false;
      },
    },
  );
  assert.equal(ghlRan, true);
  assert.equal(hookRan, true);
  assert.deepEqual(res, { ok: true, delivered: ["ghl"] });
});

/* --------------------- target selection (env + policy) --------------------- */

test("selectTargets requires env AND a non-false policy", () => {
  assert.deepEqual(
    selectTargets(
      { ghlToken: "t", ghlLocation: "l", webhookUrl: "https://hook" },
      {},
    ),
    { wantGhl: true, wantWebhook: true },
  );
  // policy can disable a target even when its env is present
  assert.deepEqual(
    selectTargets(
      { ghlToken: "t", ghlLocation: "l", webhookUrl: "https://hook" },
      { ghl: false },
    ),
    { wantGhl: false, wantWebhook: true },
  );
  // missing env disables regardless of policy
  assert.deepEqual(
    selectTargets({ ghlToken: "t" }, { ghl: true, webhook: true }),
    { wantGhl: false, wantWebhook: false },
  );
});

/* --------------------- payload formatting --------------------- */

test("answersToNote omits score and keeps final answer/source first", () => {
  const note = answersToNote({
    email: "a@b.co",
    quizId: "studio-challenge",
    resultKey: "3of4",
    score: 3,
    why: "It's my 40th",
    whyQuestion: "What's making you think about this right now?",
    sourcePage: "/quiz",
    sourceAgent: "quiz-standalone",
    attribution: {
      utm_source: "meta",
      utm_medium: "paid-social",
      utm_campaign: "july-credit",
      fbclid: "fb.123",
    },
    answers: [
      { q: "Will I look like the photos?", a: "Yes — guided posing" },
      { q: "Is it private?", a: "Fully" },
    ],
  });
  assert.match(note, /Final question:\nWhat's making you think about this right now\?\nIt's my 40th/);
  assert.match(note, /Source:\nPage: \/quiz/);
  assert.match(note, /Surface: quiz-standalone/);
  assert.match(note, /UTM source: meta/);
  assert.match(note, /UTM campaign: july-credit/);
  assert.match(note, /Click IDs present: fbclid/);
  assert.match(note, /It's my 40th/);
  assert.match(note, /- Will I look like the photos\?: Yes — guided posing/);
  assert.match(note, /- Is it private\?: Fully/);
  assert.doesNotMatch(note, /Quiz details:/);
  assert.doesNotMatch(note, /Quiz: studio-challenge/);
  assert.doesNotMatch(note, /Result: 3of4/);
  assert.doesNotMatch(note, /Score: 3/);
});

test("buildQuizTags: completion → quiz (unchanged); partial → quiz-abandoned only", () => {
  assert.deepEqual(buildQuizTags("contact"), ["quiz"]);
  assert.deepEqual(buildQuizTags("email"), ["quiz-abandoned"]);
});

test("deliveryStage distinguishes email-only from full contact", () => {
  assert.equal(deliveryStage({ email: "a@b.co" }), "email");
  assert.equal(deliveryStage({ stage: "email", email: "a@b.co", name: "Jordan" }), "email");
  assert.equal(deliveryStage({ stage: "complete", email: "a@b.co" }), "contact");
  assert.equal(deliveryStage({ email: "a@b.co", name: "Jordan" }), "contact");
  assert.equal(deliveryStage({ email: "a@b.co", phone: "+16503219725" }), "contact");
});
