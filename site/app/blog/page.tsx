// ============================================================
// YOUR BLOG — THE LIST OF EVERYTHING YOU HAVE PUBLISHED
//
// This page lives at /blog on your site.
//
// It reads the `content` folder at the top of this project and
// shows every file marked `published: true`. You do not add
// posts here. You write them, and they appear.
//
// See site/lib/posts.ts for the one rule that decides what
// counts as a post.
// ============================================================

import type { Metadata } from "next";
import { formatDate, getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
};

export default function BlogIndex() {
  const posts = getPosts();

  return (
    <section className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Writing
      </h1>

      {posts.length === 0 ? (
        // Nothing published yet. This message replaces the list.
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Nothing published yet. Ask your employee to write a post, and it
          shows up here.
        </p>
      ) : (
        <div className="mt-12 flex flex-col divide-y divide-line border-t border-line">
          {posts.map((post) => (
            <article key={post.slug} className="py-8">
              <a href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-brand sm:text-2xl">
                  {post.title}
                </h2>
                {post.date && (
                  <p className="mt-2 text-sm text-muted">
                    {formatDate(post.date)}
                  </p>
                )}
                {post.summary && (
                  <p className="mt-3 leading-relaxed text-muted">
                    {post.summary}
                  </p>
                )}
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
