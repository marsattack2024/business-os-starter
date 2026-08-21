# Contact attribution + phone normalization

Two production-grade features for photographers running paid traffic. Both opt-in by virtue of being passive — capture happens automatically, GHL just sees richer contacts.

## Phone normalization

GoHighLevel's `/contacts/upsert` returns 422 for bare 10-digit US numbers. The template normalizes to E.164 at the GHL boundary so clients can type any format.

| Input | Sent to GHL |
|---|---|
| `6503219725` | `+16503219725` |
| `(650) 321-9725` | `+16503219725` |
| `650.321.9725` | `+16503219725` |
| `1-650-321-9725` | `+16503219725` |
| `+16503219725` | `+16503219725` (passthrough) |
| `+447911123456` (UK) | `+447911123456` (passthrough — already has +) |
| `hello` | `hello` (passthrough — unrecognized) |

Implementation: `lib/phone.ts`. Exports:
- `normalizePhone(raw)` — always returns string (passthrough on unknown)
- `normalizePhoneStrict(raw)` — returns `null` when can't coerce
- `phoneLookupCandidates(raw)` — 5+ format variants for dedup checks

The contact form runs phone through `normalizePhone` automatically. No client-side validation pressure — type how you want, GHL gets a clean record.

## Ad-click + UTM attribution

Captures click IDs and UTM params from URL, stores in first-party cookies (90-day TTL), sends to GHL on every form submission. Lets the photographer see in their CRM dashboard which ad source brought each lead.

### What's captured

**Click IDs** (one set per ad platform):
- `gclid`, `gbraid`, `wbraid` — Google Ads
- `fbclid` — Meta Ads
- `ttclid` — TikTok Ads
- `msclkid` — Microsoft Ads
- `li_fat_id` — LinkedIn Ads

**UTM params** (standard set):
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`

**Pixel cookies** (read at submit, never written by us):
- `_fbp`, `_fbc` — Meta pixel (Meta's pixel sets them; we read at submit for CAPI)

### How it works

1. **`<AttributionTracker />`** mounts in root layout. On every page load it reads URL params and writes any captured values to first-party cookies (`ph_click_*`, `ph_utm_*`). **First-touch wins** — existing cookies aren't overwritten by later visits (matches platform attribution models).

2. **`<AttributionFields />`** renders inside each form (currently `ContactForm`). After hydration it reads `getStoredAttribution()` and emits hidden inputs (`<input name="attr_gclid" value="...">`).

3. **`submitInquiry` server action** extracts via `attributionFromFormData(formData)`. **`/api/v1/inquiry` REST endpoint** extracts via `attributionFromJson(body)` — same naming convention so agents can pass the same fields.

4. **`upsertContact` in lib/ghl/contacts.ts** maps to GHL's `attributionSource` object:
   - Direct mapping for click IDs (most fields stay the same name)
   - `li_fat_id` → `liFatId` (only renamed field)
   - UTMs → `utmSource`, `utmMedium`, etc. (plus duplicate `medium`/`campaign` for dashboard filters)
   - **`sessionSource`** derived: `"Paid"` if any click ID OR utm_medium matches `cpc|ppc|paid|ads`; `"Organic"` / `"Referral"` for those mediums.

### Behavior in practice

| Scenario | What happens |
|---|---|
| Visitor lands on `/` directly, fills form | No `attributionSource` sent. GHL contact has no attribution (clean — better than fake "Direct"). |
| Visitor lands via `?fbclid=XXX&utm_source=meta`, fills form | Cookies set. Form carries `attr_fbclid`, `attr_utm_source`, plus Meta's `_fbp` (live read). GHL contact's `attributionSource.fbclid`, `utmSource: "meta"`, `sessionSource: "Paid"`. |
| Same visitor returns 30 days later via a Google ad, fills again | First-touch wins. GHL still shows the Meta attribution (existing cookie). To overwrite, the visitor would need to clear cookies. |
| Agent POSTs to `/api/v1/inquiry` with `attr_gclid: "abc"` | Same attribution flow. GHL contact shows agent submission with the gclid. |

### Privacy

- **First-party cookies only.** No third-party tracking pixels added by us.
- **SameSite=Lax, Secure.** Cookies sent on top-level ad-click navigations only, HTTPS-only.
- **Platform pixel cookies (`_fbp`, `_fbc`) never written by us.** Read live at submit when they exist (set by Meta's pixel if the photographer adds it via GTM).
- **No PII in cookies.** Click IDs are anonymous opaque tokens.

### Disabling

Unmount `<AttributionTracker />` from `app/layout.tsx`. Existing cookies expire in 90 days; no further capture.

Remove `<AttributionFields />` from `ContactForm` if you also want submissions to stop carrying any stored attribution.

`lib/contact-attribution.ts` can stay — it's tree-shaken when nothing imports it.
