import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmedLeadRedirect,
  hrefWithValidatedLeadEvent,
  thankYouForLeadSource,
} from "./lead-redirect";

test("thankYouForLeadSource falls back to the general thank-you page", () => {
  assert.equal(thankYouForLeadSource("/contact"), "/thank-you");
  assert.equal(thankYouForLeadSource("/contact?utm_source=meta#form"), "/thank-you");
  assert.equal(thankYouForLeadSource(undefined), "/thank-you");
});

test("hrefWithValidatedLeadEvent only appends opaque app event ids", () => {
  assert.equal(
    hrefWithValidatedLeadEvent("/thank-you", "eid.123.456"),
    "/thank-you?lead_event=eid.123.456"
  );
  assert.equal(
    hrefWithValidatedLeadEvent("/thank-you?utm_source=meta", "eid.123.456"),
    "/thank-you?utm_source=meta&lead_event=eid.123.456"
  );
  assert.equal(hrefWithValidatedLeadEvent("/thank-you", "bad-id"), "/thank-you");
  assert.equal(hrefWithValidatedLeadEvent("/thank-you", "javascript:alert(1)"), "/thank-you");
  assert.equal(hrefWithValidatedLeadEvent("/thank-you", undefined), "/thank-you");
});

test("confirmedLeadRedirect combines source routing and lead_event validation", () => {
  assert.equal(
    confirmedLeadRedirect("/contact", "eid.123.456"),
    "/thank-you?lead_event=eid.123.456"
  );
});
