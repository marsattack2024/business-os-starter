import "server-only";
import { cache } from "react";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path, { join, resolve, sep } from "node:path";
import { parseFrontmatter, renderMarkdown } from "@/lib/mdx";

/**
 * Landing-page loader. Marketing pages migrated from a previous site live as
 * Markdown in `content/pages/*.mdx` and render at their ORIGINAL slug via the
 * shared dynamic `/[slug]` route (so inbound + internal links keep resolving,
 * no redirect needed). `_`-prefixed files are ignored. Empty by default.
 */

export type PageMeta = {
  title: string;
  slug: string;
  description: string;
  heroImage: string;
  canonicalFrom: string[];
  status: "draft" | "indexable" | "noindex" | "redirect" | "retired";
};

export type LandingPage = PageMeta & { html: string; body: string };

const PAGES_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "pages");

let PAGE_DIMS: Record<string, [number, number]> = {};
try {
  PAGE_DIMS = JSON.parse(readFileSync(join(PAGES_DIR, "_image-dims.json"), "utf8"));
} catch {
  PAGE_DIMS = {};
}

function toMeta(data: Record<string, string | string[]>, slug: string): PageMeta {
  const s = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
  const a = (k: string) => (Array.isArray(data[k]) ? (data[k] as string[]) : []);
  return {
    title: s("title") || slug,
    slug: s("slug") || slug,
    description: s("description"),
    heroImage: s("heroImage"),
    canonicalFrom: a("canonicalFrom"),
    status: normalizeStatus(s("status")),
  };
}

function normalizeStatus(value: string): PageMeta["status"] {
  if (
    value === "draft" ||
    value === "indexable" ||
    value === "noindex" ||
    value === "redirect" ||
    value === "retired"
  ) {
    return value;
  }
  return "draft";
}

function pageFiles(): string[] {
  if (!existsSync(PAGES_DIR)) return [];
  return readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));
}

function readPageMeta(file: string): PageMeta {
  const slug = file.replace(/\.mdx$/, "");
  return toMeta(parseFrontmatter(readFileSync(join(PAGES_DIR, file), "utf8")).data, slug);
}

// Memoized per request — sitemap, llms, getPublicPages + getPageSlugs all read it.
export const getAllPages = cache((): PageMeta[] => pageFiles().map(readPageMeta));

export function getPublicPages(): PageMeta[] {
  return getAllPages().filter((page) => page.status === "indexable" || page.status === "noindex");
}

export function getIndexablePages(): PageMeta[] {
  return getAllPages().filter((page) => page.status === "indexable");
}

export function getPageSlugs(): string[] {
  return getPublicPages().map((page) => page.slug);
}

/** Resolve a slug to a file INSIDE PAGES_DIR, or null. The `resolve` +
 *  `startsWith(base + sep)` check contains path traversal (`..`, absolute
 *  slugs), so a crafted `/md/..%2f..` can't read files outside content/. */
function resolvePageFile(slug: string): string | null {
  if (!slug || slug.startsWith("_") || slug.includes("\0")) return null;
  const base = resolve(PAGES_DIR);
  const file = resolve(base, `${slug}.mdx`);
  if (!file.startsWith(base + sep)) return null;
  return existsSync(file) ? file : null;
}

export function getPage(slug: string): LandingPage | null {
  const file = resolvePageFile(slug);
  if (!file) return null;
  const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
  const meta = toMeta(data, slug);
  if (meta.status !== "indexable" && meta.status !== "noindex") return null;
  // `body` (raw Markdown) is also returned so /md can serve structured source.
  return { ...meta, html: renderMarkdown(body, PAGE_DIMS, false), body };
}
