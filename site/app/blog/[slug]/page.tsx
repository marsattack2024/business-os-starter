// ============================================================
// ONE BLOG POST
//
// This page renders a single public file from `site/content` as
// a page on your site. The address is the filename without the
// `.md` on the end.
//
// You never edit this file to publish. You write a post, your
// employee explicitly publishes it into `site/content/` with
// `published: true`, and this page does the rest.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPosts } from "@/lib/posts";

// Build a page for every post that exists when the site is built.
// Posts written after that are read when someone asks for them,
// which is what lets a brand new post work straight away.
export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance break-words sm:text-5xl">
        {post.title}
      </h1>
      {post.date && (
        <p className="mt-5 text-sm text-muted">{formatDate(post.date)}</p>
      )}

      {/* The words you wrote, turned into a web page.
          How they look is set by .post-body in app/globals.css. */}
      <div
        className="post-body mt-12"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <p className="mt-16 border-t border-line pt-8 text-sm">
        <a href="/blog" className="text-brand hover:underline">
          All writing
        </a>
      </p>
    </article>
  );
}
