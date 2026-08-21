/**
 * Blog index (listing).  ── PLUMBING permanent · STYLING temporary ──
 * The neutral, token-driven look here is a PLACEHOLDER; a future client build
 * may use a completely different token system. Restyle freely — just keep the
 * data flow (getAllPosts → cards) and the metadata wiring intact.
 * See CLAUDE.md → "Blog & landing plumbing".
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { buildPageMetadata } from "@/lib/seo";
import { getAllPosts } from "@/lib/posts";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBlogSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { getCanonicalBaseUrl } from "@/lib/site-url";

// noindex the empty state so a fresh fork never ships an indexable "No posts
// yet." page. Sitemap, llms.txt, and the nav already hide /blog until a post
// exists — this keeps the page itself consistent.
export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Journal",
    description: "Stories, tips, and behind-the-scenes from the studio.",
    path: "/blog",
    noIndex: getAllPosts().length === 0,
  });
}

function fmtDate(d: string): string {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const base = getCanonicalBaseUrl();

  return (
    <article className="bg-(--color-cream) px-6 pb-24 pt-16 text-(--color-ink) md:pt-20">
      <JsonLd data={buildBlogSchema(posts)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: `${base}/` },
          { name: "Journal", url: `${base}/blog` },
        ])}
      />
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--color-accent-text)">
            The Journal
          </p>
          <h1 className="mt-4 font-serif text-5xl font-normal leading-tight md:text-6xl">
            Stories from the studio
          </h1>
        </header>

        {posts.length === 0 ? (
          <p className="mt-16 text-center text-sm text-(--color-muted)">
            No posts yet.
          </p>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-(--color-image-loading)">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.coverAlt || post.title}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      className="object-cover object-[center_30%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                {post.category ? (
                  <p className="mt-5 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-(--color-accent-text)">
                    {post.category}
                  </p>
                ) : null}
                <h2 className="mt-2 font-serif text-2xl font-normal leading-snug transition-colors group-hover:text-(--color-accent-text)">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-(--color-muted)">
                    {post.excerpt}
                  </p>
                ) : null}
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-(--color-muted)">
                  {fmtDate(post.date)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
