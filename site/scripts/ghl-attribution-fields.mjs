#!/usr/bin/env node
/**
 * Create the ad-click custom fields in a GoHighLevel sub-account so the merge
 * tags `{{contact.fbclid}}`, `{{contact.gclid}}`, `{{contact.gbraid}}`,
 * `{{contact.wbraid}}` resolve in a workflow's Meta Conversion API / Google Ads
 * conversion step. This is the manual "Settings → Custom Fields" step, automated.
 *
 * Idempotent: lists existing contact fields first and skips ones already there.
 * DRY-RUN by default — prints what it WOULD create. Pass --apply to write.
 *
 * The field set must match what the site actually sends
 * (lib/ghl/custom-fields.ts / GHL_ATTRIBUTION_CUSTOM_FIELDS) — default is the
 * four Meta+Google click IDs. gclid is a custom field on purpose: GHL's native
 * {{contact.lastAttributionSource.gclid}} is read-only and stays empty for
 * API-created leads.
 *
 *   node scripts/ghl-attribution-fields.mjs                 # dry run (default 4 fields)
 *   node scripts/ghl-attribution-fields.mjs --apply         # create the missing ones
 *   node scripts/ghl-attribution-fields.mjs --apply --fields fbclid,gclid,gbraid,wbraid,fbc,fbp
 *   node scripts/ghl-attribution-fields.mjs --apply --token <PIT> --location <LOC_ID>
 *
 * Creds resolve from (in order): --token/--location flags, GHL_PIT_TOKEN /
 * GHL_LOCATION_ID env, or a .env.local in the current dir. The PIT needs the
 * `locations/customFields.write` (+ `.read`) scope — the contact-upsert token
 * may not have it; if you get 401/403, regenerate the PIT with that scope.
 */

import { readFileSync } from "node:fs";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
// The full Photography-to-Profits custom-field set. MUST stay in sync with
// ATTRIBUTION_CUSTOM_FIELD_KEYS in lib/ghl/custom-fields.ts. gclid is NOT here:
// contact.gclid is a GHL read-only STANDARD field, so gclid rides the native
// {{contact.attributionSource.gclid}} tag instead of a custom field. (If you
// pass gclid via --fields anyway, GHL returns a standard-field 400 and the
// script reports it rather than aborting.)
const DEFAULT_FIELDS = [
  "fbclid",
  "fbc",
  "fbp",
  "gbraid",
  "wbraid",
  "ttclid",
  "msclkid",
  "li_fat_id",
];
const ghlName = (attr) => attr; // field name == attr for every custom field

/* ── args ── */
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const val = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const APPLY = has("--apply");

/* ── config: flags → env → .env.local ── */
function fromEnvLocal(key) {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const m = txt.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, "m"));
    if (!m) return undefined;
    return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}
const token = val("--token") || process.env.GHL_PIT_TOKEN || fromEnvLocal("GHL_PIT_TOKEN");
const locationId = val("--location") || process.env.GHL_LOCATION_ID || fromEnvLocal("GHL_LOCATION_ID");

const fieldsArg = val("--fields") || process.env.GHL_ATTRIBUTION_CUSTOM_FIELDS;
const fields =
  fieldsArg && !["", "none", "off", "false"].includes(fieldsArg.trim().toLowerCase())
    ? fieldsArg.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_FIELDS;

