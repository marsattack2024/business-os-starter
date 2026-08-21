import { siteConfig } from "@/lib/site.config";
import { getAllPosts } from "@/lib/posts";
import { getIndexablePages } from "@/lib/pages";
import { buildPublicRoutes, llmsRoutes } from "@/lib/public-routes";
import { absoluteUrl, getCanonicalBaseUrl } from "@/lib/site-url";
import { getDefaultQuiz, isQuizEnabled } from "@/lib/quiz/registry";
import {
  faqs as DEFAULT_FAQS,
  processSteps as DEFAULT_PROCESS_STEPS,
  includesItems as DEFAULT_INCLUDES_ITEMS,
  whyBookReasons as DEFAULT_WHY_BOOK_REASONS,
} from "@/lib/content.config";

/**
 * Centralized content for /llms.txt and /llms-full.txt.
 * Both files share the same structure; llms-full.txt includes full prose
 * (FAQ answers, process step bodies, full why-book copy) while llms.txt
 * keeps just the titles/headings.
 *
 * Per https://llmstxt.org — designed for LLM agents that want a curated
 * map of the site's content without scraping every page.
 */

/**
 * Whether to advertise the quiz capture API. Self-gates exactly like the popup
 * + /quiz route + openapi + WebMCP: only when a quiz is actually enabled. We
 * advertise the API ENDPOINT (an agent capability), never the noindexed /quiz
 * funnel PAGE — so the quiz never enters the Pages list above.
 */
function quizApiAdvertised(): boolean {
  const quiz = getDefaultQuiz(siteConfig);
  return quiz ? isQuizEnabled(quiz) : false;
}

export function buildLlmsTxt(): string {
  const lines: string[] = [];
  const base = getCanonicalBaseUrl();
  const posts = getAllPosts();
  const routes = llmsRoutes(buildPublicRoutes({ posts, pages: getIndexablePages() }));

  lines.push(`# ${siteConfig.brand.name}`);
  lines.push("");
  if (siteConfig.brand.tagline) {
    lines.push(`> ${siteConfig.brand.tagline}`);
    lines.push("");
  }
  lines.push(siteConfig.seo.description);
  lines.push("");

  lines.push("## Pages");
  for (const page of routes.filter((route) => route.kind !== "blog-post")) {
    lines.push(`- [${page.title}](${absoluteUrl(page.path)}): ${page.description}`);
  }
  lines.push("");

  if (posts.length > 0) {
    lines.push("## Journal");
    for (const p of posts) {
      lines.push(`- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)})`);
    }
    lines.push("");
  }

  lines.push("## What's included in every session");
  for (const item of DEFAULT_INCLUDES_ITEMS) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## How it works");
  for (const step of DEFAULT_PROCESS_STEPS) {
    lines.push(`- ${step.number}. ${step.title}`);
  }
  lines.push("");

  lines.push("## Why clients book");
  for (const reason of DEFAULT_WHY_BOOK_REASONS) {
    lines.push(`- ${reason.title}`);
  }
  lines.push("");

  lines.push("## Common questions");
  for (const faq of DEFAULT_FAQS) {
    lines.push(`- ${faq.q}`);
  }
  lines.push("");

  lines.push("## Contact");
  if (siteConfig.brand.email) lines.push(`- Email: ${siteConfig.brand.email}`);
  if (siteConfig.brand.phone) lines.push(`- Phone: ${siteConfig.brand.phone}`);
  lines.push(`- Inquiry form: ${base}/#contact`);
  lines.push(`- API endpoint (agents): POST ${base}/api/v1/inquiry`);
  if (quizApiAdvertised()) {
    lines.push(
      `- Quiz (interactive lead capture): POST ${base}/api/v1/quiz (schema at ${base}/api/openapi.json)`
    );
  }

  return lines.join("\n");
}

export function buildLlmsFullTxt(): string {
  const lines: string[] = [];
  const base = getCanonicalBaseUrl();
  const posts = getAllPosts();
  const routes = llmsRoutes(buildPublicRoutes({ posts, pages: getIndexablePages() }));

  lines.push(`# ${siteConfig.brand.name}`);
  lines.push("");
  if (siteConfig.brand.tagline) {
    lines.push(`> ${siteConfig.brand.tagline}`);
    lines.push("");
  }
  lines.push(siteConfig.seo.description);
  lines.push("");

  lines.push("## Pages");
  for (const page of routes.filter((route) => route.kind !== "blog-post")) {
    lines.push(`### ${page.title}`);
    lines.push(`**URL:** ${absoluteUrl(page.path)}`);
    lines.push("");
    lines.push(page.description);
    lines.push("");
  }

  if (posts.length > 0) {
    lines.push("## Journal");
    for (const p of posts) {
      lines.push(`### ${p.title}`);
      lines.push(`**URL:** ${absoluteUrl(`/blog/${p.slug}`)}`);
      if (p.excerpt) {
        lines.push("");
        lines.push(p.excerpt);
      }
      lines.push("");
    }
  }

  lines.push("## What's included in every session");
  for (const item of DEFAULT_INCLUDES_ITEMS) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## How the booking process works");
  for (const step of DEFAULT_PROCESS_STEPS) {
    lines.push(`### ${step.number}. ${step.title}`);
    lines.push(step.body);
    lines.push("");
  }

  lines.push("## Why clients book");
  for (const reason of DEFAULT_WHY_BOOK_REASONS) {
    lines.push(`### ${reason.title}`);
    lines.push(reason.body);
    lines.push("");
  }

  lines.push("## Frequently asked questions");
  for (const faq of DEFAULT_FAQS) {
    lines.push(`### ${faq.q}`);
    lines.push(faq.a);
    lines.push("");
  }

  lines.push("## Contact");
  if (siteConfig.brand.email) lines.push(`- **Email:** ${siteConfig.brand.email}`);
  if (siteConfig.brand.phone) lines.push(`- **Phone:** ${siteConfig.brand.phone}`);
  lines.push(`- **Inquiry form:** ${base}/#contact`);
  lines.push(`- **REST API (for agents):** POST ${base}/api/v1/inquiry`);
  if (quizApiAdvertised()) {
    lines.push(
      `- **Quiz API (interactive lead capture, for agents):** POST ${base}/api/v1/quiz`
    );
  }
  lines.push(`- **OpenAPI spec:** ${base}/api/openapi.json`);
  lines.push("");

  if (siteConfig.socials.length > 0) {
    lines.push("## Social");
    for (const s of siteConfig.socials) {
      if (s.href && s.href !== "#") lines.push(`- ${s.label}: ${s.href}`);
    }
  }

  return lines.join("\n");
}
