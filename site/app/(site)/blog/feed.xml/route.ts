import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";

// Static RSS feed for the Journal — syndication + faster discovery.
export const dynamic = "force-static";
export const revalidate = 3600;

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET() {
  const base = getCanonicalBaseUrl();
  const items = getAllPosts()
    .slice(0, 30)
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.brand.name)} | Journal</title>
    <link>${base}/blog</link>
    <atom:link href="${base}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(siteConfig.seo.description)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      // Syndication feed, not a search-competing HTML page (parity with /md).
      "X-Robots-Tag": "noindex",
    },
  });
}
