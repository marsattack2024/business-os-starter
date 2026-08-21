// lib/quiz/deliver-helpers.ts
// Pure helpers for quiz-lead delivery (no I/O, no @/ imports) so they're
// unit-testable. The orchestration that actually calls GHL/webhook lives in
// deliver.ts.
import { createHmac } from "node:crypto";
import { sanitizeFreeText } from "../sanitize";

type AttributionForNote = Partial<
  Record<
    | "utm_source"
    | "utm_medium"
    | "utm_campaign"
    | "utm_term"
    | "utm_content"
    | "gclid"
    | "gbraid"
    | "wbraid"
    | "fbclid"
    | "ttclid"
    | "msclkid"
    | "li_fat_id",
    string
  >
>;

export interface QuizDeliveryFields {
  stage?: "email" | "complete";
  email: string;
  name?: string;
  phone?: string;
  why?: string;
  whyQuestion?: string;
  quizId?: string;
  resultKey?: string;
  score?: number;
  answers?: { q: string; a: string }[];
  sourcePage?: string;
  sourceAgent?: string;
  attribution?: AttributionForNote;
}

export interface TargetEnv {
  ghlToken?: string;
  ghlLocation?: string;
  webhookUrl?: string;
}

export interface DeliveryPolicy {
  ghl?: boolean;
  webhook?: boolean;
  /**
   * Also deliver the email-capture (partial/abandoned) quiz stage to GHL,
   * tagged `quiz-abandoned` so an abandoner workflow can nudge it. Off by
   * default: a site opts in only once its GHL automations are gated to the
   * `quiz` tag (never a bare "contact created" trigger), so a partial contact
   * never trips the booked-lead sequences.
   */
  partials?: boolean;
}

/** A target fires only when its env is present AND policy hasn't disabled it. */
export function selectTargets(
  env: TargetEnv,
  policy: DeliveryPolicy = {},
): { wantGhl: boolean; wantWebhook: boolean } {
  const wantGhl = Boolean(env.ghlToken && env.ghlLocation) && policy.ghl !== false;
  const wantWebhook = Boolean(env.webhookUrl) && policy.webhook !== false;
  return { wantGhl, wantWebhook };
}

/**
 * CRM tags for a quiz lead, by delivery stage. Details stay readable in the
 * contact note.
 *  - A completed quiz carries just the `quiz` tag — UNCHANGED from every site's
 *    long-standing behavior, and it uniquely marks a finisher.
 *  - A partial/abandoned quiz (email-capture step only) carries `quiz-abandoned`
 *    and deliberately NOT `quiz`, so it never enters the booked-lead automations.
 *    An abandoner workflow triggers on `quiz-abandoned`, waits, then stops if the
 *    contact has since earned the `quiz` tag (i.e. finished).
 */
export function buildQuizTags(stage: "email" | "contact"): string[] {
  return stage === "email" ? ["quiz-abandoned"] : ["quiz"];
}

/**
 * Whether GHL should receive THIS delivery. A completed contact always goes
 * (when GHL is configured). The email-only (partial/abandoned) stage goes only
 * when the site opts in via `delivery.partials` — tagged `quiz-abandoned` so it
 * can be nudged without entering the booked-lead automations.
 */
export function wantGhlForStage(
  stage: "email" | "contact",
  configuredGhl: boolean,
  policy: DeliveryPolicy = {},
): boolean {
  if (!configuredGhl) return false;
  if (stage === "contact") return true;
  return policy.partials === true;
}

/**
 * Tags to strip from the contact AFTER a delivery. On completing a
 * partials-enabled quiz, shed `quiz-abandoned` so a finisher isn't left
 * double-tagged (GHL's contact upsert MERGES tags rather than replacing them, so
 * the abandoned tag the email stage set must be removed explicitly). Empty for
 * the email stage and for partials-off sites.
 */
export function tagsToRemoveForStage(
  stage: "email" | "contact",
  policy: DeliveryPolicy = {},
): string[] {
  return stage === "contact" && policy.partials === true ? ["quiz-abandoned"] : [];
}

/** Render quiz answers as a GHL note body (mirrors formatNote in lib/ghl/contacts). */
export function answersToNote(input: QuizDeliveryFields): string {
  const lines: string[] = ["Quiz lead"];

  const finalAnswer = sanitizeFreeText(input.why, 2_000);
  if (finalAnswer) {
    lines.push("", "Final question:");
    const finalQuestion = sanitizeFreeText(input.whyQuestion, 240);
    if (finalQuestion) lines.push(finalQuestion);
    lines.push(finalAnswer);
  }

  const sourceLines = sourceContextLines(input);
  if (sourceLines.length) lines.push("", "Source:", ...sourceLines);

  if (input.answers?.length) {
    lines.push("", "Answers:");
    for (const { q, a } of input.answers) {
      const question = sanitizeFreeText(q, 500) ?? "";
      const answer = sanitizeFreeText(a, 500) ?? "";
      if (question || answer) lines.push(`- ${question}: ${answer}`);
    }
  }
  return lines.join("\n");
}

function sourceContextLines(input: QuizDeliveryFields): string[] {
  const lines: string[] = [];
  const sourcePage = sanitizeFreeText(input.sourcePage, 240);
  const sourceAgent = sanitizeFreeText(input.sourceAgent, 120);
  if (sourcePage) lines.push(`Page: ${sourcePage}`);
  if (sourceAgent) lines.push(`Surface: ${sourceAgent}`);

  const attribution = input.attribution;
  if (!attribution) return lines;
  for (const [label, key] of [
    ["UTM source", "utm_source"],
    ["UTM medium", "utm_medium"],
    ["UTM campaign", "utm_campaign"],
    ["UTM term", "utm_term"],
    ["UTM content", "utm_content"],
  ] as const) {
    const value = sanitizeFreeText(attribution[key], 180);
    if (value) lines.push(`${label}: ${value}`);
  }

  const clickIds = (
    ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid", "li_fat_id"] as const
  ).filter((key) => sanitizeFreeText(attribution[key], 20));
  if (clickIds.length) lines.push(`Click IDs present: ${clickIds.join(", ")}`);
  return lines;
}

