import "server-only";
import { GHL_BASE, ghlHeaders, withGHLTimeout } from "./client";
import { normalizePhone } from "@/lib/phone";
import type { AttributionData } from "@/lib/contact-attribution";
import { resolveCustomFieldsById } from "./custom-fields";
import { logError, logWarn } from "@/lib/logging";
import { shouldRetryDelivery } from "@/lib/quiz/deliver-helpers";

/** One transient-failure retry: short backoff before the second (final) try. */
const GHL_RETRY_BACKOFF_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Per-location cache of the contact custom-field map (GHL fieldKey → field id).
 * GHL's /contacts/upsert only honors custom fields by ID — a by-key entry is
 * silently dropped (verified live) — so we look the location's fields up once
 * (GET /locations/{id}/customFields) and reuse for a short TTL. Returns null when
 * the lookup fails (e.g. the PIT lacks `locations/customFields.readonly`); the
 * caller then simply skips custom fields so the lead is never blocked.
 */
const CUSTOM_FIELD_MAP_TTL_MS = 5 * 60_000;
const customFieldMapCache = new Map<string, { map: Map<string, string>; at: number }>();

async function getLocationCustomFieldMap(
  token: string,
  locationId: string
): Promise<Map<string, string> | null> {
  const cached = customFieldMapCache.get(locationId);
  if (cached && Date.now() - cached.at < CUSTOM_FIELD_MAP_TTL_MS) return cached.map;
  try {
    const res = await fetch(
      `${GHL_BASE}/locations/${locationId}/customFields?model=contact`,
      withGHLTimeout({ method: "GET", headers: ghlHeaders(token) })
    );
    if (!res.ok) {
      logWarn("ghl_customfields_lookup_failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      customFields?: Array<{ id?: string; fieldKey?: string }>;
    };
    const map = new Map<string, string>();
    for (const f of data.customFields ?? []) {
      if (f.fieldKey && f.id) map.set(f.fieldKey, f.id);
    }
    customFieldMapCache.set(locationId, { map, at: Date.now() });
    return map;
  } catch (err) {
    logWarn("ghl_customfields_lookup_exception", { errorName: (err as Error).name });
    return null;
  }
}

/**
 * Upsert a contact into GoHighLevel from a website inquiry form.
 *
 * Agency OS ingest is the durable lead backup / portal / email alert path.
 * This helper is the optional GoHighLevel CRM sync the photographer reads in
 * the GHL inbox / mobile app once tokens are configured.
 *
 * Pattern adapted from p2p-react-website's lib/ghl.ts. Slimmed:
 *  - no custom field IDs (those are env-var-driven there; here we just use tags)
 *  - no attribution source nesting (no UTM capture on a photographer site)
 *  - no direct DB write here; Agency OS ingest is handled by submissions-log
 *
 * Idempotent: GHL upserts by email. Re-submission from the same email updates
 * the existing contact (and adds tags), not a duplicate.
 */

export interface UpsertContactInput {
  /** Full name from form. Split on whitespace into first/last for GHL. */
  name: string;
  email: string;
  phone?: string;
  /** Optional category (e.g. "solo" / "couples" / "bridal" for boudoir). Written to notes. */
  sessionType?: string;
  /** Free-form message; written as a contact note (not on the contact itself). */
  message?: string;
  /** Page slug the form was submitted from (e.g. "/seattle-boudoir"). */
  sourcePage?: string;
  /** Visible in the GHL UI as the lead source — defaults to "Website". */
  sourceName?: string;
  /** Additional tags appended to the contact. Capped at 20 total (GHL limit). */
  extraTags?: string[];
  /** Skip the base "web form" tag for non-form routes such as quiz delivery. */
  omitBaseTag?: boolean;
  /**
   * Optional ad-click + UTM attribution. Captured client-side from URL
   * params + cookies (see lib/contact-attribution). Mapped to GHL's
   * `attributionSource` object on the contact.
   */
  attribution?: AttributionData;
}

/**
 * Map our AttributionData to GHL's attributionSource field shape.
 * GHL field naming is camelCase; ours is the URL param name. Skip empty
 * values; only emit fields that have data.
 */
function buildGhlAttributionSource(
  attribution: AttributionData | undefined
): Record<string, string> | null {
  if (!attribution) return null;
  const out: Record<string, string> = {};

  // Click IDs — direct mapping (LinkedIn is the outlier: li_fat_id → liFatId)
  if (attribution.gclid) out.gclid = attribution.gclid;
  if (attribution.gbraid) out.gbraid = attribution.gbraid;
  if (attribution.wbraid) out.wbraid = attribution.wbraid;
  if (attribution.fbclid) out.fbclid = attribution.fbclid;
  if (attribution.ttclid) out.ttclid = attribution.ttclid;
  if (attribution.msclkid) out.msclkid = attribution.msclkid;
  if (attribution.li_fat_id) out.liFatId = attribution.li_fat_id;

  // Meta pixel cookies — live read
  if (attribution.fbp) out.fbp = attribution.fbp;
  if (attribution.fbc) out.fbc = attribution.fbc;

  // UTMs — GHL uses camelCase + a duplicate flat shape (medium, campaign)
  if (attribution.utm_source) out.utmSource = attribution.utm_source;
  if (attribution.utm_medium) {
    out.utmMedium = attribution.utm_medium;
    out.medium = attribution.utm_medium;
  }
  if (attribution.utm_campaign) {
    out.utmCampaign = attribution.utm_campaign;
    out.campaign = attribution.utm_campaign;
  }
  if (attribution.utm_term) out.utmTerm = attribution.utm_term;
  if (attribution.utm_content) out.utmContent = attribution.utm_content;

  // Derive sessionSource — coarse but useful for GHL dashboard filters.
  // Paid = any click ID OR utm_medium contains cpc/paid/ads.
  const hasClickId = Boolean(
    attribution.gclid ||
      attribution.fbclid ||
      attribution.ttclid ||
      attribution.msclkid ||
      attribution.gbraid ||
      attribution.wbraid ||
      attribution.li_fat_id
  );
  const paidMedium = /\b(cpc|ppc|paid|ads?)\b/i.test(
    attribution.utm_medium ?? ""
  );
  if (hasClickId || paidMedium) out.sessionSource = "Paid";
  else if (attribution.utm_medium === "organic") out.sessionSource = "Organic";
  else if (attribution.utm_medium === "referral") out.sessionSource = "Referral";

  return Object.keys(out).length > 0 ? out : null;
}

export type UpsertContactResult =
  | { ok: true; contactId: string }
  | { ok: false; error: string };

export async function upsertContact(
  input: UpsertContactInput
): Promise<UpsertContactResult> {
  const token = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    return { ok: false, error: "integration_not_configured" };
  }

  const trimmed = input.name.trim();
  const [firstName, ...rest] = trimmed.split(/\s+/);
  const lastName = rest.join(" ") || undefined;

  const tags = dedupeTags([
    ...(input.omitBaseTag ? [] : ["web form"]),
    ...(input.extraTags ?? []),
  ]);

  const body: Record<string, unknown> = {
    locationId,
    source: input.sourceName ?? "Website",
    firstName: firstName || trimmed,
    email: input.email,
    tags,
  };
  if (lastName) body.lastName = lastName;
  // Phone is normalized to E.164 at the boundary so GHL doesn't 422 on bare
  // 10-digit US numbers. Original input is preserved when normalization can't
  // confidently coerce (international without prefix, etc.).
  if (input.phone) body.phone = normalizePhone(input.phone);

  // Ad attribution — flatten our typed data into GHL's attributionSource shape.
  // Skipped entirely when no attribution data present (most direct visits).
  const attribSource = buildGhlAttributionSource(input.attribution);
  if (attribSource) body.attributionSource = attribSource;

  // Ad-click IDs as GHL custom fields so `{{contact.fbclid}}`, `{{contact.fbc}}`,
  // … resolve in a workflow's Meta Conversion API / Google Ads conversion step.
  // GHL only honors custom fields BY ID (a by-key entry is silently dropped), so
  // resolve each field's id from the location's field map (cached). gclid is NOT
  // here — it rides attributionSource above (`{{contact.attributionSource.gclid}}`).
  // A field this location hasn't created is skipped; it never blocks the lead.
  const fieldMap = await getLocationCustomFieldMap(token, locationId);
  if (fieldMap) {
    const customFields = resolveCustomFieldsById(input.attribution, fieldMap);
    if (customFields.length > 0) body.customFields = customFields;
  }

  // Two independent, one-shot recovery paths, each with its own budget so one
  // can't starve the other (max 3 POSTs total, each with its own 10s timeout):
  //   • transient — a network/timeout error or 5xx/429 gets one backoff retry.
  //   • custom-field strip — defensive. GHL normally IGNORES custom fields a
  //     location doesn't have (201, not 422), so this rarely fires; but if a
  //     custom-field value ever does 422 the upsert, we drop the custom fields
  //     and retry so the lead itself is never lost. Other 4xx (bad token, real
  //     validation error) stay permanent — never retried.
  let payload = JSON.stringify(body);
  let lastStatus: number | null = null;
  let transientRetried = false;
  let strippedCustomFields = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        `${GHL_BASE}/contacts/upsert`,
        withGHLTimeout({
          method: "POST",
          headers: ghlHeaders(token),
          body: payload,
        })
      );
      if (!res.ok) {
        lastStatus = res.status;
        // Don't log response body — GHL echoes back PII on errors.
        logWarn("ghl_contact_upsert_failed", { status: res.status, attempt });
        if (res.status === 422 && body.customFields && !strippedCustomFields) {
          delete body.customFields;
          payload = JSON.stringify(body);
          strippedCustomFields = true;
          logWarn("ghl_contact_customfields_stripped", { attempt });
          continue;
        }
        if (!transientRetried && shouldRetryDelivery(res.status)) {
          transientRetried = true;
          await sleep(GHL_RETRY_BACKOFF_MS);
          continue;
        }
        return { ok: false, error: `upsert_failed_${res.status}` };
      }
      const data = (await res.json()) as { contact?: { id?: string }; id?: string };
      const contactId = data.contact?.id ?? data.id ?? "unknown";

      if (input.message?.trim()) {
        await addContactNote(token, contactId, formatNote(input));
      }

      return { ok: true, contactId };
    } catch (err) {
      // Network error / timeout (AbortError) — transient, retry once.
      logError("ghl_contact_upsert_exception", {
        errorName: (err as Error).name,
        attempt,
      });
      if (!transientRetried && shouldRetryDelivery(err)) {
        transientRetried = true;
        await sleep(GHL_RETRY_BACKOFF_MS);
        continue;
      }
      return { ok: false, error: "network_error" };
    }
  }
  // Unreachable in practice: the loop returns on every path. Kept for the
  // type-checker and as a defensive fallback if the retry conditions change.
  return { ok: false, error: lastStatus ? `upsert_failed_${lastStatus}` : "network_error" };
}

