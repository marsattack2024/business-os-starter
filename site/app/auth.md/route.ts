import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * /auth.md — agent authentication / registration doc (WorkOS auth.md convention).
 *
 * This is a public marketing site. Its only programmatic surface is the public
 * inquiry endpoint, which needs no auth. We state that honestly rather than
 * publishing OAuth/OIDC discovery metadata for an auth server that does not
 * exist (that would be invalid and misleading). If a protected resource is ever
 * added, publish /.well-known/oauth-protected-resource + oauth-authorization-server
 * and update this file.
 */

export const revalidate = 86400;

export async function GET() {
  const base = getCanonicalBaseUrl();
  const { brand } = siteConfig;
  const loc = brand.location ? `${brand.location.city}, ${brand.location.state}` : "";

  const body = `# Agent Access, ${brand.name}

${brand.name}${brand.category ? ` is a ${brand.category}` : ""}${loc ? ` in ${loc}` : ""}. This is a public marketing site.

## Programmatic surface
- \`POST ${base}/api/v1/inquiry\`, submit a contact inquiry. **Public. No authentication or agent registration required.** Rate-limited to 5 requests per minute per IP. Schema: \`${base}/api/openapi.json\`.

## Authentication
There are no protected resources, user accounts, OAuth flows, or API tokens on this site. Agents do **not** need to register or obtain credentials to use the public inquiry endpoint. If a protected resource is added later, this file plus \`/.well-known/oauth-protected-resource\` and \`/.well-known/oauth-authorization-server\` will be published.

## Discovery
- API catalog, \`${base}/.well-known/api-catalog\`
- OpenAPI spec, \`${base}/api/openapi.json\`
- MCP server card, \`${base}/.well-known/mcp/server-card.json\`
- Agent skills, \`${base}/.well-known/agent-skills/index.json\`
- Site content for LLMs, \`${base}/llms.txt\`, \`${base}/llms-full.txt\`
- Markdown views, send \`Accept: text/markdown\` to any page, or fetch \`${base}/md/<path>\`.
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