/** Stage label for logging/idempotency: email-only vs full contact. */
export function deliveryStage(input: QuizDeliveryFields): "email" | "contact" {
  if (input.stage === "email") return "email";
  if (input.stage === "complete") return "contact";
  return input.name || input.phone ? "contact" : "email";
}

export type DeliveryTarget = "ghl" | "webhook";

export type DeliverResult =
  | { ok: true; delivered: DeliveryTarget[] }
  | { ok: false; error: string };

/**
 * Pure delivery orchestration — no I/O, no env reads. Given which targets are
 * wanted and async senders that resolve true on success, fans both out in
 * parallel and reduces to a DeliverResult. The real GHL/webhook senders live in
 * deliver.ts (server-only); this stays testable.
 *
 *  - nothing wanted        → { ok:false, error:"integration_not_configured" }
 *  - >=1 target succeeds    → { ok:true, delivered:[...] }
 *  - all wanted targets fail → { ok:false, error:"all_targets_failed" }
 *
 * A webhook failure never blocks GHL: both run via Promise.all and the result is
 * the union of whatever succeeded.
 */
export async function runDelivery(
  want: { wantGhl: boolean; wantWebhook: boolean },
  senders: { ghl: () => Promise<boolean>; webhook: () => Promise<boolean> },
): Promise<DeliverResult> {
  if (!want.wantGhl && !want.wantWebhook) {
    return { ok: false, error: "integration_not_configured" };
  }
  const [ghlOk, hookOk] = await Promise.all([
    want.wantGhl ? senders.ghl() : Promise.resolve(false),
    want.wantWebhook ? senders.webhook() : Promise.resolve(false),
  ]);
  const delivered: DeliveryTarget[] = [];
  if (ghlOk) delivered.push("ghl");
  if (hookOk) delivered.push("webhook");
  if (delivered.length === 0) return { ok: false, error: "all_targets_failed" };
  return { ok: true, delivered };
}

/* --------------------- webhook body + signature --------------------- */

/** Shape posted to QUIZ_WEBHOOK_URL. Free-text fields are sanitized first. */
export interface WebhookPayload {
  email: string;
  name?: string;
  phone?: string;
  why?: string;
  whyQuestion?: string;
  quizId?: string;
  resultKey?: string;
  score?: number;
  answers?: { q: string; a: string }[];
  sourcePage?: string;
  attribution?: unknown;
}

export interface WebhookRequest {
  /** The exact JSON string that is BOTH signed and sent (never re-stringified). */
  body: string;
  headers: Record<string, string>;
}

/**
 * Build the webhook request: sanitize free-text, JSON-stringify the body ONCE,
 * and compute the signature over that exact string. Returns the body string and
 * the headers (Content-Type, optional Authorization, optional X-Quiz-Signature).
 *
 * The signature is `sha256=<hex>` where <hex> is an HMAC-SHA256 of the exact
 * body string, keyed by `secret` (the QUIZ_WEBHOOK_SECRET). Both Authorization
 * and the signature are emitted only when a secret is present — an unsigned,
 * unauthenticated POST is still valid for open webhooks (Zapier catch hooks).
 *
 * Defense-in-depth: free-text fields (name, why, and each answer's q/a text)
 * are passed through `sanitizeFreeText` so HTML / `{{handlebars}}` can't ride
 * the webhook into a downstream renderer — mirroring the GHL note path.
 */
export function buildWebhookRequest(
  payload: WebhookPayload,
  secret?: string,
): WebhookRequest {
  const sanitized: WebhookPayload = {
    email: payload.email,
    name: sanitizeFreeText(payload.name),
    phone: payload.phone,
    why: sanitizeFreeText(payload.why, 2_000),
    whyQuestion: sanitizeFreeText(payload.whyQuestion, 240),
    quizId: payload.quizId,
    resultKey: payload.resultKey,
    score: payload.score,
    answers: payload.answers?.map(({ q, a }) => ({
      q: sanitizeFreeText(q, 500) ?? "",
      a: sanitizeFreeText(a, 500) ?? "",
    })),
    sourcePage: payload.sourcePage,
    attribution: payload.attribution,
  };

  // Stringify ONCE — this exact string is what we sign and what we send.
  const body = JSON.stringify(sanitized);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
    const hex = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    headers["X-Quiz-Signature"] = `sha256=${hex}`;
  }

  return { body, headers };
}

/* --------------------- transient-retry decision --------------------- */

/**
 * Pure retry policy for the GHL path. Retry ONLY transient failures:
 *  - a thrown network/timeout error (AbortError, TypeError, or any Error), or
 *  - a 5xx (and 429) HTTP status.
 * Never retry a 4xx (other than 429) — those are permanent (bad token, 422
 * validation, etc.) and a retry just wastes the request budget.
 *
 * Pass an HTTP status `number`, or an `Error` (or anything thrown) for a
 * network/timeout failure.
 */
export function shouldRetryDelivery(statusOrError: number | unknown): boolean {
  if (typeof statusOrError === "number") {
    return statusOrError === 429 || statusOrError >= 500;
  }
  // Anything thrown (network error, AbortError on timeout, etc.) is transient.
  return true;
}
