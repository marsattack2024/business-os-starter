import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * /.well-known/agents.json — multi-agent index.
 *
 * Points at the primary agent descriptor (/.well-known/agent.json) and the
 * MCP server card. Some agent discovery tools probe both /agent.json and
 * /agents.json — this is the index variant.
 */

export const revalidate = 86400;

export async function GET() {
  const base = getCanonicalBaseUrl();

  const index = {
    schema_version: "1.0",
    agents: [
      {
        name: `${siteConfig.brand.name} inquiry agent`,
        descriptor: `${base}/.well-known/agent.json`,
        protocol: "mcp",
        endpoint: `${base}/api/mcp`,
        server_card: `${base}/.well-known/mcp/server-card.json`,
      },
    ],
  };

  return new Response(JSON.stringify(index, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
