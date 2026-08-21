import assert from "node:assert/strict";
import test from "node:test";
import { buildPendingLeadConversion, hrefWithLeadEvent } from "./lead-conversions";

test("buildPendingLeadConversion normalizes browser user_data", () => {
  const pending = buildPendingLeadConversion(
    {
      eventId: "eid.123.456",
      formName: "contact_form",
      leadType: "inquiry",
      sourcePage: "/40-over-40",
      name: "Jane Marie Wood",
      email: "  JANE@EXAMPLE.COM ",
      phone: "(303) 555-1212",
    },
    1_000
  );

  assert.deepEqual(pending, {
    event_id: "eid.123.456",
    created_at: 1_000,
    form_name: "contact_form",
    lead_type: "inquiry",
    source_page: "/40-over-40",
    user_data: {
      email_address: "jane@example.com",
      phone_number: "+13035551212",
      first_name: "jane",
      last_name: "marie wood",
      address: {
        first_name: "jane",
        last_name: "marie wood",
      },
    },
  });
});

test("explicit first/last names win over splitting full name", () => {
  const pending = buildPendingLeadConversion({
    eventId: "eid.123.789",
    formName: "contact_form",
    leadType: "inquiry",
    sourcePage: "/",
    name: "Ignored Name",
    firstName: "Wendy",
    lastName: "Wood",
    email: "wendy@example.com",
    phone: "+17207071962",
  });

  assert.equal(pending.user_data.first_name, "wendy");
  assert.equal(pending.user_data.last_name, "wood");
  assert.equal(pending.user_data.phone_number, "+17207071962");
});

test("hrefWithLeadEvent appends an opaque lead_event without disturbing existing query", () => {
  assert.equal(
    hrefWithLeadEvent("/quiz-thank-you?utm_source=meta", "eid.123.456"),
    "/quiz-thank-you?utm_source=meta&lead_event=eid.123.456"
  );
});
