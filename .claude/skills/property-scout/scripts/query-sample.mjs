#!/usr/bin/env node
/**
 * Filter property-scout sample-data.json locally. No network. No credentials.
 *
 * Usage:
 *   node .claude/skills/property-scout/scripts/query-sample.mjs --beds 4 --max-price 2000000 --pool --near "South Miami"
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const samplePath = join(__dirname, "..", "sample-data.json");

function parseArgs(argv) {
  const out = {
    beds: null,
    baths: null,
    maxPrice: null,
    minPrice: null,
    pool: false,
    near: null,
    status: null,
    city: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--beds" && next) {
      out.beds = Number(next);
      i += 1;
    } else if (a === "--baths" && next) {
      out.baths = Number(next);
      i += 1;
    } else if (a === "--max-price" && next) {
      out.maxPrice = Number(next);
      i += 1;
    } else if (a === "--min-price" && next) {
      out.minPrice = Number(next);
      i += 1;
    } else if (a === "--pool") {
      out.pool = true;
    } else if (a === "--near" && next) {
      out.near = String(next).toLowerCase();
      i += 1;
    } else if (a === "--status" && next) {
      out.status = String(next).toLowerCase();
      i += 1;
    } else if (a === "--city" && next) {
      out.city = String(next).toLowerCase();
      i += 1;
    } else if (a === "--help" || a === "-h") {
      console.log(`query-sample.mjs — synthetic RESO-shaped listings only

Options:
  --beds N          minimum bedrooms
  --baths N         minimum bathrooms
  --min-price N     minimum ListPrice
  --max-price N     maximum ListPrice
  --pool            require PoolPrivateYN true
  --near TEXT       match NearLandmark or City (case-insensitive)
  --city TEXT       match City
  --status TEXT     match StandardStatus (e.g. Active)
`);
      process.exit(0);
    }
  }
  return out;
}

const filters = parseArgs(process.argv.slice(2));
const data = JSON.parse(readFileSync(samplePath, "utf8"));
const rows = (data.Property ?? []).filter((p) => {
  if (filters.beds != null && Number(p.BedroomsTotal) < filters.beds) return false;
  if (filters.baths != null && Number(p.BathroomsTotalInteger) < filters.baths) return false;
  if (filters.maxPrice != null && Number(p.ListPrice) > filters.maxPrice) return false;
  if (filters.minPrice != null && Number(p.ListPrice) < filters.minPrice) return false;
  if (filters.pool && !p.PoolPrivateYN) return false;
  if (filters.status && String(p.StandardStatus).toLowerCase() !== filters.status) return false;
  if (filters.city && String(p.City).toLowerCase() !== filters.city) return false;
  if (filters.near) {
    const hay = `${p.NearLandmark ?? ""} ${p.City ?? ""} ${p.UnparsedAddress ?? ""}`.toLowerCase();
    if (!hay.includes(filters.near)) return false;
  }
  return true;
});

console.log(
  JSON.stringify(
    {
      warning: "SYNTHETIC SAMPLE DATA — not a live MLS feed",
      matchCount: rows.length,
      filters,
      Property: rows,
    },
    null,
    2,
  ),
);
