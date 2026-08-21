import type { ServicePageContent } from "./types";

/**
 * EXAMPLE SERVICE-PAGE MODULE — copy this file, do not edit it in place.
 *
 * A worked example of `ServicePageContent` with every field filled in, so a new
 * page is a copy-and-replace rather than an invention. It renders through
 * `components/pc/ServicePage`, which owns the structure, the band rhythm, the
 * image sizing and the mobile crops.
 *
 * ── WHY THE UNDERSCORE ─────────────────────────────────────────────────────
 * `_`-prefixed files are the template's convention for content that ships but
 * is never routed (see `content/blog/_example.mdx`, `content/pages/_example.mdx`).
 * Next.js also excludes `_`-prefixed app folders from routing, which is why the
 * matching route lives at `app/(site)/_example/page.tsx` and cannot go live on a
 * fork by accident. Nothing in `lib/public-routes.ts` references either one, so
 * this page is absent from the sitemap and from llms.txt by construction rather
 * than by an exclusion someone has to remember.
 *
 * ── THE PLACEHOLDERS ARE THE POINT ─────────────────────────────────────────
 * Every bracketed token below is in the vocabulary that `scripts/guard-placeholders.mjs`
 * blocks, and any `[Bracketed]` token trips `npm run content:qa:launch`. Copy
 * this file to `lib/pages/<page>.content.ts`, and the copy has neither the
 * `_example` exemption nor the `_` routing guard: a fork that ships it unedited
 * fails its own launch gate, and a site marked `site_status: connected` cannot
 * even commit it. Replace every bracket with the studio's real words.
 *
 * ── WHAT TO CHANGE, IN ORDER ───────────────────────────────────────────────
 *   1. `slug` and `breadcrumb`, to the route this page will actually live at.
 *   2. The photo keys, to keys that exist in `lib/photos.ts` and are cleared
 *      for this page by the asset sheet.
 *   3. Every string. The copy below is scaffolding and says nothing true about
 *      any studio.
 *   4. `proof`, to real named quotes, or delete the array. An invented quote is
 *      not a placeholder, it is a fabrication.
 */
export const content: ServicePageContent = {
  slug: "/example-service-page",
  breadcrumb: "[Niche] Portraits",

  /**
   * A page under another page in the IA sets `parent`, which adds the middle
   * crumb and gives this route its link back up to its hub. A top-level genre
   * page deletes this field.
   */
  // parent: { name: "[Niche]", href: "/example-hub" },

  eyebrow: "[Studio Name]",
  headline: "[Niche] portraits in [City], [State]",
  lede: "One or two sentences saying what this is and who it is for. Not a section, and not a list of features. The reader should know within a breath whether this page is about them.",

  /**
   * `position` is only needed when the file's shape and the hero band's shape
   * disagree. A key with art-directed variants is cut to fit this band and
   * normally passes nothing.
   */
  hero: { image: "EXHERO" },

  intro: {
    title: "What a session with [Photographer Name] is actually like",
    body: [
      "The first paragraph on paper. Say the true, specific thing the reader is worried about, in the studio's own voice, before selling anything.",
      "The second paragraph earns the first. Concrete details beat adjectives here: what happens, in what order, and how long it takes.",
    ],
  },

  /**
   * 4 to 8 keys. An odd count is handled (the last tile goes full width on a
   * phone rather than stranding a hole), but an even count reads better.
   */
  gallery: ["EX01", "EX02", "EX03", "EX04"],

  sections: [
    {
      /** `id` makes a section deep-linkable, e.g. `/example-service-page#what-to-wear`. */
      id: "what-to-wear",
      title: "A section with a photograph",
      body: [
        "A section with an `image` renders as a two-column spread, photograph first on a phone and alternating sides from 1024 so a run of them reads as a spread rather than a list.",
        "Use these for the page's deeper register: a sub-genre, a package, what a reveal appointment is. Delete the array entirely if the page does not need one.",
      ],
      image: "EX01",
    },
    {
      title: "A section without one",
      body: [
        "With no `image`, the section takes the same title-left, prose-right split as the intro band. The plane it sits on is derived, not chosen: no two adjacent bands share a plane, and the component warns in development if the content shape produces a seam it cannot fix.",
        "One editorial link may sit under the last paragraph. It exists so a hub page can point down at its city page in the body copy, rather than relying on the child's own breadcrumb. One per section, deliberately.",
      ],
      /**
       * `/example-hub` deliberately does not exist. This route is never served
       * (see the header note), so the dangling target costs nothing here, and
       * leaving it obviously fake is better than pointing the demo at `/` and
       * inverting what the field is for: a hub page linking DOWN at its child.
       */
      link: { label: "Read more about [Niche] sessions", href: "/example-hub" },
    },
  ],

  /**
   * REAL, NAMED QUOTES ONLY. A quote with no name is not proof, and a page with
   * nothing real to show should ship an empty array and render no band at all.
   * The strings below are shaped like quotes so the layout can be seen; they
   * are not testimonials and must not survive a fork.
   */
  proof: [
    { quote: "[Replace with a real review, quoted exactly as the client wrote it]", name: "[Client first name and last initial]" },
    { quote: "[Replace with a real review, quoted exactly as the client wrote it]", name: "[Client first name and last initial]" },
  ],

  /**
   * 4 to 7. This same array should feed `buildFAQSchema` at the route, so the
   * visible answers and the structured ones cannot drift apart.
   */
  faqs: [
    {
      q: "What does a session cost?",
      a: "Answer the money question first and answer it honestly. It is the paragraph standing between a hesitant reader and the form, and it is the one the accordion opens by default.",
    },
    {
      q: "How long does it take?",
      a: "A real number, not a range so wide it says nothing. Include what happens before and after the session itself if those are scheduled separately.",
    },
    {
      q: "What should I bring?",
      a: "Concrete guidance the reader can act on today. If there is a wardrobe guide, say when they receive it.",
    },
    {
      q: "Where are you located?",
      a: "[City], [State], plus whatever the reader needs to know about parking, access, or travel. A page that names a city should be able to answer this.",
    },
  ],

  /** Journal posts worth reading next. Delete the array if there are none yet. */
  related: [
    { title: "[Title of a related journal post]", href: "/blog/_example" },
    { title: "[Title of a related journal post]", href: "/blog/_example" },
  ],

  /** The one destination this page pushes toward. */
  cta: { label: "Start a conversation", href: "/#contact" },

  /**
   * Read by `buildPageMetadata` at the route, never rendered by the template.
   * `description` is capped at 160 characters by `npm run content:qa`.
   */
  seo: {
    title: "[Niche] Portraits in [City], [State]",
    description:
      "One sentence a search result can show in full. Say what the page offers and where, in the studio's own words, under 160 characters.",
  },
};
