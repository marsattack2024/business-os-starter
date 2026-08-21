import { siteConfig } from "@/lib/site.config";
import { getPage } from "@/lib/pages";
import { getAllPosts, getPost } from "@/lib/posts";
import { absoluteUrl, getCanonicalBaseUrl } from "@/lib/site-url";
import {
  faqs as DEFAULT_FAQS,
  processSteps as DEFAULT_PROCESS_STEPS,
  includesItems as DEFAULT_INCLUDES_ITEMS,
  whyBookReasons as DEFAULT_WHY_BOOK_REASONS,
} from "@/lib/content.config";

/**
 * Per-page markdown builders for the /md routes + Accept: text/markdown
 * content negotiation (proxy.ts rewrites markdown-preferring requests to
 * these builders at the page's own URL).
 *
 * Pattern adapted from p2p-react-website's app/md/[...slug]/route.ts,
 * slimmed for the photographer template.
 */

export const MD_HEADERS: HeadersInit = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
  "X-Robots-Tag": "noindex", // these are agent-facing; don't compete with HTML in search
};

/** Stripped-down homepage as markdown. */
export function buildHomeMarkdown(): string {
  const lines: string[] = [];
  const url = absoluteUrl("/");

  lines.push("---");
  lines.push(`title: ${siteConfig.brand.name}`);
  lines.push(`canonical: ${url}`);
  lines.push(`description: ${siteConfig.seo.description}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${siteConfig.brand.name}`);
  lines.push("");
  if (siteConfig.brand.tagline) {
    lines.push(`> ${siteConfig.brand.tagline}`);
    lines.push("");
  }
  lines.push(siteConfig.seo.description);
  lines.push("");

  lines.push("## How the process works");
  for (const step of DEFAULT_PROCESS_STEPS) {
    lines.push(`### ${step.number}. ${step.title}`);
    lines.push(step.body);
    lines.push("");
  }

  lines.push("## What's included in every session");
  for (const item of DEFAULT_INCLUDES_ITEMS) {
    lines.push(`- ${item}`);
  }
  lines.push("");

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
  if (siteConfig.brand.email) lines.push(`- Email: ${siteConfig.brand.email}`);
  if (siteConfig.brand.phone) lines.push(`- Phone: ${siteConfig.brand.phone}`);
  lines.push(`- Inquiry form (browser): ${url}#contact`);
  lines.push(`- REST API (agents): POST ${getCanonicalBaseUrl()}/api/v1/inquiry`);
  lines.push("");

  lines.push("---");
  lines.push(`*Source: ${url} · Served as markdown via /md.*`);

  return lines.join("\n");
}

/** Thank-you page. */
export function buildThankYouMarkdown(): string {
  const url = absoluteUrl("/thank-you");
  return [
    "---",
    "title: Thank You",
    `canonical: ${url}`,
    "---",
    "",
    "# Thank You",
    "",
    "Your inquiry has been received. You'll hear back personally within one business day.",
    "",
    "---",
    `*Source: ${url}*`,
  ].join("\n");
}

export function buildLandingPageMarkdown(slug: string): string | null {
  const page = getPage(slug);
  if (!page) return null;
  const url = absoluteUrl(`/${page.slug}`);
  return [
    "---",
    `title: ${page.title}`,
    `canonical: ${url}`,
    page.description ? `description: ${page.description}` : "",
    page.status === "noindex" ? "robots: noindex" : "",
    "---",
    "",
    `# ${page.title}`,
    "",
    page.description,
    "",
    // Serve the source Markdown body verbatim (headings, lists, links preserved)
    // rather than flattening rendered HTML to one line — agents get real structure.
    page.body.trim(),
    "",
    "---",
    `*Source: ${url}*`,
  ].filter(Boolean).join("\n");
}

/** Blog index as markdown — the list of posts (so /blog negotiates cleanly). */
export function buildBlogIndexMarkdown(): string {
  const url = absoluteUrl("/blog");
  const posts = getAllPosts();
  const lines = [
    "---",
    `title: Journal, ${siteConfig.brand.name}`,
    `canonical: ${url}`,
    "description: Stories, tips, and behind-the-scenes from the studio.",
    "---",
    "",
    "# Journal",
    "",
    "Stories, tips, and behind-the-scenes from the studio.",
    "",
  ];
  for (const post of posts) {
    const link = `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)})`;
    lines.push(post.excerpt ? `${link}, ${post.excerpt}` : link);
  }
  lines.push("");
  lines.push("---");
  lines.push(`*Source: ${url}*`);
  return lines.join("\n");
}

export function buildBlogMarkdown(slug: string): string | null {
  const post = getPost(slug);
  if (!post) return null;
  const url = absoluteUrl(`/blog/${post.slug}`);
  return [
    "---",
    `title: ${post.title}`,
    `canonical: ${url}`,
    post.excerpt ? `description: ${post.excerpt}` : "",
    post.date ? `date: ${post.date}` : "",
    "---",
    "",
    `# ${post.title}`,
    "",
    post.excerpt,
    "",
    // Source Markdown body verbatim — preserves headings/lists/links for agents.
    post.body.trim(),
    "",
    "---",
    `*Source: ${url}*`,
  ].filter(Boolean).join("\n");
}
