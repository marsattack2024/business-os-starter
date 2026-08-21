// Coverage for the attribution → GHL id-based custom-fields resolver. Pure +
// env-driven, so it runs under node:test without loading the server-only
// ./contacts module (which owns the live fieldKey→id lookup).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveCustomFieldsById,
  enabledCustomFieldAttrs,
  ATTRIBUTION_CUSTOM_FIELD_KEYS,
  DEFAULT_CUSTOM_FIELD_ATTRS,
} from "./custom-fields";

const ENV = "GHL_ATTRIBUTION_CUSTOM_FIELDS";

/** Run fn with GHL_ATTRIBUTION_CUSTOM_FIELDS set to `value` (undefined = unset). */
function withEnv(value: string | undefined, fn: () => void): void {
  const prev = process.env[ENV];
  if (value === undefined) delete process.env[ENV];
  else process.env[ENV] = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env[ENV];
    else process.env[ENV] = prev;
  }
}

/** A location field map (fieldKey → id) covering all 8 mapped fields. */
function fullMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const key of Object.values(ATTRIBUTION_CUSTOM_FIELD_KEYS)) {
    m.set(key, `id_${key.replace("contact.", "")}`);
  }
  return m;
}

const CAPTURED = {
  fbclid: "fb123",
  gclid: "g456", // NOT a custom field — rides {{contact.attributionSource.gclid}}
  gbraid: "gb789",
  wbraid: "wb012",
  fbc: "fb.1.1700.abc",
  fbp: "fb.1.1700.def",
  ttclid: "tt1",
  msclkid: "ms1",
  li_fat_id: "li1",
  utm_source: "facebook", // NOT a custom field
};

test("default (env unset): resolves all 8 as { id, value }; not gclid/UTMs", () => {
  withEnv(undefined, () => {
    const fields = resolveCustomFieldsById(CAPTURED, fullMap());
    const byId = Object.fromEntries(fields.map((f) => [f.id, f.value]));
    assert.equal(byId["id_fbclid"], "fb123");
    assert.equal(byId["id_gbraid"], "gb789");
    assert.equal(byId["id_wbraid"], "wb012");
    assert.equal(byId["id_fbc"], "fb.1.1700.abc");
    assert.equal(byId["id_fbp"], "fb.1.1700.def");
    assert.equal(byId["id_ttclid"], "tt1");
    assert.equal(byId["id_msclkid"], "ms1");
    assert.equal(byId["id_li_fat_id"], "li1");
    assert.equal(fields.length, 8); // the full P2P set, no gclid/UTMs
    // Every entry is id-based (never a `key`); GHL drops by-key writes.
    assert.ok(fields.every((f) => typeof f.id === "string" && typeof f.value === "string"));
    assert.ok(!("gclid" in ATTRIBUTION_CUSTOM_FIELD_KEYS));
  });
});

test("a field missing from the location map is skipped (never blocks the lead)", () => {
  withEnv(undefined, () => {
    const partial = new Map<string, string>([
      ["contact.fbclid", "id_fbclid"],
      ["contact.gbraid", "id_gbraid"],
      // fbc/fbp/etc. not created in this location
    ]);
    const fields = resolveCustomFieldsById(CAPTURED, partial);
    const ids = fields.map((f) => f.id).sort();
    assert.deepEqual(ids, ["id_fbclid", "id_gbraid"]);
  });
});

test("only captured values are emitted (no empty fields)", () => {
  withEnv(undefined, () => {
    const fields = resolveCustomFieldsById({ fbclid: "only-fbclid" }, fullMap());
    assert.deepEqual(fields, [{ id: "id_fbclid", value: "only-fbclid" }]);
  });
});

test("subset env: emits only the named attrs (gclid ignored — not a field)", () => {
  withEnv("fbclid, fbc , bogus_field, gclid", () => {
    const fields = resolveCustomFieldsById(CAPTURED, fullMap());
    const ids = fields.map((f) => f.id).sort();
    assert.deepEqual(ids, ["id_fbc", "id_fbclid"]);
  });
});

test("disable env (none/off/empty): resolves nothing", () => {
  for (const off of ["none", "off", "false", "", "  "]) {
    withEnv(off, () => {
      assert.deepEqual(resolveCustomFieldsById(CAPTURED, fullMap()), []);
    });
  }
});

test("no attribution / empty map → empty", () => {
  withEnv(undefined, () => {
    assert.deepEqual(resolveCustomFieldsById(undefined, fullMap()), []);
    assert.deepEqual(resolveCustomFieldsById({}, fullMap()), []);
    assert.deepEqual(resolveCustomFieldsById(CAPTURED, new Map()), []);
  });
});

test("mapping is the contact.* fieldKeys (8, no gclid)", () => {
  for (const [attr, key] of Object.entries(ATTRIBUTION_CUSTOM_FIELD_KEYS)) {
    assert.ok(key.startsWith("contact."), `${attr} → ${key} must be a contact.* fieldKey`);
  }
  assert.equal(ATTRIBUTION_CUSTOM_FIELD_KEYS.fbclid, "contact.fbclid");
  // gclid is intentionally NOT a custom field — contact.gclid is a read-only GHL
  // standard field; gclid rides {{contact.attributionSource.gclid}} instead.
  assert.ok(!("gclid" in ATTRIBUTION_CUSTOM_FIELD_KEYS));
  const keys = Object.keys(ATTRIBUTION_CUSTOM_FIELD_KEYS).sort();
  assert.deepEqual(keys, [
    "fbc",
    "fbclid",
    "fbp",
    "gbraid",
    "li_fat_id",
    "msclkid",
    "ttclid",
    "wbraid",
  ]);
});

test("enabledCustomFieldAttrs: unset returns the full P2P set (8, no gclid)", () => {
  withEnv(undefined, () => {
    const enabled = [...enabledCustomFieldAttrs()].sort();
    assert.deepEqual(enabled, [...DEFAULT_CUSTOM_FIELD_ATTRS].sort());
    assert.deepEqual(enabled, [
      "fbc",
      "fbclid",
      "fbp",
      "gbraid",
      "li_fat_id",
      "msclkid",
      "ttclid",
      "wbraid",
    ]);
  });
});
