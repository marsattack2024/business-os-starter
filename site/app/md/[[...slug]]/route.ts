import {
  MD_HEADERS,
  buildBlogIndexMarkdown,
  buildBlogMarkdown,
  buildHomeMarkdown,
  buildLandingPageMarkdown,
  buildThankYouMarkdown,
} from "@/lib/llms/page-markdown";

/**
 * /md/[...slug] — markdown views of known pages.
 *
 * Agents request /md/thank-you directly, or /md for the home page. The same
 * markdown is also served at each page's OWN url via Accept: text/markdown
 * content negotiation (see proxy.ts).
 *
 * To add a new page: add an entry to PAGE_MARKDOWN.
 */

const PAGE_MARKDOWN: Record<string, () => string> = {
  "": buildHomeMarkdown,
  "blog": buildBlogIndexMarkdown,
  "thank-you": buildThankYouMarkdown,
};

export const revalidate = 86400; // 24h

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const key = (slug ?? []).join("/");
  const builder = PAGE_MARKDOWN[key];

  if (builder) {
    return new Response(builder(), { status: 200, headers: MD_HEADERS });
  }

  const blogSlug = key.startsWith("blog/") ? key.replace(/^blog\//, "") : "";
  const dynamicMarkdown = blogSlug
    ? buildBlogMarkdown(blogSlug)
    : buildLandingPageMarkdown(key);

  if (!dynamicMarkdown) {
    return new Response(`# Not found\n\nNo markdown view available for /${key}.\n`, {
      status: 404,
      headers: MD_HEADERS,
    });
  }

  return new Response(dynamicMarkdown, { status: 200, headers: MD_HEADERS });
}
