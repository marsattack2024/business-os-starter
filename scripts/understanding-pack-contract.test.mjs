import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(import.meta.dirname, "..");
const skillRoot = join(root, ".claude/skills/understanding-pack");

function collectFiles(directory, output = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) collectFiles(path, output);
    else output.push(path);
  }
  return output;
}

function runNode(script, ...args) {
  return spawnSync(process.execPath, [join(skillRoot, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("the portable skill ships its complete executable contract without product coupling", () => {
  const required = [
    "SKILL.md",
    "agents/openai.yaml",
    "evals/evals.json",
    "evals/fixtures/approval-source.md",
    "evals/fixtures/valid-pack.json",
    "evals/fixtures/valid-training-pack.json",
    "references/figure-patterns.md",
    "references/output-contract.md",
    "references/output-schema.json",
    "references/quiz-quality.md",
    "references/security-and-provenance.md",
    "references/teaching-contract.md",
    "scripts/render-understanding-pack.mjs",
    "scripts/understanding-pack-lib.mjs",
    "scripts/understanding-pack.test.mjs",
    "scripts/validate-understanding-pack.mjs",
  ];

  for (const relativePath of required) {
    assert.ok(existsSync(join(skillRoot, relativePath)), `missing ${relativePath}`);
  }

  const entrypoint = readFileSync(join(skillRoot, "SKILL.md"), "utf8");
  assert.match(entrypoint, /^---\nname: understanding-pack\ndescription: .+\n---\n/);

  const source = collectFiles(skillRoot)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.doesNotMatch(source, /Agency\s*OS|Agents\s*First|AgentsFirst|agencyos\.local/i);
  assert.doesNotMatch(source, /docs\/understanding|clients\/<client_id>/i);
});

test("the bundled fixtures validate and render through the public command-line entrypoints", () => {
  for (const name of ["valid-pack.json", "valid-training-pack.json"]) {
    const input = join(skillRoot, "evals/fixtures", name);
    const output = join("/tmp", `business-os-${name}.html`);
    const validation = runNode("validate-understanding-pack.mjs", "--input", input);
    assert.equal(validation.status, 0, validation.stderr || validation.stdout);

    const rendering = runNode("render-understanding-pack.mjs", "--input", input, "--output", output);
    assert.equal(rendering.status, 0, rendering.stderr || rendering.stdout);
    const html = readFileSync(output, "utf8");
    assert.match(html, /validated Business OS understanding-pack v2 document/);
    assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/iu);
  }
});

test("hostile authored data remains passive after rendering", async () => {
  const { renderUnderstandingPack } = await import(
    join(skillRoot, "scripts/render-understanding-pack.mjs")
  );
  const fixture = JSON.parse(
    readFileSync(join(skillRoot, "evals/fixtures/valid-pack.json"), "utf8")
  );
  fixture.title = '</title><script data-attack="true">alert(1)</script>';
  fixture.visuals[0].items[0].detail = '<img src=x onerror="alert(1)">';

  const html = renderUnderstandingPack(fixture);
  assert.doesNotMatch(html, /<script data-attack="true">|<img src=x onerror=/);
  assert.match(html, /&lt;script data-attack=&quot;true&quot;&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});
