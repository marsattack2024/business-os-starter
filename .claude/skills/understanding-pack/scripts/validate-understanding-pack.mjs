#!/usr/bin/env node

import { loadPack, parseCliArgs, validateUnderstandingPack } from "./understanding-pack-lib.mjs";

try {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    console.log("Usage: npm run understanding:validate -- --input <pack.json>");
    process.exit(args.help ? 0 : 1);
  }
  const errors = validateUnderstandingPack(loadPack(args.input));
  if (errors.length > 0) {
    console.error(`Understanding pack is invalid (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(`Understanding pack is valid: ${args.input}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
