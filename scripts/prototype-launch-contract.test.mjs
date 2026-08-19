import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

const prototype = read(".claude/skills/prototype-an-idea/SKILL.md");
const launch = read(".claude/skills/launch-a-small-app/SKILL.md");
const buildTool = read(".claude/skills/build-a-tool/SKILL.md");
const neonConnection = read("connections/neon.md");
const agents = read("AGENTS.md");
const deploymentTemplate = read("connections/deployments/_template.md");
const notices = read("THIRD_PARTY_NOTICES.md");
const prototypeEvals = JSON.parse(read(".claude/skills/prototype-an-idea/evals/evals.json"));
const launchEvals = JSON.parse(read(".claude/skills/launch-a-small-app/evals/evals.json"));
const prototypeText = prototype.replace(/\s+/g, " ");
const launchText = launch.replace(/\s+/g, " ");
const neonConnectionText = neonConnection.replace(/\s+/g, " ");

test("an exploratory idea stays local and cannot silently become a hosted app", () => {
  assert.match(prototypeText, /answers a question/i);
  assert.match(prototypeText, /\/tmp\/business-os-prototypes/);
  assert.match(prototypeText, /state in memory/i);
  assert.match(prototypeText, /do not add a database, login, payment, analytics, email send, provider SDK, or external API/i);
  assert.match(prototypeText, /do not deploy|do not use this skill to publish/i);
  assert.doesNotMatch(prototype, /\bnpx\s+(?:vercel|wrangler|neonctl)|\bvercel\s+deploy|\bwrangler\s+deploy/i);
});

test("a static launch does not inherit a database or provider SDK by default", () => {
  assert.match(launchText, /proven static-export artifact/i);
  assert.match(launchText, /static app needs no database/i);
  assert.match(launchText, /do not install Neon, Cloudflare, Vercel, Supabase, or another provider's SDK/i);
  assert.match(launchText, /normal Next\.js `\.next` directory is not that artifact/i);
  assert.match(launchText, /Server rendering, API routes, middleware/i);
  assert.doesNotMatch(launch, /npm (?:install|i)\s+(?:@neondatabase|@supabase|wrangler|vercel)/i);
});

test("an existing-site tool stays under the repository completion owner", () => {
  const buildToolText = buildTool.replace(/\s+/g, " ");
  assert.match(buildToolText, /From the repository root, run `npm run check`/i);
  assert.match(buildToolText, /site build alone is not the completion gate/i);
});

test("stateful apps evaluate Neon first without pretending it is mandatory", () => {
  assert.match(launchText, /Structured relational runtime data.*Neon Postgres/i);
  assert.match(launchText, /User accounts.*Neon Auth/i);
  assert.match(launchText, /User-uploaded files/i);
  assert.match(launchText, /Backend functions/i);
  assert.match(launchText, /Neon-first does not mean Neon-always/i);
  assert.match(launchText, /Neon supplies backend capabilities, not the public frontend host/i);
  assert.match(launchText, /Prefer current official documentation over remembered CLI commands/i);
  assert.match(launchText, /read `connections\/neon\.md`/i);
  assert.match(neonConnectionText, /Postgres and Neon Auth/i);
  assert.match(neonConnectionText, /does not host the application's frontend/i);
  assert.match(neonConnectionText, /preview features|limited by region/i);
  assert.match(launchText, /security, recovery window, support, availability, and contractual terms/i);
  assert.match(neonConnectionText, /Free is a price, not a compliance or uptime guarantee/i);
});

test("free hosting guidance cannot misroute a commercial business to Vercel Hobby", () => {
  assert.match(launchText, /personal, non-commercial preview/i);
  assert.match(launchText, /must not be presented as free commercial production hosting/i);
  assert.match(launchText, /Cloudflare Direct Upload/i);
});

test("provider authority and production proof remain owner-held", () => {
  for (const boundary of [
    /owner must sign in/i,
    /account, project, region, plan, database, environment targets, domain or DNS change, and production deployment/i,
    /explicit owner approval/i,
    /exact revision and public URL/i,
    /rollback/i,
    /Never paste credentials into chat or commit an `\.env` file/i
  ]) {
    assert.match(launchText, boundary);
  }
});

test("cloud builds cannot receive private Business OS source by default", () => {
  for (const source of [launchText, agents.replace(/\s+/g, " ")]) {
    assert.match(source, /Never connect or upload this entire private Business OS repository|Never connect or upload the repository root/i);
    for (const privatePath of ["context/", "content/", "work/", "inbox/"]) {
      assert.ok(source.includes(privatePath), `missing private path ${privatePath}`);
    }
  }
  assert.match(launchText, /direct upload of a reviewed static artifact/i);
  assert.match(launchText, /dedicated app repository/i);
  assert.match(launchText, /existing `site\/`.*`npm run check`/i);
});

test("every live app gets a secret-free deployment and rollback record", () => {
  for (const field of [
    "Public URL:",
    "Frontend host and project:",
    "Region and plan:",
    "Source repository or reviewed artifact:",
    "Deployed revision:",
    "Private-source boundary checked:",
    "Verified at:",
    "Rollback or removal route:"
  ]) {
    assert.ok(deploymentTemplate.includes(field), `missing deployment field ${field}`);
  }
  assert.match(deploymentTemplate, /Do not put tokens, connection strings, passwords, cookies/i);
  assert.match(launchText, /connections\/deployments\/_template\.md/i);
});

test("the adapted prototype method retains its reviewed MIT provenance", () => {
  assert.match(notices, /Copyright \(c\) 2026 Matt Pocock/);
  assert.match(notices, /885e2ca4d842d139e9aef4e48d366c63cb1b8013/);
  assert.match(notices, /MIT License/);
  assert.match(prototypeText, /references\/provenance\.md/);
});

test("the skills ship adversarial forward-evaluation scenarios", () => {
  assert.equal(prototypeEvals.skill_name, "prototype-an-idea");
  assert.equal(prototypeEvals.evals.length, 3);
  assert.equal(launchEvals.skill_name, "launch-a-small-app");
  assert.equal(launchEvals.evals.length, 4);

  const scenarios = JSON.stringify([...prototypeEvals.evals, ...launchEvals.evals]);
  for (const required of [
    "/tmp/business-os-prototypes",
    "Vercel Hobby",
    "Cloudflare",
    "confidential health and financial records",
    "server rendering and API routes",
    "owner authority",
    "private Business OS repository"
  ]) {
    assert.ok(scenarios.includes(required), `missing forward-eval boundary: ${required}`);
  }
});
