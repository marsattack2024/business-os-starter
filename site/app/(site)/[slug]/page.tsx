/**
 * Migrated landing page.  ── PLUMBING permanent · STYLING temporary ──
 * The neutral look + .post-prose styling are PLACEHOLDERS; a future client build
 * may use a completely different token system. Restyle freely — just keep the
 * loader (getPage), JSON-LD (WebPage + Breadcrumb), and metadata intact.
 * See CLAUDE.md → "Blog & landing plumbing".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/schema";
import { getPage, getPageSlugs } from "@/lib/pages";
import { getCanonicalBaseUrl } from "@/lib/site-url";

// Migrated landing/marketing pages, served at their original slug. Static
// routes (/blog, /thank-you, …) take precedence over this dynamic segment.
export function generateStaticParams() {
  return getPageSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false; // unknown slugs → 404

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return buildPageMetadata({
    title: page.title,
    description: page.description || undefined,
    path: `/${page.slug}`,
    image: page.heroImage || undefined,
    noIndex: page.status === "noindex",
  });
}

export default async function LandingPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  const base = getCanonicalBaseUrl();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: `${base}/` },
          { name: page.title, url: `${base}/${page.slug}` },
        ])}
      />
      <JsonLd
        data={buildWebPageSchema({
          name: page.title,
          description: page.description || undefined,
          url: `${base}/${page.slug}`,
          image: page.heroImage || undefined,
        })}
      />
      <article className="bg-(--color-cream) px-6 pb-24 pt-16 text-(--color-ink) md:pt-20">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-normal leading-tight md:text-6xl">
            {page.title}
          </h1>
          {page.description ? (
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-(--color-muted) md:text-base">
              {page.description}
            </p>
          ) : null}
        </header>

        <div
          className="post-prose mx-auto mt-12 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />

        <div className="mx-auto mt-16 max-w-2xl border-t border-(--color-border) pt-10 text-center">
          <p className="font-serif text-2xl md:text-3xl">Ready to work together?</p>
          <Link
            href="/#contact"
            className="mt-6 inline-flex items-center justify-center border border-(--color-ink) px-8 py-4 text-xs font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-(--color-ink) hover:text-(--color-cream)"
          >
            Inquire
          </Link>
        </div>
      </article>
    </>
  );
}
