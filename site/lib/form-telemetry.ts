import "server-only";

import { logInfo, logWarn } from "@/lib/logging";

/**
 * PII-free telemetry for every form submission path.
 *
 * The problem this solves: before this module, the ONLY record of a submission
 * was the row written after it already succeeded. A submission that was
 * honeypotted, rate-limited, failed validation, failed reCAPTCHA, or was
 * rejected by GoHighLevel produced no row and no event — so "nobody submitted"
 * and "everybody submitted and every one failed" looked identical from the
 * outside. That is not a state a lead-generation business can be in.
 *
 * Every stage of the pipeline now emits one event. Events go to the site's
 * own structured server logs (lib/logging's JSON emit), which means they are
 * queryable in Vercel runtime logs per deployment with a stable
 * `form_event.*` prefix — no database migration, no new endpoint, and nothing
 * that can fail the visitor's submission.
 *
 * WHAT IS NEVER LOGGED: a name, an email, a phone number, a message, or any
 * form value. Validation failures carry the FIELD NAMES that failed, never the
 * values that failed them. The meta type is the enforcement — lib/logging's
 * SafeMeta only accepts primitives, and every field below is a short machine
 * token chosen by this codebase, not visitor input. The one visitor-derived
 * value is `sourcePage`, which is a path on the site's own marketing pages.
 */

export type FormEvent =
  /** A submit actually reached the server. The denominator for every ratio. */
  | "submit_attempt"
  /** Shared IP bucket exhausted. */
  | "rate_limited"
  /** Hidden field filled — a bot. Silently succeeds for the bot; loud here. */
  | "honeypot_blocked"
  /** Schema rejected the submission. Carries field names only. */
  | "validation_failed"
  /** reCAPTCHA rejected the submission (sites that verify it). */
  | "recaptcha_failed"
  /** GoHighLevel did not accept the contact. The lead still survives if the log leg did. */
  | "crm_failed"
  /** The durable Agency OS log did not accept the submission. */
  | "ingest_failed"
  /** At least one leg accepted the lead — the visitor sees success. */
  | "accepted"
  /** BOTH legs failed. The visitor is told to try again; the lead is lost. */
  | "rejected";

export type FormEventMeta = {
  /** Which form/action emitted this — e.g. "inquiry", "quiz", "dogs-application". */
  form: string;
  /** Path the form was submitted from. A site route, never visitor free text. */
  sourcePage?: string;
  /** Comma-joined FIELD NAMES that failed validation. Never values. */
  fields?: string;
  /** Short machine error code from the CRM leg. */
  crm?: string;
  /** Short machine error code from the durable log leg. */
  ingest?: string;
  /** Seconds a rate-limited visitor must wait. */
  retryAfter?: number;
};

/** Events that mean something is wrong and should stand out in the logs. */
const WARN_EVENTS: ReadonlySet<FormEvent> = new Set<FormEvent>([
  "rate_limited",
  "validation_failed",
  "recaptcha_failed",
  "crm_failed",
  "ingest_failed",
  "rejected",
]);

/**
 * Record one pipeline stage. Never throws: telemetry must not be able to fail
 * a submission, so every failure here is swallowed. Fire-and-forget by design
 * — callers do not await a result because there is nothing to wait for.
 */
export function logFormEvent(event: FormEvent, meta: FormEventMeta): void {
  try {
    const name = `form_event.${event}`;
    if (WARN_EVENTS.has(event)) logWarn(name, meta);
    else logInfo(name, meta);
  } catch {
    // A logger that throws must never cost a lead.
  }
}
