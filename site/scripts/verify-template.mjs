#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "content:qa"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "lint"]],
  ["npm", ["run", "build"]],
  ["npm", ["run", "audit"]],
];

for (const [cmd, args] of steps) {
  const label = `${cmd} ${args.join(" ")}`;
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`\nverify failed at: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nverify passed");
