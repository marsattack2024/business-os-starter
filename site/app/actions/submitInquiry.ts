// app/actions/submitInquiry.ts
"use server";
import { redirect } from "next/navigation";

import {
  LEAD_REJECTED_MESSAGE,
  rateLimitedMessage,
  runLeadPipeline,
} from "@/lib/lead-pipeline";
import { confirmedLeadRedirect } from "@/lib/tracking/lead-redirect";
import { InquirySchema } from "@/lib/validators";

/**
 * The site's inquiry form action.
 *
 * Everything shared — rate limit, honeypot, validation, attribution merge,
 * the GoHighLevel sync, the durable Agency OS log, and the PII-free telemetry
 * around all of it — lives in lib/lead-pipeline.ts, identical on every site.
 * This file holds only what is genuinely this site's: which schema validates
 * the form and where an accepted lead lands.
 */

export type SubmitInquiryState =
  | { success: true }
  | { success: false; errors: Record<string, string[]> };

export async function submitInquiry(
  _prevState: SubmitInquiryState,
  formData: FormData
): Promise<SubmitInquiryState> {
  const result = await runLeadPipeline({
    formData,
    schema: InquirySchema,
    form: "inquiry",
  });

  switch (result.status) {
    case "rate_limited":
      return { success: false, errors: { root: [rateLimitedMessage(result.retryAfter)] } };
    // A bot filled the honeypot: silent success so it does not retry.
    case "honeypot":
      return { success: true };
    case "invalid":
      return { success: false, errors: result.errors };
    // No gate is configured on this site today; handled so the switch stays
    // exhaustive if one is added.
    case "gated":
      return { success: false, errors: { root: [result.message] } };
    case "rejected":
      return { success: false, errors: { root: [LEAD_REJECTED_MESSAGE] } };
    case "accepted":
      // Redirect only after CRM or the Agency OS backup accepted the lead, so
      // a direct thank-you visit still does not count.
      redirect(confirmedLeadRedirect(result.sourcePage, result.leadEventId));
  }
}
