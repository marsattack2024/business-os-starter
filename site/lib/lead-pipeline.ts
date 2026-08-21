import "server-only";

import { headers, cookies } from "next/headers";

import {
  attributionFromCookies,
  attributionFromFormData,
  mergeAttribution,
} from "@/lib/contact-attribution";
import { logFormEvent, type FormEvent } from "@/lib/form-telemetry";
import { upsertContact } from "@/lib/ghl/contacts";
import { getClientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { sanitizeFreeText } from "@/lib/sanitize";
import { logSubmission } from "@/lib/submissions-log";

/**
 * The ONE lead pipeline every form on every site runs through.
 *
 * Before this module each site carried its own fork of the submit action, and
 * the forks had silently drifted apart: some had lost the durable Agency OS
 * backup leg entirely (a GHL outage there meant the lead simply vanished),
 * every one of them had missed the cookie-attribution fallback the template
 * added after hidden-field hydration was observed failing inside a <form>, and
 * none of them emitted telemetry. Eight copies of the most important function
 * in the business is eight chances to lose a lead quietly.
 *
 * This file is intentionally IDENTICAL across the template and every site, so
 * a fix lands everywhere at once and the drift guard can hold it that way.
 * Everything genuinely site-specific — which schema validates the form, what
 * CRM tags the campaign needs, where a successful submit redirects, whether
 * reCAPTCHA runs first — is passed IN by the site's own thin server action.
 *
 * The delivery contract, unchanged from the template that proved it:
 *   - TWO legs. GoHighLevel is a best-effort sync; the Agency OS ingest row is
 *     the durable source of truth. The submission fails ONLY if BOTH fail.
 *   - Honeypot returns silent success so bots do not retry.
 *   - Rate limit shares one bucket with the REST endpoint, so an IP cannot get
 *     double the allowance by mixing the form and curl.
 *   - The caller redirects only on an accepted result, so a direct visit to a
 *     thank-you page never counts as a lead.
 *
 * Every stage emits a PII-free telemetry event (see lib/form-telemetry.ts), so
 * a form that is failing is visible in the logs instead of looking identical to
 * a form nobody used.
 */

/**
 * The contact fields every lead form must produce. GoHighLevel cannot create a
 * contact without a name and an email, so the pipeline requires them at the
 * type level rather than discovering the gap at runtime.
 */
export type LeadContactFields = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
};

/** Structural shape of a Zod-style validator — avoids importing zod here. */
type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = {
  success: false;
  error: { flatten(): { fieldErrors: Record<string, string[] | undefined> } };
};
export type LeadSchema<T> = { safeParse(raw: unknown): ParseSuccess<T> | ParseFailure };

export type LeadGateResult = { ok: true } | { ok: false; reason?: string };

/**
 * An extra check that runs AFTER validation and BEFORE delivery — reCAPTCHA on
 * the sites that verify it.
 *
 * The ordering is deliberate: a refused submission is only worth preserving if
 * it already looks like a real person, and validation is the check that decides
 * that. Bots are gone by then — the rate limit and the honeypot returned long
 * before, and the schema just rejected anything malformed.
 *
 * `onRefusal` encodes a REAL policy difference between sites, not drift:
 *   - "preserve" writes the well-formed lead with synced:false so it is visibly
 *     not a CRM lead but is still a record that someone tried. Mayberry chose
 *     this after a campaign page shipped without a token field and refused
 *     leads with no trace, leaving no way to answer "how many did we lose".
 *   - "discard" keeps refused traffic out of the accepted-lead ledger entirely
 *     and records only non-PII diagnostics. Kelli chose this so the ingest table
 *     stays a clean ledger of accepted leads.
 * Either way the refusal is now a logged telemetry event rather than silence.
 */
export type LeadGate<T> = {
  run(input: {
    data: T;
    raw: Record<string, FormDataEntryValue>;
    ip: string;
    sourcePage: string | undefined;
  }): Promise<LeadGateResult>;
  /** Telemetry event emitted when the gate refuses. */
  event: FormEvent;
  /** Visitor-facing message for a refusal. */
  message: string;
  onRefusal: "preserve" | "discard";
  /** sourceAgent recorded on a preserved refusal row. */
  preservedSourceAgent?: string;
  /** Recorded on the preserved row's payload as `rejectedBy`. */
  rejectedBy?: string;
};

export type LeadPipelineInput<T> = {
  formData: FormData;
  /** Validates the raw form entries. Site-specific: inquiry, application, etc. */
  schema: LeadSchema<T>;
  /** Telemetry + ingest label for this form — e.g. "inquiry". */
  form: string;
  /** Recorded on the ingest row. Defaults to "website-form". */
  sourceAgent?: string;
  /**
   * Shared rate-limit namespace. Defaults to "inquiry" so the server action and
   * the REST endpoint keep counting against the same bucket.
   */
  rateLimitKey?: string;
  /** Submissions allowed per minute per IP. Defaults to 5. */
  rateLimitMax?: number;
  /** Campaign/source tags for the CRM contact, derived by the calling site. */
  extraTags?: string[];
  /** Drop the default "web form" tag when a campaign owns its own tagging. */
  omitBaseTag?: boolean;
  /** Optional post-validation check (reCAPTCHA). See LeadGate. */
  gate?: LeadGate<T>;
};