/**
 * Attach a note to an existing contact. Used to store free-form message text
 * (which doesn't have a native contact field in GHL). Best-effort: a failure
 * here doesn't fail the inquiry — the contact still got created.
 */
async function addContactNote(token: string, contactId: string, body: string): Promise<void> {
  // Defense-in-depth: strip HTML and GHL/Handlebars template syntax so a
  // malicious message can't render as templates in GHL's UI or emails.
  const safeBody = body
    .replace(/<[^>]*>/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .slice(0, 10_000);

  try {
    const res = await fetch(
      `${GHL_BASE}/contacts/${contactId}/notes`,
      withGHLTimeout({
        method: "POST",
        headers: ghlHeaders(token),
        body: JSON.stringify({ body: safeBody }),
      })
    );
    // A non-2xx returns without throwing — without this check the answers note
    // (which carries the quiz answers) would silently fail to attach while the
    // upsert still reports ok, and the leak would be invisible.
    if (!res.ok) {
      logWarn("ghl_note_add_failed", {
        status: res.status,
        contact_id_prefix: contactId.slice(0, 8),
      });
    }
  } catch (err) {
    logWarn("ghl_note_add_failed", {
      contact_id_prefix: contactId.slice(0, 8),
      errorName: (err as Error).name,
    });
  }
}

function formatNote(input: UpsertContactInput): string {
  const lines: string[] = [];
  if (input.sessionType) lines.push(`Session type: ${input.sessionType}`);
  if (input.sourcePage) lines.push(`Source page: ${input.sourcePage}`);
  if (input.message) {
    if (lines.length) lines.push("");
    lines.push("Message:");
    lines.push(input.message);
  }
  return lines.join("\n");
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const clean = t.trim().replace(/[\x00-\x1F]/g, "").slice(0, 80);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= 20) break;
  }
  return out;
}
