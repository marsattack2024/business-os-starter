import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const failures = [];
const expectedNodeVersion = "24.18.0";

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function requirePath(relativePath) {
  if (!existsSync(join(root, relativePath))) fail(`missing ${relativePath}`);
}

for (const pin of [".nvmrc", ".node-version"]) {
  requirePath(pin);
  if (existsSync(join(root, pin)) && read(pin).trim() !== expectedNodeVersion) {
    fail(`${pin} must pin ${expectedNodeVersion}`);
  }
}

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor !== 24 || nodeMinor < 18) {
  fail(`Node ${expectedNodeVersion} or newer in the Node 24 line is required; running ${process.versions.node}`);
}

try {
  const rootPackage = JSON.parse(read("package.json"));
  if (rootPackage.engines?.node !== ">=24.18.0 <25") {
    fail("package.json must declare the same Node 24 runtime contract");
  }
} catch (error) {
  fail(`package.json is invalid JSON: ${error.message}`);
}

for (const relativePath of [
  "content/README.md",
  "site/content/README.md",
  "work/README.md",
  "capabilities/catalog.json",
  "connections/neon.md",
  "connections/deployments/README.md",
  "connections/deployments/_template.md",
  "THIRD_PARTY_NOTICES.md",
  "docs/skills-connections-and-updates.md"
]) {
  requirePath(relativePath);
}

for (const [relativePath, expected] of [
  [".agents/skills", "../.claude/skills"],
  [".codex/skills", "../.claude/skills"]
]) {
  const absolute = join(root, relativePath);
  if (!existsSync(absolute) || !lstatSync(absolute).isSymbolicLink()) {
    fail(`${relativePath} must be a symlink`);
  } else if (readlinkSync(absolute) !== expected) {
    fail(`${relativePath} must point to ${expected}`);
  }
}

const listedSkills = read(".skill-paths.txt").trim().split("\n").filter(Boolean);
const installedSkills = readdirSync(join(root, ".claude/skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, ".claude/skills", entry.name, "SKILL.md")))
  .map((entry) => entry.name)
  .sort();

if (JSON.stringify([...listedSkills].sort()) !== JSON.stringify(installedSkills)) {
  fail(".skill-paths.txt and the installed project skill directories disagree");
}

for (const name of listedSkills) {
  const relativePath = `.claude/skills/${name}/SKILL.md`;
  requirePath(relativePath);
  if (!existsSync(join(root, relativePath))) continue;
  const source = read(relativePath);
  if (!/^---\nname: [a-z0-9-]+\ndescription: .+\n---\n/.test(source)) {
    fail(`${relativePath} has an invalid discovery header`);
  } else if (!source.startsWith(`---\nname: ${name}\n`)) {
    fail(`${relativePath} discovery name must match its directory`);
  }
}

try {
  const catalog = JSON.parse(read("capabilities/catalog.json"));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.capabilities)) {
    fail("capabilities/catalog.json has an unsupported shape");
  }
  for (const capability of catalog.capabilities ?? []) {
    if (!/^[0-9a-f]{40}$/.test(capability?.source?.commit ?? "")) {
      fail(`capability ${capability?.id ?? "unknown"} is not commit-pinned`);
    }
    const command = capability?.install?.command ?? "";
    if (!command.includes(`skills@${catalog.installer?.version}`) || !command.includes(capability.source.commit)) {
      fail(`capability ${capability?.id ?? "unknown"} command does not match its pinned catalog inputs`);
    }
    if (/(?:^|\s)(?:-g|--global|--all)(?:\s|$)/.test(command) || /skills@latest/.test(command)) {
      fail(`capability ${capability?.id ?? "unknown"} has an unsafe install command`);
    }
  }
} catch (error) {
  fail(`capabilities/catalog.json is invalid JSON: ${error.message}`);
}

if (existsSync(join(root, "site/lib/posts.ts"))) {
  const posts = read("site/lib/posts.ts");
  if (/path\.join\(process\.cwd\(\),\s*["']\.\.["'],\s*["']content["']\)/.test(posts)) {
    fail("site still reads private root content");
  }
}

if (existsSync(join(root, "site/next.config.ts")) && /outputFileTracingRoot/.test(read("site/next.config.ts"))) {
  fail("site output tracing still spans the private repository root");
}

try {
  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  const trackedSecrets = tracked.filter((path) => /(^|\/)\.env($|\.)/.test(path) && !path.endsWith(".example"));
  if (trackedSecrets.length) fail(`tracked secret-shaped files: ${trackedSecrets.join(", ")}`);
} catch (error) {
  fail(`could not inspect tracked files: ${error.message}`);
}

if (failures.length) {
  console.error("Business OS doctor found problems:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Business OS doctor passed: ${listedSkills.length} skills, safe discovery links, curated capabilities, and private/public boundaries.`);