if (!token || !locationId) {
  console.error(
    "Missing creds. Set GHL_PIT_TOKEN + GHL_LOCATION_ID (env, .env.local, or --token/--location).\n" +
      "The PIT must have the `locations/customFields.write` scope."
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Version: GHL_VERSION,
  Accept: "application/json",
  "Content-Type": "application/json",
};

/* ── helpers ── */
async function listExisting() {
  const res = await fetch(`${GHL_BASE}/locations/${locationId}/customFields?model=contact`, {
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    fail(res.status, body, "list custom fields");
  }
  const data = await res.json();
  const list = data.customFields || data.customField || (Array.isArray(data) ? data : []);
  // Index by both fieldKey (contact.fbclid) and bare name (fbclid), case-insensitive.
  const byKey = new Map();
  for (const f of list) {
    if (f.fieldKey) byKey.set(String(f.fieldKey).toLowerCase(), f);
    if (f.name) byKey.set(`name:${String(f.name).toLowerCase()}`, f);
  }
  return byKey;
}

async function createField(name) {
  const res = await fetch(`${GHL_BASE}/locations/${locationId}/customFields`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, model: "contact", dataType: "TEXT" }),
  });
  const body = await res.text().catch(() => "");
  let parsed = {};
  try {
    parsed = JSON.parse(body).customField ?? JSON.parse(body);
  } catch {
    /* keep {} */
  }
  return { ok: res.ok, status: res.status, body, parsed };
}

function fail(status, body, what) {
  let hint = "";
  if (status === 401 || status === 403) {
    hint =
      "\n→ The PIT is missing the `locations/customFields.write` scope. Regenerate it " +
      "(GHL → Settings → Private Integrations) with that scope and retry.";
  }
  console.error(`\n✗ GHL ${what} failed (HTTP ${status}). ${String(body).slice(0, 400)}${hint}`);
  process.exit(1);
}

/* ── run ── */
console.log(
  `GHL attribution fields — location ${locationId.slice(0, 6)}… — ${APPLY ? "APPLY" : "DRY RUN"}`
);
console.log(`Target fields: ${fields.join(", ")}\n`);

const existing = await listExisting();
const results = [];

for (const attr of fields) {
  const gname = ghlName(attr); // gclid → google_click_id, others unchanged
  const expectedKey = `contact.${gname}`;
  const hit =
    existing.get(expectedKey.toLowerCase()) || existing.get(`name:${gname.toLowerCase()}`);
  if (hit) {
    results.push({ name: attr, status: "exists", key: hit.fieldKey || expectedKey });
    continue;
  }
  if (!APPLY) {
    results.push({ name: attr, status: "would create", key: expectedKey });
    continue;
  }
  const created = await createField(gname);
  if (created.ok) {
    results.push({ name: attr, status: "created", key: created.parsed.fieldKey || expectedKey });
  } else if (created.status === 400 && /standard field/i.test(created.body)) {
    // GHL already ships a read-only STANDARD field with this key — it can't be a
    // custom field and isn't API-writable. (This is why gclid uses google_click_id.)
    results.push({ name: attr, status: "standard", key: expectedKey });
  } else if (created.status === 401 || created.status === 403) {
    fail(created.status, created.body, `create "${gname}"`); // missing write scope → stop
  } else {
    results.push({ name: attr, status: `error ${created.status}`, key: expectedKey, body: created.body });
  }
}

console.log("Field       Status         Merge tag");
console.log("─────────── ────────────── ──────────────────────────");
for (const r of results) {
  const tag = `{{${r.key.startsWith("contact.") ? r.key : `contact.${r.key}`}}}`;
  console.log(`${r.name.padEnd(11)} ${r.status.padEnd(14)} ${tag}`);
  if (r.body) console.log(`            └─ ${String(r.body).slice(0, 160)}`);
}

const standard = results.filter((r) => r.status === "standard").map((r) => r.name);
if (standard.length) {
  console.log(
    `\n⚠️  ${standard.join(", ")} already exist as GHL STANDARD field(s): {{contact.${standard[0]}}} ` +
      `works natively.\n   Do NOT send them as custom fields — set ` +
      `GHL_ATTRIBUTION_CUSTOM_FIELDS to only the custom ones (e.g. fbclid,gbraid,wbraid).`
  );
}

if (!APPLY) {
  console.log("\nDry run only. Re-run with --apply to create the missing fields.");
} else {
  console.log(
    "\nDone. Use the merge tags above in the Meta Conversion API / Google Ads conversion\n" +
      "workflow steps. Keep GHL_ATTRIBUTION_CUSTOM_FIELDS == the CUSTOM (created) fields only."
  );
}
