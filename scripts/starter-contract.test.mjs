import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function collectFiles(directory, output = []) {
  for (const name of readdirSync(directory)) {
    if ([".agents", ".claude", ".codex", ".git", ".next", "node_modules"].includes(name)) continue;
    const path = join(directory, name);
    if (statSync(path).isDirectory()) collectFiles(path, output);
    else output.push(path);
  }
  return output;
}

test("private drafts and public website content have a physical boundary", () => {
  const posts = read("site/lib/posts.ts");
  const nextConfig = read("site/next.config.ts");
  const contentGuide = read("content/README.md");

  assert.match(posts, /path\.join\(process\.cwd\(\),\s*["']content["']\)/);
  assert.doesNotMatch(posts, /path\.join\(process\.cwd\(\),\s*["']\.\.["'],\s*["']content["']\)/);
  assert.doesNotMatch(nextConfig, /outputFileTracingRoot/);
  assert.ok(existsSync(join(root, "site/content/README.md")));
  assert.match(contentGuide, /private drafts/i);
  assert.match(contentGuide, /never appears on the website/i);
});

test("the work-item contract has one stable path and a useful starter record", () => {
  const required = [
    "work/README.md",
    "work/_template/context.md",
    "work/_template/rules.md",
    "work/_template/status.md",
    "work/_template/tasks.md",
    "work/_template/decisions.md",
    "work/_template/sources/README.md",
    "work/_template/deliverables/README.md",
    "work/_template/archive/README.md"
  ];

  for (const relativePath of required) {
    assert.ok(existsSync(join(root, relativePath)), `missing ${relativePath}`);
  }

  assert.match(read("AGENTS.md"), /work\/<name>/);
  assert.doesNotMatch(read("PERSONALIZE.md"), /\bmv clients\b|\brm -rf clients\b/);
});

test("drafting and publishing are separate capabilities", () => {
  const writeContent = read(".claude/skills/write-content/SKILL.md");
  const buildTool = read(".claude/skills/build-a-tool/SKILL.md");
  const publishPath = ".claude/skills/publish-content/SKILL.md";

  assert.doesNotMatch(writeContent, /published:\s*true/);
  assert.match(writeContent, /published:\s*false/);
  assert.ok(existsSync(join(root, publishPath)));
  assert.match(read(publishPath), /explicit(?:ly)? (?:asks|approval|approved)/i);
  assert.doesNotMatch(buildTool, /npx vercel/);
});

test("backup and connection guidance do not sweep secrets into agent context or git", () => {
  const saveWork = read(".claude/skills/save-my-work/SKILL.md");
  const connectAccounts = read(".claude/skills/connect-accounts/SKILL.md");

  assert.doesNotMatch(saveWork, /git add -A/);
  assert.match(saveWork, /git status --short/);
  assert.match(saveWork, /git diff --cached --name-only/);
  assert.match(saveWork, /git diff --cached/);
  assert.doesNotMatch(connectAccounts, /read first[\s\S]*\.env\.local/i);
  assert.match(connectAccounts, /never read|do not read/i);
});

test("personalization cannot delete a shared contract or leave required values ownerless", () => {
  const personalize = read("PERSONALIZE.md");

  assert.doesNotMatch(personalize, /\brm context\/offer\.md\b/);
  assert.doesNotMatch(personalize, /gh repo add-collaborator/);
  assert.match(personalize, /gh api[\s\S]*collaborators/);

  for (const token of [
    "CTA_LINK",
    "PUBLIC_CONTACT_EMAIL",
    "EXTRA_CLAIM_RULES",
    "REGULATED_RULES",
    "LEGAL_NOTICE"
  ]) {
    assert.match(personalize, new RegExp(`\\{\\{${token}\\}\\}`), `missing owner for ${token}`);
  }
});

test("every shipped business placeholder has an explicit personalization owner", () => {
  const personalize = read("PERSONALIZE.md");
  const tokens = new Set();
  for (const path of collectFiles(root)) {
    const relativePath = path.slice(root.length + 1);
    if (relativePath === "PERSONALIZE.md" || relativePath.startsWith(".claude/skills/")) continue;
    if (!/\.(?:md|tsx|css)$/.test(path)) continue;
    for (const match of readFileSync(path, "utf8").matchAll(/\{\{[A-Z][A-Z0-9_]*\}\}/g)) {
      tokens.add(match[0]);
    }
  }

  for (const token of [...tokens].sort()) {
    assert.ok(personalize.includes(token), `PERSONALIZE.md does not own ${token}`);
  }
});

test("capability installs are curated, project-local, and pinned", () => {
  const catalogPath = join(root, "capabilities/catalog.json");
  const guidePath = "docs/skills-connections-and-updates.md";
  const managerPath = ".claude/skills/manage-capabilities/SKILL.md";

  assert.ok(existsSync(catalogPath));
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const remotion = catalog.capabilities.find((item) => item.id === "remotion-video");

  assert.ok(remotion, "missing curated Remotion capability");
  assert.match(remotion.source.commit, /^[0-9a-f]{40}$/);
  assert.match(remotion.install.command, /skills@\d+\.\d+\.\d+/);
  assert.doesNotMatch(remotion.install.command, /(?:^|\s)-g(?:\s|$)|--global/);
  assert.match(remotion.install.command, /--skill\s+remotion-best-practices/);
  assert.match(remotion.install.command, /test ! -e \.claude\/skills\/remotion-best-practices/);
  assert.ok(existsSync(join(root, guidePath)));
  assert.ok(existsSync(join(root, managerPath)));
  assert.match(read(managerPath), /project-local/i);
  assert.match(read(managerPath), /already exists|is a symlink/i);
  assert.match(read(managerPath), /MCP/i);
});

test("Agents First is an owner-scoped accountability connection, not a shared agency connector", () => {
  const connectionGuide = "connections/agentsfirst.md";
  const skillPaths = [
    ".claude/skills/connect-agentsfirst/SKILL.md",
    ".claude/skills/daily-accountability/SKILL.md",
    ".claude/skills/plan-business-goals/SKILL.md",
    ".claude/skills/weekly-accountability/SKILL.md"
  ];

  assert.ok(existsSync(join(root, connectionGuide)));
  for (const relativePath of skillPaths) {
    assert.ok(existsSync(join(root, relativePath)), `missing ${relativePath}`);
    const source = read(relativePath);
    assert.doesNotMatch(source, /Agency\s*OS|GoHighLevel|GHL/i);
  }

  const connect = read(skillPaths[0]);
  const daily = read(skillPaths[1]);
  const goals = read(skillPaths[2]);
  const weekly = read(skillPaths[3]);
  const guide = read(connectionGuide);

  assert.match(connect, /https:\/\/app\.agentsfirst\.ai\/api\/external-agent\/mcp/);
  assert.match(connect, /own workspace|their workspace/i);
  assert.match(daily, /lookup_today/);
  assert.match(daily, /log_daily_entry/);
  assert.match(goals, /lookup_okrs/);
  assert.match(goals, /update_kr_progress/);
  assert.doesNotMatch(goals, /set_client_okrs/);
  assert.match(weekly, /log_weekly_entry/);
  assert.match(guide, /accountability/i);
  assert.match(guide, /CRM[\s\S]*(?:separate|later|upgrade)/i);
  assert.match(guide, /live (?:tool )?discovery/i);
});

test("wrap-up captures friction and local hygiene without becoming a blocking cleanup gate", () => {
  const wrapPath = ".claude/skills/wrap-up/SKILL.md";
  assert.ok(existsSync(join(root, wrapPath)));

  const agents = read("AGENTS.md");
  const ignore = read(".gitignore");
  const wrap = read(wrapPath);

  assert.match(agents, /\.session-observations\.md/);
  assert.match(agents, /continue|without stopping/i);
  assert.match(ignore, /^\.session-observations\.md$/m);
  assert.match(wrap, /git status --short/);
  assert.match(wrap, /git stash list/);
  assert.match(wrap, /git worktree list/);
  assert.match(wrap, /efficien|friction|rework/i);
  assert.match(wrap, /never delete|do not delete/i);
  assert.match(wrap, /npm run check/);
  assert.match(wrap, /when .*code|if .*code|only .*code/i);
});

test("every installed skill has a small, valid discovery header", () => {
  const skillRoot = join(root, ".claude/skills");
  const skillPaths = readFileSync(join(root, ".skill-paths.txt"), "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);

  for (const relativePath of skillPaths) {
    const path = join(skillRoot, relativePath, "SKILL.md");
    assert.ok(existsSync(path), `missing skill ${relativePath}`);
    const skill = readFileSync(path, "utf8");
    assert.match(skill, /^---\nname: [a-z0-9-]+\ndescription: .+\n---\n/);
  }
});