export type LeadPipelineResult<T> =
  | { status: "rate_limited"; retryAfter: number }
  | { status: "honeypot" }
  | { status: "invalid"; errors: Record<string, string[]> }
  | { status: "gated"; message: string }
  | { status: "rejected" }
  | {
      status: "accepted";
      data: T;
      sourcePage: string | undefined;
      leadEventId: unknown;
      crmOk: boolean;
      logOk: boolean;
    };

/**
 * Run one submission end to end. Never throws — every outcome is a value the
 * caller turns into a form state or a redirect.
 */
export async function runLeadPipeline<T extends LeadContactFields>(
  input: LeadPipelineInput<T>
): Promise<LeadPipelineResult<T>> {
  const {
    formData,
    schema,
    form,
    sourceAgent = "website-form",
    rateLimitKey = "inquiry",
    rateLimitMax = 5,
    extraTags,
    omitBaseTag,
    gate,
  } = input;

  const raw = Object.fromEntries(formData.entries());
  const sourcePage = sanitizeFreeText(raw.sourcePage);

  logFormEvent("submit_attempt", { form, sourcePage });

  // Rate limit BEFORE anything else, and count the honeypot against the same
  // bucket, so spam cannot bypass the cap by tripping the trap.
  const hdrs = await headers();
  const ip = getClientIpFromHeaders(hdrs);
  const limit = rateLimit(`${rateLimitKey}:${ip}`, { max: rateLimitMax, windowMs: 60_000 });
  if (!limit.ok) {
    logFormEvent("rate_limited", { form, sourcePage, retryAfter: limit.retryAfter });
    return { status: "rate_limited", retryAfter: limit.retryAfter };
  }

  // Honeypot: real users never fill the visually-hidden `hp` field.
  if (typeof raw.hp === "string" && raw.hp.length > 0) {
    logFormEvent("honeypot_blocked", { form, sourcePage });
    return { status: "honeypot" };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0) errors[field] = messages;
    }
    // FIELD NAMES only — never the values that failed.
    logFormEvent("validation_failed", {
      form,
      sourcePage,
      fields: Object.keys(errors).sort().join(",") || "unknown",
    });
    return { status: "invalid", errors };
  }

  if (gate) {
    const verdict = await gate.run({ data: parsed.data, raw, ip, sourcePage });
    if (!verdict.ok) {
      if (gate.onRefusal === "preserve") {
        // A refusal is a decision about DELIVERY, not a reason to destroy
        // evidence. synced:false marks it as visibly not a CRM lead.
        await logSubmission({
          source: "inquiry",
          synced: false,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
          sourcePage,
          sourceAgent: gate.preservedSourceAgent ?? "website-form-rejected",
          payload: {
            ...parsed.data,
            rejectedBy: gate.rejectedBy ?? "gate",
            rejectedReason: verdict.reason ?? null,
          },
        }).catch(() => undefined);
      }
      logFormEvent(gate.event, { form, sourcePage, crm: verdict.reason ?? "refused" });
      return { status: "gated", message: gate.message };
    }
  }

  // Ad-click + UTM attribution from the hidden fields <AttributionFields />
  // populates, merged with the first-party cookies <AttributionTracker />
  // writes in the root layout. formData wins per key when both are present;
  // the cookie read is the reliability layer for when a <form> subtree's
  // client hydration never populated the hidden fields (this repo has had that
  // happen — effects inside a <form> can fail to fire), since the cookies ride
  // the POST either way. Falls through cleanly for a visitor who arrived with
  // no tracked params at all, which is most direct traffic.
  const cookieStore = await cookies();
  const attribution = mergeAttribution(
    attributionFromFormData(formData),
    attributionFromCookies(cookieStore)
  );

  const crmResult = await upsertContact({
    ...parsed.data,
    sourcePage,
    sourceName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Website",
    attribution,
    ...(extraTags && extraTags.length > 0 ? { extraTags } : {}),
    ...(omitBaseTag ? { omitBaseTag: true } : {}),
  });

  if (!crmResult.ok) {
    logFormEvent("crm_failed", { form, sourcePage, crm: crmResult.error });
  }

  const data = parsed.data;

  const logResult = await logSubmission({
    source: "inquiry",
    synced: crmResult.ok,
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    sourcePage,
    sourceAgent,
    attribution: attribution as Record<string, unknown>,
    payload: parsed.data,
  }).catch(() => ({ ok: false as const, error: "network_error" as const }));

  if (!logResult.ok) {
    logFormEvent("ingest_failed", { form, sourcePage, ingest: logResult.error });
  }

  // A lead is lost only when BOTH legs refused it.
  if (!crmResult.ok && !logResult.ok) {
    logFormEvent("rejected", {
      form,
      sourcePage,
      crm: crmResult.error,
      ingest: logResult.error,
    });
    return { status: "rejected" };
  }

  logFormEvent("accepted", {
    form,
    sourcePage,
    crm: crmResult.ok ? "ok" : crmResult.error,
    ingest: logResult.ok ? "ok" : logResult.error,
  });

  return {
    status: "accepted",
    data: parsed.data,
    sourcePage,
    leadEventId: raw.leadEventId,
    crmOk: crmResult.ok,
    logOk: logResult.ok,
  };
}

/** The visitor-facing message for a submission both legs refused. */
export const LEAD_REJECTED_MESSAGE =
  "Submission failed. Please try again, or call/text directly.";

/** The visitor-facing message for a rate-limited submission. */
export function rateLimitedMessage(retryAfter: number): string {
  return `Too many submissions. Please try again in ${retryAfter} seconds.`;
}
