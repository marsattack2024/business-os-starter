import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quizSlug,
  isQuizEnabled,
  getQuizzes,
  getDefaultQuiz,
  getQuizBySlug,
  getPopupQuizForPath,
  getQuizNavCta,
  validateQuizRegistry,
} from "./registry";
import type { QuizOutput, SiteQuiz } from "./types";

/** Minimal SiteQuiz fixture — only the registry-relevant fields matter here. */
function q(over: Partial<SiteQuiz> & { id: string }): SiteQuiz {
  return {
    content: {} as QuizOutput,
    theme: { font: "var(--font-serif)" },
    background: { imageSrc: "/x.jpg" },
    ...over,
  } as SiteQuiz;
}

test("quizSlug uses explicit slug, falls back to id", () => {
  assert.equal(quizSlug(q({ id: "a" })), "a");
  assert.equal(quizSlug(q({ id: "a", slug: "boudoir" })), "boudoir");
});

test("getQuizzes prefers quizzes[] over the quiz alias", () => {
  const a = q({ id: "a" });
  const b = q({ id: "b" });
  const single = q({ id: "single" });
  assert.deepEqual(
    getQuizzes({ quiz: single, quizzes: [a, b] }).map((x) => x.id),
    ["a", "b"],
  );
});

test("getQuizzes falls back to the single quiz alias when quizzes is empty/absent", () => {
  const single = q({ id: "single" });
  assert.deepEqual(getQuizzes({ quiz: single }).map((x) => x.id), ["single"]);
  assert.deepEqual(getQuizzes({ quiz: single, quizzes: [] }).map((x) => x.id), ["single"]);
  assert.deepEqual(getQuizzes({}).map((x) => x.id), []);
});

test("getQuizNavCta returns the default enabled quiz's navCta + /quiz href", () => {
  assert.deepEqual(
    getQuizNavCta({ quiz: q({ id: "a", enabled: true, navCta: "Claim $100 Off" }) }),
    { label: "Claim $100 Off", href: "/quiz" },
  );
  // Enabled but no navCta → null (no nav button rendered).
  assert.equal(getQuizNavCta({ quiz: q({ id: "a", enabled: true }) }), null);
  // Disabled quiz → null even with a navCta.
  assert.equal(getQuizNavCta({ quiz: q({ id: "a", enabled: false, navCta: "X" }) }), null);
  // No quiz configured → null.
  assert.equal(getQuizNavCta({}), null);
});

test("getQuizzes de-dupes by slug, first wins, order preserved", () => {
  const a = q({ id: "a", slug: "dup" });
  const b = q({ id: "b", slug: "dup" });
  const c = q({ id: "c" });
  assert.deepEqual(getQuizzes({ quizzes: [a, c, b] }).map((x) => x.id), ["a", "c"]);
});

test("getDefaultQuiz: flagged default wins, else the first", () => {
  const a = q({ id: "a" });
  const b = q({ id: "b", default: true });
  assert.equal(getDefaultQuiz({ quizzes: [a, b] })?.id, "b");
  assert.equal(getDefaultQuiz({ quizzes: [a] })?.id, "a");
  assert.equal(getDefaultQuiz({}), undefined);
});

test("getQuizBySlug matches by slug and by id fallback", () => {
  const a = q({ id: "a", slug: "boudoir" });
  const b = q({ id: "branding" });
  const cfg = { quizzes: [a, b] };
  assert.equal(getQuizBySlug(cfg, "boudoir")?.id, "a");
  assert.equal(getQuizBySlug(cfg, "branding")?.id, "branding");
  assert.equal(getQuizBySlug(cfg, "nope"), undefined);
});

test("getPopupQuizForPath: explicit showOn match wins over a global variation", () => {
  const global = q({ id: "global", enabled: true });
  const service = q({ id: "service", enabled: true, showOn: ["/branding"] });
  const cfg = { quizzes: [global, service] };
  assert.equal(getPopupQuizForPath(cfg, "/branding")?.id, "service");
  assert.equal(getPopupQuizForPath(cfg, "/")?.id, "global");
});

test("getPopupQuizForPath: prefers an enabled variation within a tier", () => {
  const draft = q({ id: "draft", enabled: false, showOn: ["/x"] });
  const live = q({ id: "live", enabled: true, showOn: ["/x"] });
  assert.equal(getPopupQuizForPath({ quizzes: [draft, live] }, "/x")?.id, "live");
});

test("getPopupQuizForPath: no match returns undefined", () => {
  const service = q({ id: "service", enabled: true, showOn: ["/branding"] });
  assert.equal(getPopupQuizForPath({ quizzes: [service] }, "/"), undefined);
});

test("getPopupQuizForPath: showOn is prefix-matched (covers children, not siblings)", () => {
  const svc = q({ id: "svc", enabled: true, showOn: ["/branding"] });
  const cfg = { quizzes: [svc] };
  assert.equal(getPopupQuizForPath(cfg, "/branding")?.id, "svc");
  assert.equal(getPopupQuizForPath(cfg, "/branding/")?.id, "svc"); // trailing slash
  assert.equal(getPopupQuizForPath(cfg, "/branding/logos")?.id, "svc"); // child
  assert.equal(getPopupQuizForPath(cfg, "/branding-extra"), undefined); // not a child
});

test("validateQuizRegistry: a clean registry has no errors", () => {
  const a = q({ id: "a", slug: "boudoir", default: true, showOn: ["/"] });
  const b = q({ id: "b", slug: "branding", showOn: ["/branding"] });
  assert.deepEqual(validateQuizRegistry([a, b]), []);
});

test("validateQuizRegistry: flags duplicate ids", () => {
  const errs = validateQuizRegistry([q({ id: "x", slug: "a" }), q({ id: "x", slug: "b" })]);
  assert.ok(errs.some((e) => e.includes('duplicate quiz id "x"')));
});

test("validateQuizRegistry: flags duplicate slugs", () => {
  const errs = validateQuizRegistry([q({ id: "a", slug: "dup" }), q({ id: "b", slug: "dup" })]);
  assert.ok(errs.some((e) => e.includes('duplicate quiz slug "dup"')));
});

test("validateQuizRegistry: flags a non-URL-safe slug", () => {
  const errs = validateQuizRegistry([q({ id: "a", slug: "Bad Slug/x" })]);
  assert.ok(errs.some((e) => e.includes("URL-safe slug")));
});

test("validateQuizRegistry: flags more than one default", () => {
  const errs = validateQuizRegistry([
    q({ id: "a", default: true }),
    q({ id: "b", default: true }),
  ]);
  assert.ok(errs.some((e) => e.includes("only one quiz variation may set default")));
});

test("validateQuizRegistry: a slug equal to another variation's id is NOT a collision", () => {
  // getQuizBySlug matches slug only (no id-fallback), so id and slug namespaces
  // are independent — this routes deterministically and must build clean.
  assert.deepEqual(
    validateQuizRegistry([q({ id: "alpha", slug: "shared" }), q({ id: "shared", slug: "beta" })]),
    [],
  );
});

test("isQuizEnabled: explicit flag wins over env", () => {
  assert.equal(isQuizEnabled(q({ id: "a", enabled: true })), true);
  assert.equal(isQuizEnabled(q({ id: "a", enabled: false })), false);
});
