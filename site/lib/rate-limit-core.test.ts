import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, getClientIpFromHeaders } from "./rate-limit-core";

test("rateLimit allows up to max in a window, then blocks", () => {
  const key = "test-allow-block";
  const cfg = { max: 3, windowMs: 60_000 };
  assert.equal(rateLimit(key, cfg).ok, true); // 1
  assert.equal(rateLimit(key, cfg).ok, true); // 2
  assert.equal(rateLimit(key, cfg).ok, true); // 3
  const blocked = rateLimit(key, cfg);
  assert.equal(blocked.ok, false); // 4 → over the limit
  assert.ok(blocked.retryAfter >= 1);
});

test("rateLimit isolates buckets per key", () => {
  const cfg = { max: 1, windowMs: 60_000 };
  assert.equal(rateLimit("key-a", cfg).ok, true);
  assert.equal(rateLimit("key-a", cfg).ok, false);
  // A different key has its own fresh bucket.
  assert.equal(rateLimit("key-b", cfg).ok, true);
});

test("rateLimit reports decreasing remaining", () => {
  const cfg = { max: 5, windowMs: 60_000 };
  assert.equal(rateLimit("rem", cfg).remaining, 4);
  assert.equal(rateLimit("rem", cfg).remaining, 3);
});

// IP resolution — the security-relevant fix: the leftmost (client-claimed)
// x-forwarded-for hop must NEVER be trusted, or a caller spoofs it to evade
// the per-IP limiter.
test("getClientIp ignores the spoofable leftmost x-forwarded-for hop", () => {
  // Attacker sets a fake first hop; Vercel appends the real IP to the right.
  const h = new Headers({ "x-forwarded-for": "1.2.3.4, 9.9.9.9" });
  assert.equal(getClientIpFromHeaders(h), "9.9.9.9");
});

test("getClientIp prefers the Vercel-authenticated header over x-forwarded-for", () => {
  const h = new Headers({
    "x-forwarded-for": "1.2.3.4, 9.9.9.9",
    "x-real-ip": "5.5.5.5",
    "x-vercel-forwarded-for": "6.6.6.6",
  });
  assert.equal(getClientIpFromHeaders(h), "6.6.6.6");
});

// cf-connecting-ip is a header the CALLER can send: nothing this template
// deploys to sits behind Cloudflare, so Vercel neither sets nor strips it. An
// earlier revision consulted it FIRST, which handed the limiter key straight
// back to the attacker — the same bypass as the leftmost x-forwarded-for hop,
// wearing a more official-looking name. This pins that it is ignored.
test("getClientIp ignores cf-connecting-ip, which no proxy here authenticates", () => {
  const h = new Headers({
    "x-forwarded-for": "1.2.3.4, 9.9.9.9",
    "cf-connecting-ip": "7.7.7.7",
  });
  assert.equal(getClientIpFromHeaders(h), "9.9.9.9", "a forged cf-connecting-ip must not become the key");
});

test("getClientIp uses the single x-forwarded-for value when there is no chain", () => {
  assert.equal(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "8.8.8.8" })), "8.8.8.8");
});

test("getClientIp returns 'unknown' with no proxy headers", () => {
  assert.equal(getClientIpFromHeaders(new Headers()), "unknown");
});
