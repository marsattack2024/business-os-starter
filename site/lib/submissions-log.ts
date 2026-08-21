import "server-only";

import { logWarn } from "@/lib/logging";

/**
 * Post every accepted submission to the agency source-of-truth.
 *
 * Agency OS ingest is the durable backup + client portal + email alert path.
 * GoHighLevel remains optional CRM sync; call paths can use an ok response here
 * as lead acceptance when GHL is not configured yet.
 *
 * Hard rules:
 * - It must never throw. Callers decide whether a failed backup plus failed CRM
 *   should fail the submission.
 * - It is env-gated: if either SUBMISSIONS_INGEST_URL or SUBMISSIONS_INGEST_TOKEN
 *   is missing, this returns not_configured without logging.
 * - It NEVER logs PII (no email/name/phone in the warn payload).
 */

export type SubmissionLogInput = {
  source: "inquiry" | "quiz";
  /** Whether this lead was actually accepted by the CRM delivery path. */
  synced?: boolean;
  stage?: "email" | "complete";
  sessionId?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  quizId?: string;
  score?: number;
  sourcePage?: string;
  sourceAgent?: string;
  payload?: Record<string, unknown>;
  attribution?: Record<string, unknown> | undefined;
};

export type SubmissionLogResult =
  | { ok: true }
  | { ok: false; error: "not_configured" | "request_failed" | "network_error" };

export async function logSubmission(input: SubmissionLogInput): Promise<SubmissionLogResult> {
  const url = process.env.SUBMISSIONS_INGEST_URL;
  const token = process.env.SUBMISSIONS_INGEST_TOKEN;
  // Un-provisioned sites stay silent — no URL/token, no-op.
  if (!url || !token) return { ok: false, error: "not_configured" };

  let res: Response | undefined;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      // Bounded so a slow/unreachable ingest never hangs the submit (it is
      // awaited by submit paths); a DB insert is fast, so 4s is generous.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      // No PII — just status + source for greppability.
      logWarn("submission_log_failed", { status: res.status, source: input.source });
      return { ok: false, error: "request_failed" };
    }
    return { ok: true };
  } catch {
    logWarn("submission_log_failed", { status: res?.status, source: input.source });
    return { ok: false, error: "network_error" };
  }
}
