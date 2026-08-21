#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { isPublicCopyFile, scanHumanWriting } from "./human-writing.mjs";

const root = process.cwd();
const launchMode = process.argv.includes("--launch");
const issues = [];

const SKIP_DIRS = new Set([".next", "node_modules", ".git", ".vercel", ".claude", ".codex", ".agents"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".mdx", ".json", ".css", ".html"]);

function addIssue(message, file) {
  issues.push(file ? `${file}: ${message}` : message);
}

function extname(path) {
  const match = path.match(/(\.[^.\/]+)$/);
  return match ? match[1] : "";
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (TEXT_EXT.has(extname(entry))) out.push(full);
  }
  return out;
}

function read(file) {
  return readFileSync(file, "utf8");
}

function stripCodeComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");
}

const files = walk(root);
const fileEntries = files.map((file) => ({
  abs: file,
  rel: relative(root, file),
  text: read(file),
}));

function scanPublicContract() {
  const publicContractFiles = [
    "app/api/v1/inquiry/route.ts",
    "app/api/mcp/route.ts",
    "app/api/openapi.json/route.ts",
    "README.md",
  ];
  for (const rel of publicContractFiles) {
    const entry = fileEntries.find((f) => f.rel === rel);
    if (entry?.text.includes("contactId")) {
      addIssue("public inquiry contract must not expose CRM contactId", rel);
    }
  }
}

function scanRobots() {
  if (existsSync(join(root, "app", "robots.ts"))) {
    addIssue("duplicate robots implementation exists; keep only robots.txt route handler", "app/robots.ts");
  }
  const robots = fileEntries.find((f) => f.rel === "app/robots.txt/route.ts");
  if (robots?.text.includes("Disallow: /_next/")) {
    addIssue("robots.txt must not block /_next assets", robots.rel);
  }
}

function scanAgentDiscovery() {
  const agent = fileEntries.find((f) => f.rel === "app/.well-known/agent.json/route.ts");
  if (!agent) return;
  // What the descriptor CLAIMS and what the site DOES must agree, in both
  // directions. Next 16 runs proxy.ts and Next 15 runs middleware.ts; a fork
  // with neither has only the explicit /md routes to advertise.
  const negotiates =
    existsSync(join(root, "proxy.ts")) || existsSync(join(root, "middleware.ts"));
  const claims =
    agent.text.includes("Accept: text/markdown") || agent.text.includes("markdown_negotiation");
  if (claims && !negotiates) {
    addIssue("agent descriptor advertises Accept negotiation this site does not implement", agent.rel);
  }
  if (negotiates && !claims) {
    addIssue("site negotiates Accept: text/markdown but the agent descriptor documents only /md routes", agent.rel);
  }
}

