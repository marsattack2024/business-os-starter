import "server-only";
import { cache } from "react";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path, { join, resolve, sep } from "node:path";
import { parseFrontmatter, renderMarkdown } from "@/lib/mdx";

/**
 * Blog loader. Posts live as Markdown in `content/blog/*.mdx`. Files prefixed
 * with `_` (e.g. `_example.mdx`) are ignored, so the contract can be documented
 * without rendering. Empty by default — the `migrate-site` skill drops posts in.
 *
 * Publication model (parity with landing pages in lib/pages.ts):
 *   - `status: draft`  → never rendered or listed (work-in-progress / staging).
 *   - future `date`    → scheduled; hidden until the date arrives.
 *   - everything else  → published, listed newest-first.
 * Required frontmatter (title, slug, date YYYY-MM-DD) is validated at build for
 * published posts so a typo can't silently emit an invalid BlogPosting.
 */

export type PostStatus = "draft" | "published";

export type PostMeta = {
  title: string;
  slug: string;
  date: string; // YYYY-MM-DD
  status: PostStatus;
  author: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string; // "" when none
  coverAlt: string; // alt text for the cover image
  canonicalFrom: string[]; // old URLs that 301 here
};

export type Post = PostMeta & { html: string; body: string };

const BLOG_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "blog");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

let IMAGE_DIMS: Record<string, [number, number]> = {};
try {
  IMAGE_DIMS = JSON.parse(readFileSync(join(BLOG_DIR, "_image-dims.json"), "utf8"));
} catch {
  IMAGE_DIMS = {};
}

function toMeta(data: Record<string, string | string[]>, slug: string): PostMeta {
  const s = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
  const a = (k: string) => (Array.isArray(data[k]) ? (data[k] as string[]) : []);
  return {
    title: s("title"),
    slug: s("slug") || slug,
    date: s("date"),
    status: s("status") === "draft" ? "draft" : "published",
    author: s("author"),
    excerpt: s("excerpt"),
    category: s("category"),
    tags: a("tags"),
    coverImage: s("coverImage"),
    coverAlt: s("coverAlt"),
    canonicalFrom: a("canonicalFrom"),
  };
}

/** Fail the build on a published post with missing/invalid required frontmatter
 *  rather than shipping a post with an empty `datePublished` / unstable sort. */
function assertValidPublished(meta: PostMeta, file: string): void {
  const problems: string[] = [];
  if (!meta.title) problems.push("missing `title`");
  if (!meta.slug) problems.push("missing `slug`");
  if (!meta.date) problems.push("missing `date`");
  else if (!ISO_DATE.test(meta.date) || Number.isNaN(Date.parse(meta.date)))
    problems.push(`invalid \`date\` "${meta.date}" (expected YYYY-MM-DD)`);
  if (problems.length > 0) {
    throw new Error(`Invalid blog frontmatter in content/blog/${file}: ${problems.join(", ")}`);
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function postFiles(): string[] {
  if (!existsSync(BLOG_DIR)) return [];
  return readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));
}

/** All published, already-dated posts, newest first. Memoized per request so the
 *  directory is scanned + parsed once even when the index, the feed, the sitemap,
 *  and a post page's "related" block all read it in one render. */
export const getAllPosts = cache((): PostMeta[] => {
  const today = todayIso();
  const posts: PostMeta[] = [];
  for (const file of postFiles()) {
    const meta = toMeta(
      parseFrontmatter(readFileSync(join(BLOG_DIR, file), "utf8")).data,
      file.replace(/\.mdx$/, ""),
    );
    if (meta.status === "draft") continue; // unpublished
    assertValidPublished(meta, file); // build-time guardrail
    if (meta.date > today) continue; // scheduled / future-dated
    posts.push(meta);
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
});

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** Resolve a slug to a file INSIDE BLOG_DIR, or null. The `resolve` +
 *  `startsWith(base + sep)` check contains path traversal (`..`, absolute
 *  slugs) so a crafted `/md/blog/..%2f..` can't read files outside content/. */
function resolvePostFile(slug: string): string | null {
  if (!slug || slug.startsWith("_") || slug.includes("\0")) return null;
  const base = resolve(BLOG_DIR);
  const file = resolve(base, `${slug}.mdx`);
  if (!file.startsWith(base + sep)) return null;
  return existsSync(file) ? file : null;
}

export function getPost(slug: string): Post | null {
  const file = resolvePostFile(slug);
  if (!file) return null;
  const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
  const meta = toMeta(data, slug);
  // Never serve drafts or scheduled/future posts directly (parity with listing).
  if (meta.status === "draft") return null;
  // A published post must carry a valid date — otherwise it would render with an
  // empty datePublished in the Article JSON-LD. (getPost skips the build-time
  // assertValidPublished, so guard the date here too.)
  if (!ISO_DATE.test(meta.date)) return null;
  if (meta.date > todayIso()) return null;
  // `body` (raw Markdown) is also returned so /md can serve structured source.
  return { ...meta, html: renderMarkdown(body, IMAGE_DIMS, true), body };
}
