import type { PhotoKey } from "@/lib/photos";

/**
 * THE SERVICE-PAGE CONTRACT.
 *
 * A studio's genre pages (boudoir, family, headshots, branding, pets) and its
 * city pages are the same page with different words and different photographs.
 * They therefore share ONE render path — `components/pc/ServicePage` — and each
 * route ships nothing but a content module of this shape plus its JSON-LD.
 * Structure, breadcrumbs, band rhythm, image sizing and the mobile crops are
 * decided once, here and in that component, instead of once per page.
 *
 * This type is FROZEN: every page module is written against these exact names.
 * Adding an optional field is safe; renaming or removing one is not.
 *
 * Note on the folder: `lib/pages.ts` (the migrated-landing-page loader) is a
 * separate, older neighbour. A file and a directory of the same name coexist
 * fine — `@/lib/pages` still resolves to the loader, `@/lib/pages/*` to these
 * content modules — so neither moves.
 *
 * See `lib/pages/_example.content.ts` for a filled-in module to copy.
 */
export type ServiceFaq = { q: string; a: string };

export type ServicePageContent = {
  /** Route this page lives at, leading slash. Also the breadcrumb's own href. */
  slug: `/${string}`;
  /** The page's name in the trail — "Family Portraits", not "Home / Family". */
  breadcrumb: string;
  /**
   * One optional crumb BETWEEN Home and this page, for a route that sits under
   * another one in the information architecture rather than beside it.
   *
   * A city page is the usual case: `/baltimore-headshot-photographer` is a
   * child of the `/headshots` hub, and a two-crumb trail would say otherwise
   * while also leaving the city page with no link back up. Optional rather than
   * hardcoded because the trail belongs to the page's place in the IA, which is
   * a decision each build makes for itself.
   *
   * The route passes the same shape to `buildBreadcrumbSchema`, so the visible
   * trail and the machine-readable one are written from one object.
   */
  parent?: { name: string; href: `/${string}` };
  /** Accent label above the h1, reused as the kicker on the closing CTA band. */
  eyebrow: string;
  /** The h1. One per page. */
  headline: string;
  /** The paragraph under the h1. One sentence or two, not a section. */
  lede: string;
  /**
   * The opening photograph.
   *
   * `position` is `object-position`, and it is only needed when the file's
   * shape and the hero band's shape disagree. Art-directed keys are cut to fit
   * this band and normally pass nothing.
   */
  hero: { image: PhotoKey; position?: string };
  /** The first thing said on paper: what this is, in the studio's voice. */
  intro: { title: string; body: string[] };
  /** 4 to 8 keys, all viewed, all cleared for this page by the asset sheet. */
  gallery: PhotoKey[];
  /**
   * Optional deeper sections. `id` makes one deep-linkable (`#senior-pets`);
   * `image` gives it a two-column spread instead of a single measure.
   *
   * `link` is ONE editorial link out of the section, set under its last
   * paragraph in the journal's own in-body link style. It exists because a hub
   * page has to be able to point DOWN at its city page in the body copy, not
   * only through a breadcrumb the city page renders on itself: a route whose
   * only inbound link is a child's own trail is an orphan in the link graph.
   * `body` is `string[]` so that content modules stay `.ts` with no JSX in
   * them, which means a link cannot sit mid-sentence; a named line under the
   * paragraph it belongs to is the honest version of the same move. One per
   * section, deliberately: a run of them is a link farm.
   */
  sections?: {
    id?: string;
    title: string;
    body: string[];
    image?: PhotoKey;
    link?: { label: string; href: `/${string}` };
  }[];
  /** Real, named quotes only. Never a paraphrase, never an anonymous one. */
  proof: { quote: string; name: string }[];
  /** 4 to 7. Also the source of the page's FAQPage schema, so answers are real. */
  faqs: ServiceFaq[];
  /** Journal posts worth reading next. */
  related: { title: string; href: string }[];
  /** The one destination this page pushes toward. */
  cta: { label: string; href: string };
  /**
   * Fed to `buildPageMetadata` by the route, not rendered by the template.
   * `description` is capped at 160 characters by `npm run content:qa`.
   */
  seo: { title: string; description: string };
};
