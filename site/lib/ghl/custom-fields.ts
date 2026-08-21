/**
 * Ad-click identifiers we mirror onto a GHL contact as *custom fields*.
 *
 * This is deliberately separate from the `attributionSource` object in
 * ./contacts. That object feeds GHL's native attribution UI, but a workflow's
 * Conversions API action (Meta Conversion API / Google Ads conversion) reads a
 * merge tag like `{{contact.fbclid}}`, and that tag only resolves against a real
 * custom field.
 *
 * ADDRESSED BY FIELD ID. Verified live: GHL's /contacts/upsert (Version
 * 2021-07-28) SILENTLY DROPS a custom field sent by key — `{ key: "contact.fbclid",
 * field_value }` is accepted (201) but never populates. Only an id-based entry
 * `{ id, value }` sticks. Agency OS is multi-tenant (every client site is its own
 * GHL location with different field ids), so we do NOT hardcode ids — ./contacts
 * looks the location's fields up at upsert time (GET /locations/{id}/customFields
 * → fieldKey→id map, cached) and this module resolves each attr's `contact.<name>`
 * key to that id. A field the location hasn't created is simply skipped.
 *
 * Pure + side-effect-free (no `server-only`, no `@/` alias, no network) so it is
 * unit testable under node:test, mirroring lib/quiz/deliver-helpers.
 */
import type { AttributionData } from "../contact-attribution";

/**
 * Captured attribution key → the GHL contact **fieldKey** (`contact.<name>`),
 * i.e. what GET /locations/{id}/customFields returns and what the `{{contact.<name>}}`
 * merge tag resolves against. We look this key up in the location's field list to
 * get the id we actually send. Matches the Photography-to-Profits field set.
 *
 * gclid is intentionally ABSENT: `contact.gclid` is a GHL read-only STANDARD
 * field (not custom-writable), so gclid rides on the native attribution object we
 * already send — reference it as `{{contact.attributionSource.gclid}}`.
 */
export const ATTRIBUTION_CUSTOM_FIELD_KEYS = {
  fbclid: "contact.fbclid", // Meta   → {{contact.fbclid}} (Meta Conversion API step)
  gbraid: "contact.gbraid", // Google enhanced (iOS web)
  wbraid: "contact.wbraid", // Google enhanced (other)
  ttclid: "contact.ttclid", // TikTok
  msclkid: "contact.msclkid", // Microsoft / Bing
  li_fat_id: "contact.li_fat_id", // LinkedIn
  fbc: "contact.fbc", // Meta _fbc cookie (boosts CAPI match quality)
  fbp: "contact.fbp", // Meta _fbp cookie (boosts CAPI match quality)
} as const satisfies Partial<Record<keyof AttributionData, string>>;

export type CustomFieldAttr = keyof typeof ATTRIBUTION_CUSTOM_FIELD_KEYS;

export const ALL_CUSTOM_FIELD_ATTRS = Object.keys(
  ATTRIBUTION_CUSTOM_FIELD_KEYS
) as CustomFieldAttr[];

/**
 * On-by-default set: every mapped click ID + Meta cookie (the full P2P set).
 * Create them per sub-account with `npm run ghl:attribution-fields -- --apply`.
 * A field a location hasn't created is skipped at resolve time (its fieldKey
 * won't be in the location's field map), so a partial or not-yet-created rollout
 * degrades gracefully — the lead still saves and the fields that DO exist still
 * populate. Narrow per-location via GHL_ATTRIBUTION_CUSTOM_FIELDS if you want to
 * send fewer. gclid is NOT here — see the mapping note above.
 */
export const DEFAULT_CUSTOM_FIELD_ATTRS: CustomFieldAttr[] = [...ALL_CUSTOM_FIELD_ATTRS];

/** One id-based `customFields` entry in GHL's contact upsert body. */
export interface GhlCustomFieldById {
  id: string;
  value: string;
}

/**
 * Which captured identifiers to send as custom fields, from
 * `GHL_ATTRIBUTION_CUSTOM_FIELDS`:
 *   - unset            → send every mapped field (the full P2P set)
 *   - "" / none / off  → send none (disable on a location that doesn't use it)
 *   - "fbclid,fbc,fbp" → send exactly that subset
 * Sending a field a location doesn't have is harmless — it's skipped at resolve
 * time. Unknown names here are also ignored. Read per call so tests stay hot.
 */
export function enabledCustomFieldAttrs(): Set<CustomFieldAttr> {
  const raw = process.env.GHL_ATTRIBUTION_CUSTOM_FIELDS;
  if (raw === undefined) return new Set(DEFAULT_CUSTOM_FIELD_ATTRS);
  const trimmed = raw.trim().toLowerCase();
  if (["", "none", "off", "false"].includes(trimmed)) return new Set();
  const requested = new Set(
    trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return new Set(ALL_CUSTOM_FIELD_ATTRS.filter((attr) => requested.has(attr)));
}

/**
 * Resolve captured attribution to GHL's id-based `customFields` upsert shape:
 * `[{ id, value }]`. `fieldKeyToId` maps a location's `contact.<name>` fieldKey to
 * its custom-field id (built by ./contacts from GET /locations/{id}/customFields).
 * Only enabled attrs that were captured AND exist in this location are emitted —
 * a missing field is skipped so it never blocks the lead. Values are already
 * sanitized + length-capped by lib/contact-attribution.
 */
export function resolveCustomFieldsById(
  attribution: AttributionData | undefined,
  fieldKeyToId: Map<string, string>
): GhlCustomFieldById[] {
  if (!attribution) return [];
  const enabled = enabledCustomFieldAttrs();
  if (enabled.size === 0) return [];
  const out: GhlCustomFieldById[] = [];
  for (const attr of ALL_CUSTOM_FIELD_ATTRS) {
    if (!enabled.has(attr)) continue;
    const value = attribution[attr];
    if (!value) continue;
    const id = fieldKeyToId.get(ATTRIBUTION_CUSTOM_FIELD_KEYS[attr]);
    if (!id) continue; // field not created in this location → skip, don't block the lead
    out.push({ id, value });
  }
  return out;
}
