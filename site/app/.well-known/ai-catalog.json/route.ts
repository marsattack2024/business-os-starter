import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl, isRealPublicValue } from "@/lib/site-url";

/**
 * /.well-known/ai-catalog.json — ARD (Agentic Resource Discovery) manifest.
 *
 * The discovery layer that sits in FRONT of the protocols this site already
 * serves: one fetch tells an agent (or a registry crawling on its behalf) that
 * the studio has an MCP server, a public inquiry API, and an llms.txt corpus,
 * instead of probing well-known paths one at a time.
 *
 * Every entry points at a surface this site actually serves. We deliberately
 * publish no host `identifier` — a `did:web:` claim has to resolve at
 * /.well-known/did.json and we do not publish one — and no `trustManifest`,
 * because an unverifiable trust claim is worse than no claim.
 *
 * Spec: https://agenticresourcediscovery.org
 * Schema: https://github.com/ards-project/ard-spec/blob/main/spec/schemas/ai-catalog.schema.json
 */

export const revalidate = 86400;

export async function GET() {
  const base = getCanonicalBaseUrl();
  const { brand } = siteConfig;

  // The publisher segment of every URN must be the domain serving this file.
  const publisher = new URL(base).hostname.replace(/^www\./, "");

  const name = brand.name;
  const category = isRealPublicValue(brand.category) ? brand.category : "photography studio";
  const place =
    brand.location && isRealPublicValue(brand.location.city)
      ? `${brand.location.city}, ${brand.location.state}`
      : "";
  const inPlace = place ? ` in ${place}` : "";
  // `serviceAreas` is optional in the template's brand type and missing entirely
  // from a couple of older forks' config types. Read it structurally so this
  // file stays byte-identical across every fork.
  const serviceAreas =
    "serviceAreas" in brand && Array.isArray(brand.serviceAreas) ? brand.serviceAreas : [];

  const metadata = {
    schemaOrgType: "PhotographyBusiness",
    ...(place && { address: place }),
    ...(isRealPublicValue(brand.phone) && { telephone: brand.phone }),
    ...(serviceAreas.length > 0 && { areaServed: serviceAreas.join("; ") }),
  };

  const catalog = {
    specVersion: "1.0",
    host: {
      displayName: name,
      documentationUrl: base,
    },
    entries: [
      {
        identifier: `urn:air:${publisher}:mcp:studio`,
        displayName: `${name} studio tools`,
        type: "application/mcp-server-card+json",
        mediaType: "application/mcp-server-card+json",
        url: `${base}/.well-known/mcp/server-card.json`,
        description: `MCP server card for ${name}, a ${category}${inPlace}. Exposes the studio's public inquiry tool over the Model Context Protocol. No authentication or agent registration required.`,
        tags: ["local-business", "photography", "inquiry"],
        capabilities: ["submit_inquiry"],
        representativeQueries: [
          `find a ${category.toLowerCase()}${inPlace}`,
          `book a session with ${name}`,
          `ask ${name} about availability`,
        ],
        metadata,
      },
      {
        identifier: `urn:air:${publisher}:api:inquiry`,
        displayName: `${name} inquiry API`,
        type: "application/vnd.oai.openapi+json",
        mediaType: "application/vnd.oai.openapi+json",
        url: `${base}/api/openapi.json`,
        description: `OpenAPI 3.1 description of the public REST endpoint that submits an inquiry to ${name} on a person's behalf. Public, rate-limited, no credentials.`,
        tags: ["local-business", "photography", "lead-generation"],
        capabilities: ["submit_inquiry"],
        representativeQueries: [
          `send an inquiry to ${name}`,
          `request a ${category.toLowerCase()} quote${inPlace}`,
          `contact ${name} on my behalf`,
        ],
      },
      {
        identifier: `urn:air:${publisher}:content:llms-full`,
        displayName: `${name} site content for LLMs`,
        type: "text/plain",
        mediaType: "text/plain",
        url: `${base}/llms-full.txt`,
        description: `Full plain-text corpus of ${name}'s public pages (services, process, pricing posture, and FAQs) in the llms.txt convention.`,
        tags: ["local-business", "photography", "content"],
        representativeQueries: [
          `what does ${name} offer`,
          `how does a session with ${name} work`,
          `${category.toLowerCase()}${inPlace}`,
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
