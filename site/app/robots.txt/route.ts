import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * robots.txt as a route handler (vs Next's MetadataRoute.Robots) so we can
 * emit Content-Signal directives — a draft preference signal for AI bots
 * (contentsignals.org / IETF draft). Not part of RFC 9309 but increasingly
 * respected by major crawlers.
 *
 * Bot policy is driven by siteConfig.seo.aiBotPolicy. Default:
 *   allowSearch=true   → AI search engines can cite the site
 *   allowTraining=false → model training bots blocked from scraping
 */

const AI_SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
];

const AI_TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "claude-web",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Meta-ExternalAgent",
  "FacebookBot",
  "Amazonbot",
  "Diffbot",
  "ImagesiftBot",
  "Omgili",
  "Omgilibot",
];

export const revalidate = 86400; // 24h

export async function GET() {
  const base = getCanonicalBaseUrl();
  const policy = siteConfig.seo.aiBotPolicy ?? {
    allowSearch: true,
    allowTraining: false,
  };

  const lines: string[] = [];

  // ── Default crawler ────────────────────────────────
  lines.push("User-Agent: *");
  lines.push("Allow: /");
  lines.push("Disallow: /api/");
  lines.push("Disallow: /md/");
  lines.push("Disallow: /md$"); // bare /md (home markdown) — trailing-slash rule misses it
  lines.push("Disallow: /thank-you");
  lines.push("Disallow: /schedule-complete");
  // Quiz funnel surfaces are noindex thin ad-landing pages — keep them out of the
  // crawl budget too (the /quiz prefix covers /quiz, /quiz/, and /quiz/<slug>).
  lines.push("Disallow: /quiz");
  lines.push("Disallow: /quiz-thank-you");
  lines.push("");

  // ── Content Signals (draft spec — declares site-wide preferences) ──
  //   search     → indexing for retrieval / linking
  //   ai-input   → answering a user query in real time (RAG)
  //   ai-train   → ingesting into model training datasets
  lines.push(
    `Content-Signal: search=${policy.allowSearch ? "yes" : "no"}, ai-input=${policy.allowSearch ? "yes" : "no"}, ai-train=${policy.allowTraining ? "yes" : "no"}`
  );
  lines.push("");

  // ── AI search bots (per-bot rule so global toggles can't override) ──
  for (const bot of AI_SEARCH_BOTS) {
    lines.push(`User-Agent: ${bot}`);
  }
  lines.push(policy.allowSearch ? "Allow: /" : "Disallow: /");
  lines.push("");

  // ── AI training bots ────────────────────────────────
  for (const bot of AI_TRAINING_BOTS) {
    lines.push(`User-Agent: ${bot}`);
  }
  lines.push(policy.allowTraining ? "Allow: /" : "Disallow: /");
  lines.push("");

  // ── Sitemap + host ──────────────────────────────────
  lines.push(`Sitemap: ${base}/sitemap.xml`);
  // ARD's robots.txt discovery mechanism, alongside the well-known URI.
  lines.push(`Agentmap: ${base}/.well-known/ai-catalog.json`);
  lines.push(`Host: ${base}`);

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
