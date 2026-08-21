import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  selectTargets,
  buildQuizTags,
  wantGhlForStage,
  tagsToRemoveForStage,
  answersToNote,
  deliveryStage,
  buildWebhookRequest,
  shouldRetryDelivery,
} from "./deliver-helpers";

test("selectTargets: nothing configured → no targets", () => {
  assert.deepEqual(selectTargets({}), { wantGhl: false, wantWebhook: false });
});

test("selectTargets: GHL needs BOTH token and location", () => {
  assert.deepEqual(selectTargets({ ghlToken: "t" }), { wantGhl: false, wantWebhook: false });
  assert.deepEqual(selectTargets({ ghlToken: "t", ghlLocation: "l" }), {
    wantGhl: true,
    wantWebhook: false,
  });
});

test("selectTargets: webhook fires on url; policy can disable a present target", () => {
  assert.deepEqual(selectTargets({ webhookUrl: "https://h" }), {
    wantGhl: false,
    wantWebhook: true,
  });
  assert.deepEqual(
    selectTargets({ ghlToken: "t", ghlLocation: "l", webhookUrl: "https://h" }, { webhook: false }),
    { wantGhl: true, wantWebhook: false },
  );
});

test("buildQuizTags: completion → quiz (unchanged)", () => {
  assert.deepEqual(buildQuizTags("contact"), ["quiz"]);
});

test("buildQuizTags: partial/abandoned → quiz-abandoned and NOT quiz", () => {
  const tags = buildQuizTags("email");
  assert.deepEqual(tags, ["quiz-abandoned"]);
  // Critical: a partial must never carry the base `quiz` tag, or it would
  // enter the booked-lead automations that key off it.
  assert.ok(!tags.includes("quiz"));
});

test("wantGhlForStage: a completion always syncs when GHL is configured", () => {
  assert.equal(wantGhlForStage("contact", true), true);
  assert.equal(wantGhlForStage("contact", false), false); // GHL not configured
});

test("wantGhlForStage: a partial syncs ONLY when the site opts into partials", () => {
  assert.equal(wantGhlForStage("email", true), false); // default: partials off
  assert.equal(wantGhlForStage("email", true, {}), false);
  assert.equal(wantGhlForStage("email", true, { partials: false }), false);
  assert.equal(wantGhlForStage("email", true, { partials: true }), true);
  // opted-in but GHL unconfigured → still nothing
  assert.equal(wantGhlForStage("email", false, { partials: true }), false);
});

test("tagsToRemoveForStage: strips quiz-abandoned only on a partials-enabled completion", () => {
  // Completion on a partials-enabled site → shed the abandoned tag.
  assert.deepEqual(tagsToRemoveForStage("contact", { partials: true }), ["quiz-abandoned"]);
  // Email stage never removes (the partial is being SET here, not cleared).
  assert.deepEqual(tagsToRemoveForStage("email", { partials: true }), []);
  // Partials-off site → nothing to clean up.
  assert.deepEqual(tagsToRemoveForStage("contact"), []);
  assert.deepEqual(tagsToRemoveForStage("contact", {}), []);
  assert.deepEqual(tagsToRemoveForStage("contact", { partials: false }), []);
});

