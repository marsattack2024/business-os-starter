import { ServicePage } from "@/components/pc/ServicePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema, buildFAQSchema, buildServiceSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import { content } from "@/lib/pages/_example.content";

/**
 * EXAMPLE SERVICE-PAGE ROUTE — copy this folder, do not edit it in place.
 *
 * ── THIS ROUTE IS NOT LIVE ─────────────────────────────────────────────────
 * Next.js excludes `_`-prefixed app folders from routing, so `_example` is a
 * PRIVATE FOLDER: it is typechecked, linted and built as source, and it serves
 * no URL. That is deliberate. A shared template must not ship a live example
 * page to every fork, and an exclusion the framework enforces is safer than one
 * a maintainer has to remember. `lib/public-routes.ts` also never mentions it,
 * so it is absent from the sitemap and llms.txt independently.
 *
 * To build a real page: copy this folder to `app/(site)/<route>/`, drop the
 * underscore, copy `lib/pages/_example.content.ts` alongside it, and point the
 * import at the copy.
 *
 * ── WHAT THE ROUTE OWNS, AND WHAT IT DOES NOT ──────────────────────────────
 * A page on this system is its content module plus this JSON-LD, and nothing
 * else. Structure, band rhythm, image sizing and the mobile crops belong to
 * `components/pc/ServicePage`, which every page of this kind shares.
 *
 * LocalBusiness, Organization and WebSite are NOT emitted here. They come from
 * the site layout once per page, and a second copy under a different @id would
 * split the business into two entities.
 *
 * The FAQ array feeds `buildFAQSchema` from the SAME object the accordion
 * renders, and the breadcrumb trail is built from the same `breadcrumb` and
 * `parent` fields the visible trail reads. Neither pair can drift.
 */
export const generateMetadata = () =>
  buildPageMetadata({
    title: content.seo.title,
    description: content.seo.description,
    path: content.slug,
  });

export default function Page() {
  return (
    <>
      <JsonLd
        data={buildServiceSchema({
          name: content.headline,
          description: content.seo.description,
          url: absoluteUrl(content.slug),
        })}
      />
      <JsonLd data={buildFAQSchema(content.faqs)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: absoluteUrl("/") },
          ...(content.parent
            ? [{ name: content.parent.name, url: absoluteUrl(content.parent.href) }]
            : []),
          { name: content.breadcrumb, url: absoluteUrl(content.slug) },
        ])}
      />
      <ServicePage content={content} />
    </>
  );
}
