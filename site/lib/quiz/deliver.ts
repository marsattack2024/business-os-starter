// lib/quiz/deliver.ts
// Server-only quiz-lead delivery. The email-only stage is kept out of GHL so
// SMS workflows only see the final contact upsert with phone/name attached.
// Quiz answers/final context are stored as a contact note, not exploded into CRM tags.
import "server-only";
import { upsertContact } from "@/lib/ghl/contacts";
import { GHL_BASE, ghlHeaders, withGHLTimeout } from "@/lib/ghl/client";
import type { AttributionData } from "@/lib/contact-attribution";
import { logInfo, logWarn, logError } from "@/lib/logging";
import {
  selectTargets,
  buildQuizTags,
  answersToNote,
  deliveryStage,
  wantGhlForStage,
  tagsToRemoveForStage,
  runDelivery,
  buildWebhookRequest,
  type DeliveryPolicy,
  type DeliverResult,
} from "./deliver-helpers";

const WEBHOOK_TIMEOUT_MS = 10_000;

export interface QuizLeadDelivery {
  stage?: "email" | "complete";
  email: string;
  name?: string;
  phone?: string;
  why?: string;
  whyQuestion?: string;
  quizId?: string;
  /** Opaque per-session correlation id (no PII) for end-to-end log tracing. */
  sessionId?: string;
  resultKey?: string;
  score?: number;
  answers?: { q: string; a: string }[];
  sourcePage?: string;
  sourceName?: string;
  sourceAgent?: string;
  attribution?: AttributionData;
  deliveryPolicy?: DeliveryPolicy;
}

export type { DeliverResult };

async function deliverToGhl(input: QuizLeadDelivery, stage: "email" | "contact"): Promise<boolean> {
  // upsertContact self-guards on GHL_PIT_TOKEN + GHL_LOCATION_ID.
  const res = await upsertContact({
    name: input.name?.trim() || input.email,
    email: input.email,
    phone: input.phone,
    message: answersToNote(input),
    sourcePage: input.sourcePage,
    sourceName: input.sourceName ?? "Quiz",
    // Stage-based tags: a completion keeps the `quiz` tag (unchanged); a partial
    // gets `quiz-abandoned` (and NOT `quiz`) so it stays out of booked-lead flows.
    extraTags: buildQuizTags(stage),
    omitBaseTag: true,
    attribution: input.attribution,
  });
  if (!res.ok) {
    logWarn("quiz_ghl_delivery_failed", { error: res.error, quiz_id: input.quizId, session_id: input.sessionId, stage });
    return false;
  }
  // A finisher who first hit the email stage carries `quiz-abandoned`; since GHL
  // upserts MERGE tags, that tag must be removed explicitly on completion so the
  // contact isn't left double-tagged. Best-effort — never fails the delivered lead.
  const tagsToRemove = tagsToRemoveForStage(stage, input.deliveryPolicy);
  if (tagsToRemove.length > 0 && res.contactId && res.contactId !== "unknown") {
    await removeGhlContactTags(res.contactId, tagsToRemove, input);
  }
  return true;
}

/**
 * Remove tags from a GHL contact (DELETE /contacts/{id}/tags, body { tags }).
 * Used to shed `quiz-abandoned` once a partial quiz is completed. Best-effort:
 * a failure never fails the lead — the completion tag is already applied.
 */
async function removeGhlContactTags(
  contactId: string,
  tags: string[],
  input: QuizLeadDelivery,
): Promise<void> {
  const token = process.env.GHL_PIT_TOKEN;
  if (!token) return;
  try {
    const res = await fetch(
      `${GHL_BASE}/contacts/${contactId}/tags`,
      withGHLTimeout({
        method: "DELETE",
        headers: ghlHeaders(token),
        body: JSON.stringify({ tags }),
      }),
    );
    if (!res.ok) {
      logWarn("quiz_ghl_tag_remove_failed", {
        status: res.status,
        quiz_id: input.quizId,
        session_id: input.sessionId,
      });
    }
  } catch (err) {
    logError("quiz_ghl_tag_remove_exception", {
      errorName: (err as Error).name,
      quiz_id: input.quizId,
      session_id: input.sessionId,
    });
  }
}

async function deliverToWebhook(input: QuizLeadDelivery): Promise<boolean> {
  const url = process.env.QUIZ_WEBHOOK_URL;
  if (!url) return false;
  // Build the body string + headers ONCE: the exact body string is both signed
  // (X-Quiz-Signature) and sent, so the receiver can verify integrity. Free-text
  // is sanitized inside the builder (defense-in-depth, mirrors the GHL note).
  const { body, headers } = buildWebhookRequest(
    {
      email: input.email,
      name: input.name,
      phone: input.phone,
      why: input.why,
      whyQuestion: input.whyQuestion,
      quizId: input.quizId,
      resultKey: input.resultKey,
      score: input.score,
      answers: input.answers,
      sourcePage: input.sourcePage,
      attribution: input.attribution,
    },
    process.env.QUIZ_WEBHOOK_SECRET,
  );
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) {
      logWarn("quiz_webhook_failed", { status: res.status, quiz_id: input.quizId, session_id: input.sessionId });
      return false;
    }
    return true;
  } catch (err) {
    logError("quiz_webhook_exception", { errorName: (err as Error).name });
    return false;
  }
}

export async function deliverQuizLead(input: QuizLeadDelivery): Promise<DeliverResult> {
  const stage = deliveryStage(input);
  const { wantGhl: configuredGhl, wantWebhook } = selectTargets(
    {
      ghlToken: process.env.GHL_PIT_TOKEN,
      ghlLocation: process.env.GHL_LOCATION_ID,
      webhookUrl: process.env.QUIZ_WEBHOOK_URL,
    },
    input.deliveryPolicy,
  );
  // GHL always receives a completed contact. It receives the email-only
  // (partial/abandoned) stage ONLY when the site opts in via delivery.partials —
  // tagged `quiz-abandoned` so an abandoner workflow can nudge without touching
  // the booked-lead automations.
  const wantGhl = wantGhlForStage(stage, configuredGhl, input.deliveryPolicy);
  // Fire both; one success is enough. A webhook failure never blocks GHL.
  const result = await runDelivery(
    { wantGhl, wantWebhook },
    { ghl: () => deliverToGhl(input, stage), webhook: () => deliverToWebhook(input) },
  );

  if (result.ok) {
    logInfo("quiz_lead_delivered", {
      targets: result.delivered.join(","),
      quiz_id: input.quizId,
      session_id: input.sessionId,
      stage,
    });
  }
  return result;
}