test("answersToNote renders final answer + source context without score", () => {
  const note = answersToNote({
    email: "a@b.c",
    quizId: "bridal",
    score: 3,
    why: "Getting married",
    whyQuestion: "What's making you think about this right now?",
    sourcePage: "/quiz",
    sourceAgent: "quiz-popup",
    attribution: {
      utm_source: "meta",
      utm_medium: "paid-social",
      utm_campaign: "summer-credit",
      gclid: "gclid.123",
    },
    answers: [{ q: "Q1", a: "A1" }],
  });
  assert.match(note, /Final question:\nWhat's making you think about this right now\?\nGetting married/);
  assert.match(note, /Source:\nPage: \/quiz/);
  assert.match(note, /Surface: quiz-popup/);
  assert.match(note, /UTM source: meta/);
  assert.match(note, /UTM campaign: summer-credit/);
  assert.match(note, /Click IDs present: gclid/);
  assert.match(note, /- Q1: A1/);
  assert.doesNotMatch(note, /Quiz details:/);
  assert.doesNotMatch(note, /Quiz: bridal/);
  assert.doesNotMatch(note, /Score: 3/);
});

test("deliveryStage is email until name/phone present", () => {
  assert.equal(deliveryStage({ email: "a@b.c" }), "email");
  assert.equal(deliveryStage({ stage: "email", email: "a@b.c", name: "Jo" }), "email");
  assert.equal(deliveryStage({ stage: "complete", email: "a@b.c" }), "contact");
  assert.equal(deliveryStage({ email: "a@b.c", name: "Jo" }), "contact");
});

/* --------------------- webhook signature + integrity --------------------- */

test("buildWebhookRequest signs the EXACT body string with HMAC-SHA256", () => {
  const secret = "whsec_test_123";
  const { body, headers } = buildWebhookRequest(
    { email: "a@b.co", quizId: "bridal", score: 3 },
    secret,
  );
  // Signature is computed independently here over the exact emitted body string.
  const expected =
    "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
  assert.equal(headers["X-Quiz-Signature"], expected);
  assert.equal(headers.Authorization, `Bearer ${secret}`);
  assert.equal(headers["Content-Type"], "application/json");
  // The signed string must round-trip to the same payload that was sent.
  assert.deepEqual(JSON.parse(body), {
    email: "a@b.co",
    quizId: "bridal",
    score: 3,
  });
});

test("buildWebhookRequest omits auth + signature when no secret", () => {
  const { headers } = buildWebhookRequest({ email: "a@b.co" });
  assert.equal(headers["X-Quiz-Signature"], undefined);
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers["Content-Type"], "application/json");
});

test("buildWebhookRequest sanitizes free-text: strips HTML + handlebars", () => {
  const { body } = buildWebhookRequest(
    {
      email: "a@b.co",
      name: "<b>Jo</b>{{x}}",
      why: "I want <script>alert(1)</script> {{ssn}} photos",
      answers: [{ q: "Q<i>1</i>", a: "A {{token}} 1" }],
    },
    "secret",
  );
  const parsed = JSON.parse(body) as {
    name: string;
    why: string;
    answers: { q: string; a: string }[];
  };
  // No raw HTML tags and no {{handlebars}} survive into the webhook JSON.
  for (const field of [parsed.name, parsed.why, parsed.answers[0].q, parsed.answers[0].a]) {
    assert.doesNotMatch(field, /<[^>]+>/, `HTML leaked: ${field}`);
    assert.doesNotMatch(field, /\{\{.*?\}\}/, `handlebars leaked: ${field}`);
  }
  assert.equal(parsed.name, "Jo");
  assert.match(parsed.why, /I want\s+alert\(1\)\s+photos/);
  assert.equal(parsed.answers[0].q, "Q1");
  assert.match(parsed.answers[0].a, /A\s+1/);
});

/* --------------------- transient-retry decision --------------------- */

test("shouldRetryDelivery retries 5xx + 429, not other 4xx", () => {
  assert.equal(shouldRetryDelivery(500), true);
  assert.equal(shouldRetryDelivery(503), true);
  assert.equal(shouldRetryDelivery(429), true);
  assert.equal(shouldRetryDelivery(400), false);
  assert.equal(shouldRetryDelivery(401), false);
  assert.equal(shouldRetryDelivery(404), false);
  assert.equal(shouldRetryDelivery(422), false);
  assert.equal(shouldRetryDelivery(200), false);
});

test("shouldRetryDelivery retries thrown network/timeout errors", () => {
  assert.equal(shouldRetryDelivery(new Error("network")), true);
  const abort = new Error("timed out");
  abort.name = "AbortError";
  assert.equal(shouldRetryDelivery(abort), true);
});

test("GHL retry: a 5xx-then-200 sequence succeeds; a 4xx is not retried", async () => {
  // Simulate the per-attempt loop deliver.ts/contacts.ts run, using the pure
  // shouldRetryDelivery decision (the loop itself lives in a server-only module).
  async function runWithRetry(statuses: number[]): Promise<{ status: number; attempts: number }> {
    let attempts = 0;
    let status = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
      attempts++;
      status = statuses[attempt] ?? statuses[statuses.length - 1];
      if (status < 400) return { status, attempts };
      if (attempt === 0 && shouldRetryDelivery(status)) continue;
      break;
    }
    return { status, attempts };
  }

  // 5xx then 200 → two attempts, final success.
  assert.deepEqual(await runWithRetry([503, 200]), { status: 200, attempts: 2 });
  // 4xx → single attempt, no retry.
  assert.deepEqual(await runWithRetry([422, 200]), { status: 422, attempts: 1 });
  assert.deepEqual(await runWithRetry([400, 200]), { status: 400, attempts: 1 });
});
