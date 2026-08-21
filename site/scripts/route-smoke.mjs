#!/usr/bin/env node

const base = (process.env.SITE_SMOKE_BASE_URL || process.argv[2] || "http://127.0.0.1:3000").replace(/\/+$/, "");

const expectedRoutes = [
  ["/", "text/html"],
  ["/llms.txt", "text/plain"],
  ["/llms-full.txt", "text/plain"],
  ["/robots.txt", "text/plain"],
  ["/sitemap.xml", "application/xml"],
  ["/api/openapi.json", "application/json"],
  ["/.well-known/agent.json", "application/json"],
  ["/.well-known/agents.json", "application/json"],
  ["/.well-known/agent-skills/index.json", "application/json"],
  ["/.well-known/mcp/server-card.json", "application/json"],
  ["/.well-known/api-catalog", "application/linkset+json"],
  ["/auth.md", "text/markdown"],
  ["/.well-known/ai-catalog.json", "application/json"],
  ["/md", "text/markdown"],
  ["/md/thank-you", "text/markdown"],
  ["/blog/feed.xml", "application/rss+xml"],
];

const failures = [];

async function checkRoute(path, expectedType) {
  const res = await fetch(`${base}${path}`);
  const contentType = res.headers.get("content-type") || "";
  if (res.status !== 200) failures.push(`${path}: expected 200, got ${res.status}`);
  if (!contentType.includes(expectedType)) {
    failures.push(`${path}: expected content-type containing ${expectedType}, got ${contentType}`);
  }
  return { path, status: res.status, contentType };
}

for (const [path, expectedType] of expectedRoutes) {
  const result = await checkRoute(path, expectedType);
  console.log(`${result.status} ${result.contentType} ${result.path}`);
}

const openapiText = await (await fetch(`${base}/api/openapi.json`)).text();
if (/contactId|CRM contact ID|integration_not_configured/.test(openapiText)) {
  failures.push("/api/openapi.json exposes private CRM or integration details");
}

// Markdown content negotiation: what agent.json CLAIMS and what the site DOES
// must agree in both directions. A fork without proxy.ts must not advertise
// negotiation; a fork with it must not hide the capability behind /md-only docs.
const agentText = await (await fetch(`${base}/.well-known/agent.json`)).text();
const claimsNegotiation = /Accept: text\/markdown|markdown_negotiation/.test(agentText);
const negotiated = await fetch(`${base}/`, { headers: { Accept: "text/markdown" } });
const negotiatedType = negotiated.headers.get("content-type") || "";
const servesMarkdown = negotiatedType.includes("text/markdown");
if (claimsNegotiation && !servesMarkdown) {
  failures.push(
    `/.well-known/agent.json advertises markdown negotiation but / returned ${negotiatedType || "no content-type"}`
  );
}
if (servesMarkdown && !claimsNegotiation) {
  failures.push("/ negotiates markdown but /.well-known/agent.json never tells agents so");
}

const robotsText = await (await fetch(`${base}/robots.txt`)).text();
if (/Disallow:\s*\/_next\//.test(robotsText)) {
  failures.push("/robots.txt blocks /_next assets");
}

const inquiry = await fetch(`${base}/api/v1/inquiry`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Smoke Test",
    email: "smoke@example.com",
    sessionType: "portrait",
    source_agent: "route-smoke",
  }),
});
const inquiryBody = await inquiry.text();
if (!/^\{"ok":(true|false)(,"error":"submission_failed")?\}$/.test(inquiryBody)) {
  failures.push(`/api/v1/inquiry returned non-opaque body: ${inquiryBody}`);
}
console.log(`${inquiry.status} ${inquiry.headers.get("content-type") || ""} /api/v1/inquiry -> ${inquiryBody}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log(`route smoke passed for ${base}`);
