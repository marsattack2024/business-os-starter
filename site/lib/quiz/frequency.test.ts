import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isCapped,
  recordShow,
  localDayKey,
  readRecord,
  writeRecord,
  markSubmitted,
  type FrequencyConfig,
} from "./frequency";

const DAY = 86_400_000;
const NOW = 1_000 * DAY; // arbitrary fixed "now"
// The standard config: max 2 auto-shows per local day + a 30-day post-submit
// cooldown, with NO multi-day seen cooldown.
const cfg: FrequencyConfig = { maxShowsPerDay: 2, submittedCooldownDays: 30 };
// A variant that ALSO sets the optional multi-day seen cooldown.
const cfgSeen: FrequencyConfig = {
  maxShowsPerDay: 2,
  submittedCooldownDays: 30,
  seenCooldownDays: 3,
};

const TODAY = localDayKey(NOW);
const YESTERDAY = localDayKey(NOW - DAY);

test("not capped with an empty record", () => {
  assert.equal(isCapped({}, cfg, NOW), false);
});

test("per-day cap: allows up to the max today, then blocks", () => {
  assert.equal(isCapped({ shownDate: TODAY, shownCount: 1 }, cfg, NOW), false);
  assert.equal(isCapped({ shownDate: TODAY, shownCount: 2 }, cfg, NOW), true);
});

test("per-day cap resets on a new local day", () => {
  // Hit the cap yesterday → a new day starts fresh.
  assert.equal(isCapped({ shownDate: YESTERDAY, shownCount: 2 }, cfg, NOW), false);
});

test("seen cooldown is OFF by default (only the per-day cap governs)", () => {
  // A show yesterday does NOT block today when seenCooldownDays is unset.
  assert.equal(isCapped({ shownAt: NOW - DAY }, cfg, NOW), false);
});

test("optional seen cooldown blocks within N days of the last show when set", () => {
  assert.equal(isCapped({ shownAt: NOW - 2 * DAY }, cfgSeen, NOW), true);
  assert.equal(isCapped({ shownAt: NOW - 3 * DAY - 1 }, cfgSeen, NOW), false);
});

test("submitted cooldown blocks within 30 days, allows after", () => {
  assert.equal(isCapped({ submittedAt: NOW - 10 * DAY }, cfg, NOW), true);
  assert.equal(isCapped({ submittedAt: NOW - 30 * DAY - 1 }, cfg, NOW), false);
});

test("submission window suppresses even when today's count is under the cap", () => {
  assert.equal(
    isCapped({ submittedAt: NOW - 5 * DAY, shownDate: TODAY, shownCount: 0 }, cfg, NOW),
    true,
  );
});

test("legacy submitted:true record stays suppressed", () => {
  assert.equal(isCapped({ submitted: true, shownAt: NOW }, cfg, NOW), true);
  assert.equal(isCapped({ submitted: true }, cfg, NOW), true);
});

test("recordShow increments today's count and preserves submittedAt", () => {
  assert.deepEqual(recordShow({ submittedAt: 42 }, NOW), {
    shownAt: NOW,
    submittedAt: 42,
    shownDate: TODAY,
    shownCount: 1,
  });
  // A second show the same day → count 2.
  assert.deepEqual(recordShow({ shownDate: TODAY, shownCount: 1 }, NOW), {
    shownAt: NOW,
    submittedAt: undefined,
    shownDate: TODAY,
    shownCount: 2,
  });
  // First show on a new day → count resets to 1.
  assert.deepEqual(recordShow({ shownDate: YESTERDAY, shownCount: 2 }, NOW), {
    shownAt: NOW,
    submittedAt: undefined,
    shownDate: TODAY,
    shownCount: 1,
  });
});

test("integration: two shows then capped for the day", () => {
  let rec = recordShow({}, NOW); // show 1
  assert.equal(isCapped(rec, cfg, NOW), false);
  rec = recordShow(rec, NOW); // show 2
  assert.equal(isCapped(rec, cfg, NOW), true);
});

// In node:test there is no `localStorage`, so read/writeRecord exercise exactly
// the storage-blocked path (Safari private mode etc.): the in-memory fallback
// must still record the shows so the cap doesn't fail open.
test("read/writeRecord fall back to the in-memory store when storage is blocked", () => {
  const id = "fallback-A";
  assert.deepEqual(readRecord(id), {}); // nothing yet
  writeRecord(id, recordShow(recordShow({}, NOW), NOW)); // two shows today
  assert.equal(isCapped(readRecord(id), cfg, NOW), true); // and the cap now bites
});

test("markSubmitted persists via the in-memory fallback too", () => {
  const id = "fallback-B";
  markSubmitted(id, NOW);
  assert.equal(readRecord(id).submittedAt, NOW);
  assert.equal(isCapped(readRecord(id), cfg, NOW), true);
});
