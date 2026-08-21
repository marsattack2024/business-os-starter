#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKIP_DIRS = new Set([
  ".agents",
  ".claude",
  ".codex",
  ".git",
  ".next",
  ".next-verify",
  ".turbo",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "docs",
  "generated",
  "node_modules",
  "out",
  "tasks",
  "vendor",
]);

const CODE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const CONTENT_EXTENSIONS = new Set([".html", ".json", ".md", ".mdx"]);
const PROHIBITED_EM_DASH = /—|&mdash;|&#0*8212;|&#x0*2014;/gi;

function isTestFile(path) {
  return /(?:^|\/)(?:__tests__|fixtures)(?:\/|$)/.test(path)
    || /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(path)
    || /\.snap$/.test(path);
}

export function isPublicCopyFile(relativePath) {
  const path = relativePath.replaceAll("\\", "/");
  if (isTestFile(path) || path.endsWith(".css") || /(?:^|\/)README\.md$/i.test(path)) return false;

  const extension = extname(path);
  if (path.startsWith("app/") || path.startsWith("components/") || path.startsWith("lib/")) {
    return CODE_EXTENSIONS.has(extension) || CONTENT_EXTENSIONS.has(extension);
  }

  if (/^content\/(?:blog|pages)\//.test(path)) {
    return extension === ".mdx";
  }

  return false;
}

function walk(root, directory = root, output = []) {
  for (const entry of readdirSync(directory)) {
    if (SKIP_DIRS.has(entry)) continue;
    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      walk(root, absolutePath, output);
      continue;
    }

    const relativePath = relative(root, absolutePath).replaceAll("\\", "/");
    if (isPublicCopyFile(relativePath)) output.push({ absolutePath, relativePath });
  }
  return output;
}

export function stripCodeComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/(^|\s)\/\/.*$/gm, (comment, prefix) => {
      return `${prefix}${" ".repeat(comment.length - prefix.length)}`;
    });
}

export function findProhibitedEmDashes(text) {
  const issues = [];
  PROHIBITED_EM_DASH.lastIndex = 0;
  for (const match of text.matchAll(PROHIBITED_EM_DASH)) {
    const index = match.index ?? 0;
    issues.push({
      line: text.slice(0, index).split("\n").length,
      rendering: match[0],
    });
  }
  return issues;
}

export function scanHumanWriting(root = process.cwd()) {
  const issues = [];
  for (const { absolutePath, relativePath } of walk(resolve(root))) {
    const source = readFileSync(absolutePath, "utf8");
    const searchable = CODE_EXTENSIONS.has(extname(relativePath))
      ? stripCodeComments(source)
      : source;
    for (const issue of findProhibitedEmDashes(searchable)) {
      issues.push({
        ...issue,
        file: relativePath,
        message: "prohibited em dash in public copy; rewrite the sentence with natural punctuation",
      });
    }
  }
  return issues;
}

export function runSelfTest() {
  const failures = [];
  const renderings = ["—", "&mdash;", "&#8212;", "&#08212;", "&#x2014;", "&#X02014;"];
  for (const rendering of renderings) {
    if (findProhibitedEmDashes(`Public copy ${rendering} must fail.`).length !== 1) {
      failures.push(`did not detect ${rendering}`);
    }
  }
  if (findProhibitedEmDashes("An en dash 2019–2020 is allowed.").length !== 0) {
    failures.push("incorrectly rejected an en dash");
  }
  if (findProhibitedEmDashes(stripCodeComments("// comment — allowed\nconst value = \"clear\";")).length !== 0) {
    failures.push("did not exclude a line comment");
  }
  if (findProhibitedEmDashes(stripCodeComments("/* comment &mdash; allowed */\nconst value = \"clear\";")).length !== 0) {
    failures.push("did not exclude a block comment");
  }
  if (!isPublicCopyFile("content/blog/post.mdx") || !isPublicCopyFile("content/blog/_example.mdx")) {
    failures.push("content scope is incorrect");
  }
  if (isPublicCopyFile("content/blog/_image-dims.json")) {
    failures.push("underscore-prefixed content data should stay excluded");
  }
  if (isPublicCopyFile("content/pages/LEGACY.md")) {
    failures.push("internal content documentation should stay excluded");
  }
  if (isPublicCopyFile("components/example.test.tsx") || isPublicCopyFile("app/globals.css")) {
    failures.push("test/CSS exclusions are incorrect");
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    return false;
  }
  console.log("human-writing self-test passed.");
  return true;
}

function runCli() {
  if (process.argv.includes("--self-test")) {
    process.exit(runSelfTest() ? 0 : 1);
  }

  const issues = scanHumanWriting();
  for (const issue of issues) {
    console.error(`FAIL ${issue.file}:${issue.line}: ${issue.message} (${issue.rendering})`);
  }
  if (issues.length > 0) {
    console.error(`\nhuman-writing failed with ${issues.length} issue(s).`);
    process.exit(1);
  }
  console.log("human-writing passed.");
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath || fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
