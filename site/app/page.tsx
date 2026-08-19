// ============================================================
// THIS IS YOUR HOMEPAGE. THE WHOLE THING. ONE FILE.
//
// It is split into seven sections, top to bottom, in the same order
// they appear on the screen:
//
//   1. HEADER    your business name at the top
//   2. HERO      the big headline visitors see first
//   3. SERVICES  three boxes describing what you do
//   4. PROOF     a quote from a happy customer
//   5. LATEST WRITING  your three newest blog posts
//   6. CALL TO ACTION  the final "get in touch" block
//   7. FOOTER    your name, email and the year
//
// HOW TO CHANGE THE WORDS
// Look for the placeholders in double curly braces, like
// {{HERO_HEADLINE}}. Replace the placeholder with your own words
// and KEEP THE QUOTE MARKS around it.
//
//   before:  {"{{HERO_HEADLINE}}"}
//   after:   {"Wedding photography in Austin, without the stress"}
//
// Save the file. The page in your browser updates on its own.
//
// HOW TO CHANGE THE COLORS
// Colors are not in this file. They live in app/globals.css.
// ============================================================

import { formatDate, getPosts } from "@/lib/posts";

export default function Home() {
  // Your three newest published posts. If you have not published
  // anything yet, section 5 below hides itself.
  const posts = getPosts().slice(0, 3);

  return (
    <main>
      {/* ================= 1. HEADER =================
          The thin bar across the very top of the page.
          On the left: your business name.
          On the right: a short line about what you do
          (this one hides itself on small phone screens).
      ============================================== */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-5">
          <span className="text-lg font-semibold tracking-tight">
            {"{{BUSINESS_NAME}}"}
          </span>
          <span className="hidden text-sm text-muted sm:block">
            {"{{TAGLINE}}"}
          </span>
        </div>
      </header>

      {/* ================= 2. HERO =================
          The first thing visitors see.
          Change the headline, the sentence under it, and the button.

          The headline is the single most important line on your site.
          Say what you do and who you do it for. Keep it short.

          The button has two parts:
            CTA_LABEL  the words on the button ("Book a call")
            CTA_LINK   where it sends people. This can be a booking
                       link, or "mailto:you@yourbusiness.com" to open
                       their email app.
      ============================================ */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance break-words sm:text-5xl lg:text-6xl">
          {"{{HERO_HEADLINE}}"}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {"{{HERO_SUBTEXT}}"}
        </p>
        <a
          href="{{CTA_LINK}}"
          className="mt-9 inline-flex rounded-soft bg-brand px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-brand-dark"
        >
          {"{{CTA_LABEL}}"}
        </a>
      </section>

      {/* ================= 3. SERVICES =================
          Three boxes explaining what you do.
          Each box has a short title and two or three sentences.

          Write these the way a customer would describe them,
          not the way the industry does.

          Want only two boxes? Delete one whole <article> block
          (from <article> down to </article>).
      ================================================ */}
      <section className="mx-auto max-w-5xl px-6 pb-20 sm:pb-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What we do
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-soft border border-line bg-card p-7">
            <h3 className="text-lg font-semibold">{"{{SERVICE_1_TITLE}}"}</h3>
            <p className="mt-3 leading-relaxed text-muted">
              {"{{SERVICE_1_TEXT}}"}
            </p>
          </article>

          <article className="rounded-soft border border-line bg-card p-7">
            <h3 className="text-lg font-semibold">{"{{SERVICE_2_TITLE}}"}</h3>
            <p className="mt-3 leading-relaxed text-muted">
              {"{{SERVICE_2_TEXT}}"}
            </p>
          </article>

          <article className="rounded-soft border border-line bg-card p-7">
            <h3 className="text-lg font-semibold">{"{{SERVICE_3_TITLE}}"}</h3>
            <p className="mt-3 leading-relaxed text-muted">
              {"{{SERVICE_3_TEXT}}"}
            </p>
          </article>
        </div>
      </section>

      {/* ================= 4. PROOF =================
          One quote from a real customer, and their name.

          Use their actual words. A specific, slightly awkward
          real sentence beats a polished fake one every time.
      ============================================= */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
          <div className="mx-auto h-px w-12 bg-brand" />
          <blockquote className="mt-8 text-2xl leading-snug font-medium tracking-tight text-balance break-words sm:text-3xl">
            {"{{TESTIMONIAL_QUOTE}}"}
          </blockquote>
          <p className="mt-8 text-sm text-muted">
            &mdash; {"{{TESTIMONIAL_NAME}}"}
          </p>
        </div>
      </section>

      {/* ================= 5. LATEST WRITING =================
          Your three newest blog posts, with a link to the full
          list at /blog.

          You do not type posts in here. Ask your employee to
          "write a blog post" — it saves the post into the
          content folder at the top of this project, and this
          section picks it up.

          Nothing published yet? This whole block disappears on
          its own, so the page never looks unfinished.
      ====================================================== */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Latest writing
            </h2>
            <a
              href="/blog"
              className="text-sm text-muted transition-colors hover:text-brand"
            >
              All posts
            </a>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-soft border border-line bg-card p-7 transition-colors hover:border-brand"
              >
                {post.date && (
                  <p className="text-sm text-muted">{formatDate(post.date)}</p>
                )}
                <h3 className="mt-2 text-lg font-semibold transition-colors group-hover:text-brand">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="mt-3 leading-relaxed text-muted">
                    {post.summary}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ================= 6. CALL TO ACTION =================
          The last thing visitors read before they leave.
          One headline and one button. Ask for the thing you
          actually want them to do.

          This button uses the same CTA_LABEL and CTA_LINK as
          the hero button, so change them in both places.
      ====================================================== */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="rounded-soft bg-ink px-8 py-14 text-center sm:px-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance break-words text-page sm:text-4xl">
            {"{{CLOSING_HEADLINE}}"}
          </h2>
          <a
            href="{{CTA_LINK}}"
            className="mt-8 inline-flex rounded-soft bg-brand px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-brand-dark"
          >
            {"{{CTA_LABEL}}"}
          </a>
        </div>
      </section>

      {/* ================= 7. FOOTER =================
          The bottom of the page: your business name, your email,
          and the year.

          The year updates itself every January, so leave the
          bit that says new Date().getFullYear() alone.
      ============================================== */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-ink">{"{{BUSINESS_NAME}}"}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <a
              href="mailto:{{CONTACT_EMAIL}}"
              className="transition-colors hover:text-brand"
            >
              {"{{CONTACT_EMAIL}}"}
            </a>
            <p>&copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
