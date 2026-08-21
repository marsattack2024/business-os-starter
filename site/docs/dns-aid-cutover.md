# DNS-AID (DNS for AI Discovery) — custom-domain cutover task

`isitagentready` and similar scanners check for **DNS for AI Discovery** records:
SVCB/HTTPS DNS records under `_agents.<domain>` that let agents discover a site's
entrypoints over DNS (draft-mozleywilliams-dnsop-dnsaid, RFC 9460).

## Why this is NOT done on the preview URL

It is **impossible on a `*.vercel.app` subdomain** — Vercel owns that zone, so we
cannot publish records under `_agents.<sub>.vercel.app`. DNS-AID can only be
satisfied on the client's **own custom domain**, where we (or the client)
control DNS. So it is a **cutover task**, not a build task. Do not try to fake it.

## Publish at cutover (once the site is on its real domain)

Wherever the domain's DNS is managed (Vercel DNS, Cloudflare, Route 53, etc.),
add ServiceMode SVCB/HTTPS records that point agents at the surfaces the site
already serves (these all exist in every fork):

| Discovery name | Points at |
|---|---|
| `_index._agents.<domain>` | `/.well-known/api-catalog` (the linkset index) |
| `_ard._agents.<domain>`   | `/.well-known/ai-catalog.json` (the ARD manifest) |
| `_mcp._agents.<domain>`   | `/.well-known/mcp/server-card.json` |
| `_a2a._agents.<domain>`   | `/.well-known/agents.json` |

Example (zone-file style — adjust to your DNS provider's UI; `<domain>` = the live host):

```dns
; ServiceMode SVCB: priority 1, target = the host serving the well-known doc.
_index._agents.<domain>.  3600 IN SVCB  1 <domain>. ( alpn="h2,h3" )
_mcp._agents.<domain>.    3600 IN SVCB  1 <domain>. ( alpn="h2,h3" )
_a2a._agents.<domain>.    3600 IN SVCB  1 <domain>. ( alpn="h2,h3" )
```

Notes:
- The exact key/value params (`endpoint=`, etc.) are still moving in the IETF
  draft — check the current draft at publish time and match its parameter names.
- **Sign the zone with DNSSEC** so validating resolvers return authenticated data
  (the scanner rewards `AD=1`). Most managed DNS providers enable DNSSEC with one
  toggle.
- After publishing, re-run the scanner — DNS-AID should flip to pass, and
  Discoverability goes to 4/4.

## What's already shipped (no action needed)

robots.txt + Content-Signals + ARD `Agentmap:`, sitemap.xml, llms.txt /
llms-full.txt, `/md` markdown views + Accept-negotiation, RFC 8288 Link headers,
`/.well-known/*` (api-catalog, agent, agents, agent-skills, mcp/server-card,
ai-catalog.json), `/api/openapi.json`, `/auth.md`, and WebMCP. See the **Agent readiness** section of `CLAUDE.md`.
