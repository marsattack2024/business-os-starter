import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attributionFromCookies,
  attributionFromFormData,
  mergeAttribution,
  type AttributionCookieStore,
} from "./contact-attribution";

/** A fake `cookies()` store — the same `{ get(name) }` shape Next.js returns. */
function fakeCookieStore(entries: Record<string, string>): AttributionCookieStore {
  return {
    get(name: string) {
      return name in entries ? { value: entries[name] } : undefined;
    },
  };
}

function formDataWith(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

/**
 * app/actions/submitInquiry.ts reads ad attribution from <AttributionFields />
 * hidden form inputs, which populate in a client-side effect. This repo has
 * had cases where effects inside a <form> subtree never fire post-hydration,
 * which would silently zero out gclid/fbclid/UTM on every submission —
 * conversion-tracking-critical for a paid-media client. attributionFromCookies()
 * is the fallback: cookies ride the POST regardless of hydration. These
 * tests pin the exact cookie names <AttributionTracker /> (via
 * captureAttributionFromUrl) writes, so a rename on one side that isn't
 * mirrored on the other fails loudly instead of silently dropping
 * attribution in production.
 */
test("attributionFromCookies reads the same cookie names AttributionTracker writes", () => {
  const store = fakeCookieStore({
    ph_click_gclid: "g-123",
    ph_click_fbclid: "fb-456",
    ph_utm_utm_source: "google",
    ph_utm_utm_campaign: "spring-sale",
    _fbp: "fb.1.111.222",
    _fbc: "fb.1.111.333",
  });

  assert.deepEqual(attributionFromCookies(store), {
    gclid: "g-123",
    fbclid: "fb-456",
    utm_source: "google",
    utm_campaign: "spring-sale",
    fbp: "fb.1.111.222",
    fbc: "fb.1.111.333",
  });
});

test("attributionFromCookies returns empty attribution when no attribution cookies are set", () => {
  const store = fakeCookieStore({ some_unrelated_cookie: "x" });
  assert.deepEqual(attributionFromCookies(store), {});
});

/**
 * The merge submitInquiry.ts performs: formData is the primary source (it
 * reflects this exact submission), cookies are the reliability layer for
 * whatever formData missed.
 */
test("mergeAttribution: cookie fallback fills keys missing from formData", () => {
  const formAttribution = attributionFromFormData(formDataWith({ attr_gclid: "g-form" }));
  const cookieAttribution = attributionFromCookies(
    fakeCookieStore({
      ph_click_gclid: "g-cookie",
      ph_utm_utm_source: "google",
      ph_utm_utm_medium: "cpc",
    })
  );

  const merged = mergeAttribution(formAttribution, cookieAttribution);

  // utm_source/utm_medium only existed in the cookie — they must survive the merge.
  assert.equal(merged.utm_source, "google");
  assert.equal(merged.utm_medium, "cpc");
});

test("mergeAttribution: formData wins over the cookie when both carry the same key", () => {
  const formAttribution = attributionFromFormData(formDataWith({ attr_gclid: "g-form-wins" }));
  const cookieAttribution = attributionFromCookies(
    fakeCookieStore({ ph_click_gclid: "g-cookie-loses" })
  );

  const merged = mergeAttribution(formAttribution, cookieAttribution);

  assert.equal(merged.gclid, "g-form-wins");
});

test("mergeAttribution: empty formData and empty cookies produce empty attribution", () => {
  const formAttribution = attributionFromFormData(new FormData());
  const cookieAttribution = attributionFromCookies(fakeCookieStore({}));

  const merged = mergeAttribution(formAttribution, cookieAttribution);

  assert.deepEqual(merged, {});
});

/**
 * The actual production scenario this fix targets: <AttributionFields />
 * never populated (no attr_* fields at all in formData) but the visitor's
 * gclid/UTM cookies are sitting on the request. Before this fix, that lead
 * reached the CRM with zero ad attribution.
 */
test("mergeAttribution: form hydration failure (no attr_ fields) still surfaces cookie attribution", () => {
  const formAttribution = attributionFromFormData(
    formDataWith({ name: "Jane Doe", email: "jane@example.com" }) // no attr_* fields at all
  );
  const cookieAttribution = attributionFromCookies(
    fakeCookieStore({
      ph_click_gclid: "g-cookie-survives",
      ph_utm_utm_source: "google",
      ph_utm_utm_campaign: "spring-sale",
    })
  );

  const merged = mergeAttribution(formAttribution, cookieAttribution);

  assert.deepEqual(merged, {
    gclid: "g-cookie-survives",
    utm_source: "google",
    utm_campaign: "spring-sale",
  });
});
