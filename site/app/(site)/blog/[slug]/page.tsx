/**
 * Blog post page.  ── PLUMBING permanent · STYLING temporary ──
 * The neutral look + .post-prose styling are PLACEHOLDERS; a future client build
 * may use a completely different token system. Restyle freely — just keep the
 * loader (getPost), JSON-LD (Article + Breadcrumb), metadata, and the
 * INLINE_CTA_MARKER body split intact.
 * See CLAUDE.md → "Blog & landing plumbing".
 */
import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildArticleMetadata } from "@/lib/seo";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { getCanonicalBaseUrl } from "@/lib/site-url";
import { getAllPosts, getPost, getPostSlugs } from "@/lib/posts";
import { INLINE_CTA_MARKER, readingMinutes } from "@/lib/mdx";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    image: post.coverImage || undefined,
    publishedTime: post.date,
    tags: post.tags,
  });
}

function InlineCta() {
  return (
    <aside className="my-12 border-y border-(--color-border) py-8 text-center">
      <p className="font-serif text-xl text-(--color-ink) md:text-2xl">Like what you see?</p>
      <Link
        href="/#contact"
        className="mt-4 inline-flex items-center justify-center border border-(--color-ink) px-7 py-3 text-xs font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-(--color-ink) hover:text-(--color-cream)"
      >
        Inquire
      </Link>
    </aside>
  );
}

function fmtDate(d: string): string {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const base = getCanonicalBaseUrl();
  const url = `${base}/blog/${post.slug}`;
  // Related = same category / shared tags first, then most recent (getAllPosts
  // is already newest-first, and V8's sort is stable, so ties keep that order).
  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score:
        (post.category && p.category === post.category ? 2 : 0) +
        p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.p);
  const segments = post.html.split(INLINE_CTA_MARKER);

  return (
    <>
      <JsonLd
        data={buildArticleSchema({
          title: post.title,
          description: post.excerpt,
          url,
          image: post.coverImage,
          datePublished: post.date,
          authorName: post.author,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: `${base}/` },
          { name: "Journal", url: `${base}/blog` },
          { name: post.title, url },
        ])}
      />

      <article className="bg-(--color-cream) text-(--color-ink)">
        <header className="px-6 pt-16 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            {post.category ? (
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--color-accent-text)">
                {post.category}
              </p>
            ) : null}
            <h1 className="mt-4 font-serif text-4xl font-normal leading-tight md:text-6xl">
              {post.title}
            </h1>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-(--color-muted)">
              {[post.author, fmtDate(post.date), `${readingMinutes(post.html)} min read`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </header>

        {post.coverImage ? (
          <div className="mx-auto mt-10 max-w-4xl px-6">
            <div className="relative aspect-[3/2] overflow-hidden bg-(--color-image-loading)">
              <Image
                src={post.coverImage}
                alt={post.coverAlt || post.title}
                fill
                priority
                sizes="(min-width:896px) 896px, 100vw"
                className="object-cover object-[center_35%]"
              />
            </div>
          </div>
        ) : null}

        <div className="mx-auto mt-14 max-w-2xl px-6">
          {segments.map((seg, i) => (
            <Fragment key={i}>
              <div className="post-prose" dangerouslySetInnerHTML={{ __html: seg }} />
              {i < segments.length - 1 ? <InlineCta /> : null}
            </Fragment>
          ))}
        </div>

        <div className="mx-auto max-w-2xl px-6 pb-16">
          <div className="mt-16 border-t border-(--color-border) pt-10 text-center">
            <p className="font-serif text-2xl md:text-3xl">Ready to work together?</p>
            <Link
              href="/#contact"
              className="mt-6 inline-flex items-center justify-center border border-(--color-ink) px-8 py-4 text-xs font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-(--color-ink) hover:text-(--color-cream)"
            >
              Inquire
            </Link>
          </div>
        </div>

        {related.length ? (
          <div className="border-t border-(--color-border) px-6 py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-center text-xs font-medium uppercase tracking-[0.25em] text-(--color-accent-text)">
                Keep reading
              </p>
              <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3">
                {related.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-(--color-image-loading)">
                      {p.coverImage ? (
                        <Image
                          src={p.coverImage}
                          alt={p.coverAlt || p.title}
                          fill
                          sizes="(min-width:640px) 33vw, 100vw"
                          className="object-cover object-[center_30%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-normal leading-snug transition-colors group-hover:text-(--color-accent-text)">
                      {p.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="px-6 pb-24 text-center">
          <Link
            href="/blog"
            className="text-xs uppercase tracking-widest text-(--color-accent-text) underline underline-offset-4 transition-colors hover:text-(--color-ink)"
          >
            ← All stories
          </Link>
        </div>
      </article>
    </>
  );
}
