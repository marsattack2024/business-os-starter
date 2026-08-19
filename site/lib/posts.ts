// ============================================================
// HOW YOUR WRITING GETS ONTO YOUR WEBSITE
//
// Your employee saves drafts and working documents in the
// project's top-level `content` folder. That folder is private:
// this site never reads it.
//
// Only files deliberately copied into `site/content` can be read
// by this website. That is the publication boundary.
//
// A public file also needs `published: true` at the top:
//
// That looks like this, at the very top of the file, between
// two lines of three dashes:
//
//   ---
//   title: Why most quotes go cold
//   date: YYYY-MM-DD
//   published: true
//   ---
//
// Change `true` to `false` and the post comes off the site.
// Files with no such block are ignored, quietly. Nothing breaks.
//
// The web address of a post is its filename without `.md`, so
// site/content/YYYY-MM-DD-blog-why-most-quotes-go-cold.md
// shows up at /blog/YYYY-MM-DD-blog-why-most-quotes-go-cold
//
// You do not need to read the code below.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderPublicMarkdown } from "./render-public-markdown.mjs";

// `site/content` is the only directory the deployable site reads.
const CONTENT_DIR = path.join(process.cwd(), "content");

export type Post = {
  slug: string;
  title: string;
  date: string; // "YYYY-MM-DD", or "" if the file never said
  summary: string;
  html: string;
};

/** Turn whatever the file said into "YYYY-MM-DD", or "". */
function readDate(value: unknown, filename: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  // Fall back to the date at the front of the filename.
  const fromName = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return fromName ? fromName[1] : "";
}

/** A readable title, even if the file forgot to give one. */
function readTitle(value: unknown, slug: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return slug
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/-/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

/** One plain sentence for the listing pages. */
function readSummary(value: unknown, body: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#"));
  if (!firstParagraph) return "";
  const plain = firstParagraph
    .replace(/[*_`>#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 180 ? `${plain.slice(0, 177)}…` : plain;
}

/**
 * Every published post, newest first.
 * A file that is missing, unreadable, or badly formatted is
 * skipped — it never stops the site from building.
 */
export function getPosts(): Post[] {
  let filenames: string[];
  try {
    filenames = fs
      .readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name);
  } catch {
    return []; // No content folder yet. That is fine.
  }

  const posts: Post[] = [];

  for (const filename of filenames) {
    try {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
      const { data, content } = matter(raw);

      // The switch. Anything other than true is not a post.
      if (data?.published !== true) continue;

      const slug = filename.replace(/\.md$/, "");
      posts.push({
        slug,
        title: readTitle(data.title, slug),
        date: readDate(data.date, filename),
        summary: readSummary(data.summary, content),
        html: renderPublicMarkdown(content),
      });
    } catch {
      continue; // Broken file. Skip it, keep the site up.
    }
  }

  // Newest first. Files with no date sort to the bottom.
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

/** One post by its web address, or undefined if there isn't one. */
export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

/** "22 August 2026" for the screen. Empty dates print nothing. */
export function formatDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
