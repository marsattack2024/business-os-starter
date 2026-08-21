import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * MCP discovery manifest (SEP-1960). Claude Desktop and similar MCP
 * clients probe /.well-known/mcp when given a server URL to find the
 * transport + capabilities without manual config.
 */

export const revalidate = 3600;

export async function GET() {
  const base = getCanonicalBaseUrl();

  const manifest = {
    mcp_version: "1.0",
    endpoints: [
      {
        url: `${base}/api/mcp`,
        transport: "streamable-http",
        capabilities: {
          tools: true,
          resources: false,
          prompts: false,
        },
        description: `${siteConfig.brand.name} MCP server${siteConfig.brand.category ? `, ${siteConfig.brand.category}` : ""}. Tools: submit_inquiry (submit an inquiry to the business's CRM).`,
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
