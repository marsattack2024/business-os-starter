import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const TEMPLATE_ROOT = join(import.meta.dirname, "..");
const panel = readFileSync(
  join(TEMPLATE_ROOT, "components/ui/TweaksPanel.tsx"),
  "utf8",
);
const config = readFileSync(join(TEMPLATE_ROOT, "lib/tweaks.config.ts"), "utf8");
const docs = readFileSync(join(TEMPLATE_ROOT, "docs/live-tweaks-setup.md"), "utf8");

test("the shared template exposes section-aware tweak metadata", () => {
  for (const contract of [
    /sectionLabel: string/u,
    /target: string/u,
    /block\?: ScrollLogicalPosition/u,
    /note\?: string/u,
  ]) {
    assert.match(panel, contract);
  }
  assert.match(panel, /groupTweakSections/u);
  assert.match(config, /sectionLabel/u);
});

test("the shared template snaps to and outlines the selected section", () => {
  assert.match(panel, /data-tweaks/u);
  assert.match(panel, /querySelectorAll/u);
  assert.match(panel, /pc-tweak-flash/u);
  assert.match(panel, /behavior: "auto"/u);
  assert.match(panel, /attempts < 6/u);
  assert.match(panel, /window\.innerWidth < 768/u);
  assert.match(panel, /setOpen\(false\)/u);
  assert.match(panel, /groups\.length[\s\S]*decisions/u);
});

test("template guidance permits source-backed copy review without hidden duplicates", () => {
  assert.match(docs, /source-backed/iu);
  assert.match(docs, /one active semantic tree/iu);
  assert.match(docs, /strongest recommended option first/iu);
});
