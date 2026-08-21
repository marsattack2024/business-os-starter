---
name: property-scout
description: Explore property listings from bundled synthetic RESO-shaped sample data for practice and demos. Use for Friday drills, realtor/consultant prototypes, or listing filters. Never scrape Zillow, Realtor.com, or live MLS. Production MLS requires a licensed Bridge, Trestle, or MLS Grid feed.
---

# Property Scout (sample-data first)

Practice property search against **synthetic** RESO-shaped records in this skill.
Anyone can run it Friday with no MLS credentials.

## What this is

- A shared starter skill (not a per-student pack)
- A sample-data adapter with RESO-like field names
- A documented swap point for a licensed production feed later

## What this is not

- Not a live MLS, Bridge, Trestle, MLS Grid, or Spark connector
- Not a Zillow / Realtor.com / Homes.com scraper
- Not permission to invent API keys or copy someone else's feed credentials

## Open-source finding (research)

Legitimate RESO tooling exists, but **none of it is a free live MLS without a
licensed connection**:

| Source | URL | Why usable / not for Friday |
|---|---|---|
| Official RESO MCP | https://github.com/RESOStandards/reso-tools/tree/main/reso-mcp-server | Legitimate OData/MCP client. Needs auth to a RESO server (or a local reference server). Not a scraper. **Not playable without credentials or Docker reference setup.** |
| Bridge-backed UNLOCK MCP | https://github.com/GumpperGroup/unlock-reso-mcp-remote | Legitimate Bridge Interactive RESO client. Requires `BRIDGE_*` licensed credentials. |
| MLS Grid MCP | https://github.com/piotrsenkow/mlsgrid-mcp | Queries a DB you populate via MLS Grid sync — still needs a licensed feed. |

**Decision for this starter:** ship `property-scout` on `sample-data.json` so
students can filter and demo today. When a licensed realtor later gets Bridge,
Trestle, or MLS Grid access, swap the adapter — keep the same field names and
forbid scraping.

## Workflow

1. Read `context/rules.md` before any customer-facing property claim.
2. Load this skill's sample file:

   ```bash
   # From the repository root
   cat .claude/skills/property-scout/sample-data.json
   ```

   Or filter with Node (Mac and Windows):

   ```bash
   node .claude/skills/property-scout/scripts/query-sample.mjs --beds 4 --max-price 2000000 --pool --near "South Miami"
   ```

3. Treat every row as **synthetic**. Say that out loud in demos. Do not present
   sample addresses as real listings for sale.
4. When the owner has a licensed feed, stop using sample data for production
   answers. Document the connector in `connections/` (never commit tokens) and
   point queries at Bridge / Trestle / MLS Grid / RESO MCP instead.

## Connector boundary (production swap)

Keep these seams stable so a licensed feed can replace the file adapter:

| Seam | Sample adapter | Production |
|---|---|---|
| Listing rows | `sample-data.json` → `Property` objects | RESO OData `Property` from Bridge/Trestle/MLS Grid |
| Auth | none | Owner's licensed credentials via MCP/CLI env — never in Git |
| Query language | simple CLI flags | OData `$filter` / vendor MCP tools |
| Media | omitted or placeholder | Vendor media endpoints under their license terms |

Forbidden forever in this skill:

- Scraping consumer portals (Zillow, Realtor.com, Redfin, etc.)
- Sharing or committing MLS tokens
- Claiming sample rows are live inventory

## Done when

- Queries run against sample data without network calls
- The owner knows results are synthetic until a licensed feed is connected
- No scraping path was used
