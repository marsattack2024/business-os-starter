import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * RFC 9727 — API Catalog (linkset format).
 * Lets agents discover the site's API surfaces from a single well-known URL.
 * Currently advertises one anchor (/api/v1/) with the OpenAPI spec as the
 * service-desc and the full markdown content as service-doc.
 */

export const revalidate = 86400;

export async function GET() {
  const base = getCanonicalBaseUrl();

  const linkset = {
    linkset: [
      {
        anchor: `${base}/api/v1/`,
        "service-desc": [
          {
            href: `${base}/api/openapi.json`,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: `${base}/llms-full.txt`,
            type: "text/plain",
          },
          {
            href: `${base}/auth.md`,
            type: "text/markdown",
          },
        ],
        "related": [
          { href: `${base}/.well-known/agent.json`, type: "application/json" },
          { href: `${base}/.well-known/agents.json`, type: "application/json" },
          { href: `${base}/.well-known/agent-skills/index.json`, type: "application/json" },
          { href: `${base}/.well-known/mcp/server-card.json`, type: "application/json" },
          { href: `${base}/.well-known/ai-catalog.json`, type: "application/json" },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(linkset, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
