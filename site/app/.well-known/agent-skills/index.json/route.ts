import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * Agent Skills Discovery (v0.2.0) — github.com/cloudflare/agent-skills-discovery-rfc
 * Advertises discrete agent-callable actions. Each skill points to a real
 * endpoint with a description an agent can use to decide whether to call it.
 *
 * Currently exposes one skill: submit-inquiry → POST /api/v1/inquiry.
 * Add more as the API surface grows.
 */

export const revalidate = 86400;

export async function GET() {
  const base = getCanonicalBaseUrl();

  const index = {
    $schema: "https://agentskills.io/schemas/v0.2.0/index.json",
    name: `${siteConfig.brand.name} skills`,
    description: `Agent-callable skills exposed by ${siteConfig.brand.name}.`,
    skills: [
      {
        name: "submit-inquiry",
        type: "api",
        description: `Submit an inquiry to ${siteConfig.brand.name}${siteConfig.brand.category ? ` (${siteConfig.brand.category})` : ""} on behalf of a user. Creates or updates a contact in the CRM (idempotent by email).`,
        url: `${base}/api/v1/inquiry`,
        method: "POST",
        spec: `${base}/api/openapi.json`,
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
