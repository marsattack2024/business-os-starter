import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = join(import.meta.dirname, "..");
const buildRoot = join(root, "site/.next");

function collect(directory, output = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) collect(path, output);
    else if (name.endsWith(".nft.json")) output.push(path);
  }
  return output;
}

function inside(path, directory) {
  const child = relative(directory, path);
  return child === "" || (!child.startsWith(`..${sep}`) && child !== "..");
}

if (!existsSync(buildRoot)) {
  console.error("No site build found. Run npm run site:build first.");
  process.exit(1);
}

const traces = collect(buildRoot);
if (!traces.length) {
  console.error("The site build produced no Next.js trace files.");
  process.exit(1);
}

const privateRoots = ["content", "work", "inbox", "context", "connections"].map((path) => join(root, path));
const leaks = [];

for (const trace of traces) {
  const parsed = JSON.parse(readFileSync(trace, "utf8"));
  for (const file of parsed.files ?? []) {
    const absolute = resolve(dirname(trace), file);
    if (privateRoots.some((directory) => inside(absolute, directory)) || /(^|\/)\.env(?:\.|$)/.test(absolute)) {
      leaks.push(`${relative(root, trace)} -> ${relative(root, absolute)}`);
    }
  }
}

if (leaks.length) {
  console.error("Private Business OS files entered the deployable site trace:\n");
  for (const leak of leaks) console.error(`- ${leak}`);
  process.exit(1);
}

console.log(`Build boundary passed: ${traces.length} trace files contain no private Business OS paths.`);