function scanAnchors() {
  const ids = new Set();
  const hrefAnchors = [];
  for (const { rel, text } of fileEntries) {
    for (const match of text.matchAll(/\bid=["']([a-zA-Z0-9_-]+)["']/g)) ids.add(match[1]);
    for (const match of text.matchAll(/\bhref=["']#([a-zA-Z0-9_-]+)["']/g)) {
      hrefAnchors.push({ rel, id: match[1] });
    }
  }
  for (const { rel, id } of hrefAnchors) {
    if (!ids.has(id)) addIssue(`broken in-page anchor #${id}`, rel);
  }
}

function scanAssets() {
  const assetRe = /["'`](\/(?:placeholder|images|pages|blog|icons)\/[^"'`\s)]+\.(?:avif|webp|png|jpe?g|svg|ico))["'`]/gi;
  for (const { rel, text } of fileEntries) {
    if (rel.includes("_example")) continue;
    if (!/^(app|components|content|lib)\//.test(rel)) continue;
    const searchable = /\.(ts|tsx|js|mjs|css)$/.test(rel) ? stripCodeComments(text) : text;
    for (const match of searchable.matchAll(assetRe)) {
      const assetPath = match[1];
      if (!existsSync(join(root, "public", assetPath.replace(/^\//, "")))) {
        addIssue(`missing public asset ${assetPath}`, rel);
      }
    }
  }
}

/**
 * LAUNCH SCOPE — public surfaces only.
 *
 * `--launch` used to sweep every text file content-qa's own walker touches:
 * the whole package tree minus `node_modules`. That caught real placeholder /
 * stale-platform / proof-claim strings, but it also caught `package-lock.json`,
 * `README.md`, `docs/`, `tasks/`, this script's own `scripts/*.mjs` siblings
 * (`content-qa.mjs` flagged ITSELF: its `showit|squarespace|wix` regex literal
 * contains the words it hunts for), and Next.js boundary/metadata files
 * (`error.tsx`, `global-error.tsx`, `icon.tsx`, `not-found.tsx`) that never
 * render for a visitor. None of that is a launch blocker, and real findings
 * drowned in the noise (87 hits on one fork, nearly all non-content).
 *
 * `isPublicCopyFile` (human-writing.mjs) already excludes scripts, docs,
 * tasks, README, lockfiles, tests and CSS. This narrows further to the
 * surfaces a visitor or crawler actually reads: `app/(site)/**` pages and
 * layouts (excluding its own error/not-found boundaries), the root
 * `app/layout.tsx`, per-page content data (`lib/pages/**`,
 * `lib/content.config.ts`), components that render copy, and published blog
 * posts. API routes, agent-discovery endpoints, and Next.js metadata
 * generators (icon/opengraph-image/sitemap) are excluded on purpose: real
 * files, but not pages a reader sees.
 */
const LAUNCH_BOUNDARY_BASENAMES = new Set(["error.tsx", "global-error.tsx", "not-found.tsx"]);

function isLaunchPublicSurface(rel) {
  if (!isPublicCopyFile(rel)) return false;
  if (rel.startsWith("app/(site)/")) {
    return !LAUNCH_BOUNDARY_BASENAMES.has(rel.slice(rel.lastIndexOf("/") + 1));
  }
  if (rel === "app/layout.tsx") return true;
  if (rel.startsWith("lib/pages/")) return true;
  if (rel === "lib/content.config.ts") return true;
  if (rel.startsWith("components/")) return true;
  return /^content\/blog\/[^/]+\.mdx$/.test(rel);
}

function scanLaunchContent() {
  if (!launchMode) return;
  const launchPatterns = [
    // Require an uppercase first char and exclude markdown links (`[Text](url)`)
    // so real placeholders ([Studio Name], [ST], [Photographer Name]) are caught
    // without flooding on TS array types, [0] indices, or markdown link text.
    [/\[[A-Z][^\]]*\](?!\()/, "placeholder bracket token"],
    [/\/placeholder\//, "placeholder asset reference"],
    [/awstrack|#block-|showit|squarespace|wix/gi, "stale source-platform residue"],
    [/\b(best|#1|featured|guarantee|guaranteed|5★|200\+|8 years)\b/i, "proof claim requires source map"],
  ];
  for (const { rel, text } of fileEntries) {
    if (rel.includes("node_modules") || rel.includes("_example")) continue;
    if (!isLaunchPublicSurface(rel)) continue;
    for (const [re, label] of launchPatterns) {
      if (re.test(text)) {
        addIssue(`${label} found`, rel);
      }
    }
  }
}

function scanInternalDocsInForkTemplate() {
  const scriptPath = join(root, "..", "..", "scripts", "create-client-site.mjs");
  if (!existsSync(scriptPath)) return;
  const script = readFileSync(scriptPath, "utf8");
  const requiredScaffoldPolicy = [
    "\\/docs",
    "writeSiteDocsReadme",
    "template-hardening-backlog",
    "template-grade-sweep",
  ];
  for (const required of requiredScaffoldPolicy) {
    if (!script.includes(required)) {
      addIssue(`client-site creator must keep template docs central: ${required}`, "../../scripts/create-client-site.mjs");
    }
  }
}

// Standards enforcement (templates/new-build/docs/TEMPLATE-STANDARDS.md §1 + §9): no banned CTA verbs
// and no hardcoded niche in component/descriptor LOGIC (the niche default lives in
// lib/site.config.tsx, which is intentionally excluded). Runs in every mode.
function scanStandards() {
  const bannedCtas = ["Work With Me", "Secure Your Spot", "View Full Gallery", "Get In Touch"];
  const niche = ["Portrait Studio", "photography session"];
  for (const { rel, text } of fileEntries) {
    const isCtaScope = /^components\/(sections|layout)\//.test(rel) || rel === "lib/content.config.ts";
    const isNicheScope = /^(app|components)\//.test(rel);
    if (!isCtaScope && !isNicheScope) continue;
    const code = /\.(tsx?|jsx?|mjs)$/.test(rel) ? stripCodeComments(text) : text;
    if (isCtaScope) {
      for (const phrase of bannedCtas) {
        if (code.includes(phrase)) {
          addIssue(`banned CTA verb "${phrase}" — standard: ONE verb sitewide ("Inquire")`, rel);
        }
      }
    }
    if (isNicheScope) {
      for (const phrase of niche) {
        if (code.includes(phrase)) {
          addIssue(`hardcoded niche "${phrase}" — standard: derive from siteConfig.brand.category`, rel);
        }
      }
    }
  }
}

/**
 * UNREPLACED TEMPLATE CLAIMS — the check that would have caught a live lie.
 *
 * `lib/content.config.ts` is not just homepage props. `lib/llms/content.ts`
 * publishes its offer, inclusions, process and proof into `/llms.txt` and
 * `/llms-full.txt`, which is what answer engines read and quote. So a fork that
 * ships the template's placeholder marketing copy is not "unfinished" — it is
 * actively telling AI engines things about a real business that are not true.
 *
 * This happened. A studio that sells finished artwork and hands over no files
 * went live telling assistants it delivered "50+ fully edited images",
 * "high-resolution digital downloads" and "unlimited personal print rights",
 * plus a "5★ Average Review" nobody had verified. Every one of those came from
 * the template defaults, and every other gate was green, because the copy reads
 * like real copy rather than like `[Placeholder]`.
 *
 * The strings below are exactly the template's own defaults, so the check can
 * only fire when a fork has not replaced them. It is skipped inside
 * `templates/new-build` itself, which is where they legitimately live.
 */
const TEMPLATE_DEFAULT_CLAIMS = Object.freeze([
  "50+ fully edited images",
  "High-resolution digital downloads",
  "Unlimited personal print rights",
  "5-business-day turnaround",
  "Location scouting & recommendations",
  "Pre-session style consultation",
  "Same-Week Gallery Delivery",
  "Unlimited Print Rights",
  "Natural Light Expertise",
  "100% Satisfaction Guarantee",
  "Style Consultation Included",
  "Sessions Photographed",
  "In Editorial Press",
  "Reach Out",
  "We Plan Together",
  "Show Up & Be You",
]);

function isBaseTemplate() {
  try {
    return JSON.parse(read(join(root, "package.json"))).name === "new-build";
  } catch {
    return false;
  }
}

function scanUnreplacedTemplateClaims() {
  if (isBaseTemplate()) return;
  const target = fileEntries.find((entry) => entry.rel === "lib/content.config.ts");
  if (!target) return;
  const code = stripCodeComments(target.text);
  for (const claim of TEMPLATE_DEFAULT_CLAIMS) {
    if (code.includes(claim)) {
      addIssue(
        `unreplaced template claim "${claim}" — this file is published verbatim to /llms.txt, ` +
          `so a default here is a false claim about a real business. Replace it with a sourced fact or delete it.`,
        target.rel
      );
    }
  }
}

/**
 * PROHIBITED CLAIMS — the per-client hard "never claim X" wall.
 *
 * Declared per fork in `lib/content.config.ts` (`prohibitedClaims`), empty in
 * the template because every entry is a fact about ONE studio.
 *
 * Origin: 2026-08-17 owner call. A studio's site had been telling buyers hair
 * and makeup came with the session; it does not. The ask was explicitly a
 * blocker rather than a note: "let me edit a page and add hair and makeup. It
 * won't let them." So this scan covers content/pages and content/blog MDX as
 * well as app/, components/ and lib/ — a false claim deleted from a component
 * is worth nothing if the next page edit puts it back.
 *
 * The declaration is read as TEXT, not imported: `content:qa` is plain node,
 * and a fork's content.config.ts may pull runtime modules through the `@/`
 * alias (kelli-wilke imports `@/lib/photos.generated`), which node cannot
 * resolve. Parsing keeps the gate working on every fork.
 *
 * Matching is deliberately dumb — a case-insensitive substring test with
 * whitespace collapsed so a wrapped MDX line still matches. No punctuation
 * cleverness: "hair and makeup" and "hair & makeup" are two declared entries.
 *
 * scope: "all" covers every rendered-copy surface. "site" covers all of them
 * except content/blog, for service claims whose subject the client's historical
 * articles may legitimately discuss (her headshot-prep posts advise readers on
 * doing their own hair and makeup, and stay verbatim).
 */
const CONTENT_CONFIG = "lib/content.config.ts";
const CLAIMS_DECLARATION = /export const prohibitedClaims[^=]*=\s*\[([\s\S]*?)\]\s*;/;
const CLAIM_ENTRY = /\{[^{}]*\}/g;
const CLAIM_PHRASE = /\bphrase:\s*(["'])((?:\\.|(?!\1)[^\\])*)\1/;
const CLAIM_REASON = /\breason:\s*(["'])((?:\\.|(?!\1)[^\\])*)\1/;
const CLAIM_SCOPE = /\bscope:\s*(["'])(site|all)\1/;

// Lowercase and collapse runs of whitespace so a claim still matches when MDX
// or prettier wraps it across two lines.
function flattenCopy(text) {
  return text.replace(/\s+/g, " ").toLowerCase();
}

function declaredValue(chunk, pattern) {
  const match = chunk.match(pattern);
  return match ? match[2].replace(/\\(.)/g, "$1") : null;
}

function readDeclaredClaims(configText) {
  const declaration = configText.match(CLAIMS_DECLARATION);
  if (!declaration) {
    addIssue(
      "missing `prohibitedClaims` declaration — every fork keeps the claim wall, empty when the client has no banned claim",
      CONTENT_CONFIG
    );
    return [];
  }
  const entries = declaration[1].match(CLAIM_ENTRY) ?? [];
  if (declaration[1].trim() !== "" && entries.length === 0) {
    addIssue(
      "`prohibitedClaims` is not empty but no entries could be read — declare plain object literals; this file is parsed as text",
      CONTENT_CONFIG
    );
    return [];
  }
  const claims = [];
  for (const chunk of entries) {
    const phrase = declaredValue(chunk, CLAIM_PHRASE);
    const reason = declaredValue(chunk, CLAIM_REASON);
    const scope = declaredValue(chunk, CLAIM_SCOPE);
    if (!phrase || !reason || !scope) {
      addIssue(
        `unreadable prohibitedClaims entry ${flattenCopy(chunk).trim()} — needs { phrase, reason, scope: "site" | "all" } with plain string values`,
        CONTENT_CONFIG
      );
      continue;
    }
    claims.push({ phrase, reason, scope });
  }
  return claims;
}

function scanProhibitedClaims() {
  const config = fileEntries.find((entry) => entry.rel === CONTENT_CONFIG);
  if (!config) return;
  const claims = readDeclaredClaims(config.text);
  if (claims.length === 0) return;
  for (const { rel, text } of fileEntries) {
    if (!isPublicCopyFile(rel)) continue;
    // The declaration itself is policy, not copy, so it must not trip its own gate.
    const source = rel === CONTENT_CONFIG ? text.replace(CLAIMS_DECLARATION, "") : text;
    const copy = flattenCopy(/\.(tsx?|jsx?|mjs)$/.test(rel) ? stripCodeComments(source) : source);
    const isEditorial = rel.startsWith("content/blog/");
    for (const { phrase, reason, scope } of claims) {
      if (scope === "site" && isEditorial) continue;
      if (copy.includes(flattenCopy(phrase))) {
        addIssue(`prohibited claim "${phrase}" — ${reason}`, rel);
      }
    }
  }
}

/**
 * PROOF NUMBERS — counts, never decimal averages.
 *
 * Agency standard (2026-08-14): publish "over 200 five star reviews", never
 * "4.9 stars". An average is a moving number that goes stale on a static page,
 * and a printed decimal invites arithmetic instead of trust. Ratings in visible
 * copy are the failure; `aggregateRating` in JSON-LD is a different surface and
 * is not matched here.
 */
function scanProofNumbers() {
  const RATING = /\b([0-4]\.\d)\s*(?:★|\/\s*5\b|-?\s*stars?\b|-star\b)/i;
  const STAR_AVERAGE = /\b\d(?:\.\d)?\s*★[^\n]{0,24}\baverage\b/i;
  for (const { rel, text } of fileEntries) {
    if (!/^(app|components|content)\//.test(rel) && rel !== "lib/content.config.ts") continue;
    const code = /\.(tsx?|jsx?|mjs)$/.test(rel) ? stripCodeComments(text) : text;
    const rating = code.match(RATING);
    if (rating) {
      addIssue(
        `published rating "${rating[0].trim()}" — standard: publish a COUNT ("over 200 five-star reviews"), never a decimal average`,
        rel
      );
    }
    const starAvg = code.match(STAR_AVERAGE);
    if (starAvg) {
      addIssue(
        `published star average "${starAvg[0].trim()}" — standard: publish a COUNT, never an average`,
        rel
      );
    }
  }
}

// Blog inline-image integrity (a migration that drops body images is a silent
// regression). Every `![](/blog/...)` must exist in /public AND have a width/height
// entry in content/blog/_image-dims.json (written by scripts/blog-images.mjs) — else
// it ships without dimensions → CLS. In --launch mode, a published post with ZERO
// inline images is flagged as a likely cover-only / dropped-body-images migration.
function scanBlogInlineImages() {
  const blogDir = join(root, "content", "blog");
  if (!existsSync(blogDir)) return;
  let dims = {};
  const dimsPath = join(blogDir, "_image-dims.json");
  if (existsSync(dimsPath)) {
    try {
      dims = JSON.parse(readFileSync(dimsPath, "utf8"));
    } catch {
      addIssue("content/blog/_image-dims.json is not valid JSON", "content/blog/_image-dims.json");
    }
  }
  for (const entry of readdirSync(blogDir)) {
    if (!entry.endsWith(".mdx") || entry.startsWith("_")) continue;
    const rel = relative(root, join(blogDir, entry));
    const text = readFileSync(join(blogDir, entry), "utf8");
    const refs = [...text.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
    for (const src of refs) {
      if (!src.startsWith("/")) continue;
      if (!existsSync(join(root, "public", src.replace(/^\//, "")))) {
        addIssue(`inline blog image missing from /public: ${src}`, rel);
      }
      if (!dims[src]) {
        addIssue(`inline blog image missing width/height in _image-dims.json (→ CLS); run npm run blog:images: ${src}`, rel);
      }
    }
    if (launchMode && refs.length === 0) {
      addIssue("published post has ZERO inline body images — likely a cover-only migration that dropped the body images (migrate-site: inline images are required)", rel);
    }
  }
}

// Migrated-spam scan. Hacked WordPress databases carry SEO-spam injections
// (hidden crypto/pharma/casino links) that a migration converter can PROMOTE to
// visible copy once the hiding styles are stripped — this shipped live on
// kelli-wilke before the 2026-08-15 sweep caught it. A tight denylist so
// photography copy can never false-positive; extend it when a new campaign is
// seen, never loosen it.
function scanMigratedSpamMarkers() {
  const SPAM = [
    /ledger[ -]live/i,
    /crypto(?:currency)?\s+(?:wallet|lending|portfolio)/i,
    /decentralized finance/i,
    /\bsildenafil\b|\btadalafil\b|\bviagra\b|\bcialis\b/i,
    /\bcasino\b|\bslots\b|1xbet|payday loan/i,
    /(?:left|top|text-indent)\s*:\s*-\d{3,}px/i,
    /ledger-live-desktop|aave\.lv|apothekeplus|beautypositive\.org/i,
  ];
  for (const { rel, text } of fileEntries) {
    if (!/^content\/(blog|pages)\/.+\.mdx$/.test(rel) || rel.includes("_example")) continue;
    for (const re of SPAM) {
      const m = text.match(re);
      if (m) {
        addIssue(
          `migrated-spam marker "${m[0].trim()}" — hacked-source injection carried into MDX; excise the block, never ship it`,
          rel
        );
      }
    }
  }
}

// Meta-description length (>160 chars truncates in SERPs + AI snippets). Flag, never
// truncate in code — the gate is the right place. Checks siteConfig.seo.description +
// every blog/page MDX frontmatter description/excerpt.
function scanSeoLengths() {
  const MAX = 160;
  const cfg = fileEntries.find((f) => /^lib\/site\.config\.tsx?$/.test(f.rel));
  if (cfg) {
    const m = cfg.text.match(/description:[\s\S]{0,120}?["']([^"']{25,})["']/);
    if (m && m[1].length > MAX) {
      addIssue(`seo.description is ${m[1].length} chars (>${MAX}) — truncates in SERPs/AI snippets`, cfg.rel);
    }
  }
  for (const { rel, text } of fileEntries) {
    if (!/^content\/(blog|pages)\/.+\.mdx$/.test(rel) || rel.includes("_example")) continue;
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const d = fm[1].match(/^(description|excerpt):\s*["']?(.+?)["']?\s*$/m);
    if (d && d[2].trim().length > MAX) {
      addIssue(`frontmatter ${d[1]} is ${d[2].trim().length} chars (>${MAX})`, rel);
    }
  }
}

function scanHumanWritingStandard() {
  for (const issue of scanHumanWriting(root)) {
    addIssue(`${issue.message} (${issue.rendering})`, `${issue.file}:${issue.line}`);
  }
}

scanPublicContract();
scanRobots();
scanAgentDiscovery();
scanAnchors();
scanAssets();
scanBlogInlineImages();
scanMigratedSpamMarkers();
scanStandards();
scanUnreplacedTemplateClaims();
scanProhibitedClaims();
scanProofNumbers();
scanSeoLengths();
scanHumanWritingStandard();
scanLaunchContent();
scanInternalDocsInForkTemplate();

for (const issue of issues) console.error(`FAIL ${issue}`);

if (issues.length > 0) {
  console.error(`\ncontent:qa failed with ${issues.length} issue(s).`);
  process.exit(1);
}

console.log(
  `content:qa passed in ${launchMode ? "launch" : "template"} mode.`,
);
