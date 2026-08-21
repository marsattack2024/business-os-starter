import type { ReactNode } from "react";
import type { SiteQuiz } from "@/lib/quiz/types";
import { defaultQuizContent } from "@/lib/quiz.content";

/**
 * SITE CONFIG — single source of truth for branding & top-level content.
 *
 * To fork this template for a new client:
 *   1. Duplicate the repo
 *   2. Edit this file (brand name, hero copy, socials, etc.)
 *   3. Drop the client's images into /public/
 *   4. Set NEXT_PUBLIC_SITE_URL + NEXT_PUBLIC_SITE_NAME on Vercel
 *   5. Set GHL_PIT_TOKEN + GHL_LOCATION_ID for the contact form
 *
 * Section-level content (FAQs, testimonials, process steps, etc.) lives
 * inside each section component as DEFAULT_* exports. Override per-page
 * by passing props, OR edit the defaults in-place for a permanent change.
 */

export interface SiteSocial {
  label: string;
  href: string;
}

export interface SiteHero {
  eyebrow?: string;
  headline: ReactNode;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  imagePositionMobile?: string;
  imagePositionDesktop?: string;
}

export interface SiteBookingCTA {
  headline: ReactNode;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SiteAnnouncement {
  /** Short text — keep under ~60 chars. */
  text: string;
  /** Optional inline link. */
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SiteImage {
  src: string;
  alt: string;
  /** Optional CSS object-position (e.g. "center 25%"). */
  position?: string;
}

export interface SiteImageQuote extends SiteImage {
  quote: string;
  attribution?: string;
  /** Horizontal alignment of the quote within the image. */
  align?: "left" | "center" | "right";
}

export interface SiteImages {
  /** Bio portrait — used by MeetPhotographer when no override is passed. */
  portrait: SiteImage;
  /** Image-quote breakers — sprinkled between cream sections for rhythm. */
  imageQuotes: SiteImageQuote[];
}

export interface SiteAnalytics {
  /**
   * Google Tag Manager container ID (GTM-XXXXXXX). When set, the layout
   * renders <GoogleTagManager /> from @next/third-parties.
   * Falls back to env var NEXT_PUBLIC_GTM_ID at runtime.
   */
  gtmId?: string;
  /**
   * Google Analytics 4 measurement ID (G-XXXXXXXXXX). Most setups should
   * use GTM instead and load GA from there — only set this if you're
   * loading GA4 directly without GTM.
   * Falls back to env var NEXT_PUBLIC_GA_ID at runtime.
   */
  gaId?: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline?: string;
    /**
     * Photographer / owner name — rendered in the MeetPhotographer section.
     * Kept here (not hardcoded in the component) so it's part of the single
     * source of truth. Falls back to `name` for owner-operator studios.
     */
    photographer?: string;
    /**
     * Business niche/category (e.g. "Portrait Studio", "Newborn Photography",
     * "Branding Studio"). Used by the OG image eyebrow and the agent (AEO)
     * descriptors so a non-portrait client isn't mislabeled.
     */
    category?: string;
    /** Price positioning for LocalBusiness schema ($, $$, $$$, $$$$). */
    priceRange?: string;
    /**
     * Starting "from" price (digits only, e.g. "350") for the homepage Service
     * Offer → "from $X" in search/AI results. Leave unset to omit the Offer.
     * Outward-facing + Google-consequential — set only a client-confirmed number.
     */
    startingPrice?: string;
    phone?: string;
    email?: string;
    /**
     * Pre-filled subject line for every `mailto:` link the site renders.
     *
     * A blank compose window asks the visitor to name their own subject before
     * they can write the thing they wanted to say, and a share of them abandon
     * right there. Leave unset to render a plain `mailto:` with no subject.
     *
     * NOT applied to `.well-known/security.txt`, which is a machine-readable
     * contact and should stay a bare address.
     */
    emailSubject?: string;
    location?: {
      city: string;
      state: string;
      address?: string;
      zip?: string;
      /** Google Maps embed / place URL for hasMap on LocalBusiness schema. */
      mapUrl?: string;
      /**
       * City-level coordinates → GeoCoordinates on LocalBusiness schema.
       * Use a CITY centroid for privacy-sensitive studios (boudoir / in-home) —
       * never the home/studio street address.
       */
      geo?: { latitude: number; longitude: number };
    };
    /**
     * Service radius for areaServed on LocalBusiness + Service schema (local AEO).
     * List the city, surrounding metro cities, county, and state.
     * Empty array = omit areaServed (fine for templates / early forks).
     */
    serviceAreas?: string[];
    /**
     * Operating hours → openingHoursSpecification on LocalBusiness schema.
     * Each entry: `days` (schema.org DayOfWeek names) + `opens`/`closes` as
     * "HH:MM" (24h). Omit entirely for a by-appointment studio that does not
     * publish set hours.
     */
    hours?: Array<{ days: string[]; opens: string; closes: string }>;
    /**
     * Aggregate review numbers → `aggregateRating` on LocalBusiness schema.
     *
     * ONLY set this from the studio's real, current Google Business Profile
     * numbers. Never estimate, round up, or invent a rating to "have stars" —
     * fabricated review markup violates Google's structured-data policy and
     * risks a manual action against the whole domain.
     *
     * Also set expectations correctly before wiring this: Google does NOT
     * award star rich results for self-serving reviews, meaning a business
     * marking up its own rating on its own site. Stars in Search and Maps come
     * from the Google Business Profile, not from this field. The reason to
     * populate it is answer engines, which read JSON-LD directly and will cite
     * the rating when summarizing the studio.
     *
     * `source` records where the numbers came from and when, so the next
     * person can tell a verified number from a stale one.
     */
    reviews?: { ratingValue: string; reviewCount: string; source?: string };
  };
  seo: {
    baseUrl: string;
    description: string;
    /**
     * Facebook / Open Graph / Twitter share photo — a real, tasteful session
     * photo (ideally landscape ~1200×630-friendly). Required before launch.
     * NOT a logo, NOT a blurred wordmark, NOT the typographic
     * `/opengraph-image` card. Wired by `lib/seo.ts` when per-page `image`
     * is omitted. Leave unset only while placeholders are still in place.
     */
    defaultOgImage?: string;
    titleTemplate?: string;
    /**
     * AI bot crawling policy (consumed by robots.ts).
     * Recommendation: allow search bots (so AI search engines cite the site)
     * and block training bots (so the photographer's images aren't scraped
     * into model training corpora).
     */
    aiBotPolicy?: {
      allowSearch: boolean;
      allowTraining: boolean;
    };
  };
  socials: SiteSocial[];
  /**
   * Secondary footer links (Privacy, Terms, Sitemap, etc.). Omit or pass an
   * empty array to hide the "Quick Links" column entirely.
   */
  footerLinks?: SiteSocial[];
  /** Optional thin top bar (scarcity / launch / seasonal). Omit to hide entirely. */
  announcement?: SiteAnnouncement;
  hero: SiteHero;
  bookingCTA?: SiteBookingCTA;
  /**
   * Canonical asset registry. Sections that don't take their own image
   * props pull from here. Hero image lives on `hero.imageSrc` (it's part
   * of hero copy, not a reusable asset).
   */
  images: SiteImages;
  /**
   * Optional analytics IDs. Both fall back to env vars at runtime
   * (NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA_ID) so you can rotate per
   * environment without redeploying code.
   */
  analytics?: SiteAnalytics;
  /**
   * Optional self-hosted quiz funnel (Typeform-style challenge quiz). Ships
   * DISABLED by default with niche-neutral placeholder copy; a fork swaps in the
   * client's authored QuizOutput, sets `enabled: true` (or
   * NEXT_PUBLIC_QUIZ_ENABLED="true"), points `background.imageSrc` at a real
   * image, and fills `thankYouPage` / `schedulerEmbedUrl`. See
   * `docs/quiz-engine.md`. Colors come from the --color-ink/cream/accent design
   * tokens via `theme.mode` — no hex needed.
   */
  quiz?: SiteQuiz;
  /**
   * Multiple quiz variations on ONE site (different offers per genre/service
   * page or subdomain), all reusing the same in-site engine. When set, this
   * takes precedence over `quiz`. Each entry needs a unique `id` (+ optional
   * `slug` for its `/quiz/<slug>` URL); flag one `default: true` for `/quiz` and
   * the global popup, and give each its own `showOn` so the popup arms the right
   * offer per page. Frequency caps are per-`id`, so variations never collide.
   */
  quizzes?: SiteQuiz[];
}

export const siteConfig: SiteConfig = {
  brand: {
    name: "[Studio Name]",
    tagline:
      "[City] portrait and boudoir photography for the people who keep putting themselves last.",
    photographer: "[Photographer Name]",
    category: "Portrait Studio",
    priceRange: "$$$",
    phone: "(555) 000-0000",
    email: "hello@yourdomain.com",
    location: {
      city: "[City]",
      state: "[ST]",
      // address and zip intentionally omitted on the base template (placeholder brand).
      // mapUrl: "https://maps.google.com/?q=...",
    },
    // Service radius for areaServed (local AEO). Fill in after forking:
    //   e.g. ["Springfield", "Shelby County", "Capital City", "Metro Area", "ST"]
    serviceAreas: [],
  },
  seo: {
    baseUrl:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://yourdomain.com",
    // Homepage title pattern (Liberation-style): "{City} Boudoir Photography"
    // then titleTemplate appends "| {Brand}". Never lead with the brand alone.
    description:
      "[City] boudoir and portrait photography. Guided sessions, same-week delivery, every body welcome.",
    // Set `defaultOgImage` to a Facebook-safe real photo during asset intake
    // (e.g. "/images/hero.webp"). Until then, pages fall back to the generated
    // typographic card at /opengraph-image — never ship a logo as the share image.
    titleTemplate: "%s | [Studio Name]",
    aiBotPolicy: {
      allowSearch: true,
      allowTraining: false,
    },
  },
  socials: [
    { label: "Instagram", href: "#" },
    { label: "Pinterest", href: "#" },
    { label: "TikTok", href: "#" },
  ],
  // Add legal links only after approved pages exist. A broken or placeholder
  // privacy/terms route is worse than no legal footer link on the base template.
  footerLinks: [{ label: "Sitemap", href: "/sitemap.xml" }],
  announcement: {
    text: "Limited spots available for 2026",
    ctaLabel: "Inquire Today",
    ctaHref: "#contact",
  },
  hero: {
    eyebrow: "[City] Boudoir Photography",
    headline: (
      <>
        Portraits, For The People Who Don&apos;t Feel{" "}
        <em className="italic">&ldquo;Ready&rdquo;</em>… Yet
      </>
    ),
    subline:
      "A boutique portrait and editorial studio for people ready to see themselves the way the world already does.",
    ctaLabel: "Inquire Today",
    ctaHref: "#contact",
    imageSrc: "/placeholder/hero.svg",
    imageAlt:
      "Portrait photography session, editorial light, intimate moment captured by a real photographer",
    imagePositionMobile: "center 15%",
    imagePositionDesktop: "62% 15%",
  },
  bookingCTA: {
    headline: (
      <>
        Spots Are Filling Fast for{" "}
        <em className="italic">Spring &amp; Summer 2026</em>
      </>
    ),
    body: "I take on a limited number of portrait sessions each month to ensure every client gets my full attention. Once the calendar fills, it fills. Don't wait and wonder, reach out today to hold your date.",
  },
  analytics: {
    // Leave undefined to fall back to env vars. Set explicit IDs here if you
    // want them committed to the repo (most clients don't — env is safer).
  },
  images: {
    portrait: {
      src: "/placeholder/portrait.svg",
      alt: "Photographer portrait",
    },
    // ImageQuote breakers are opt-in. Add up to 3 entries to weave evocative
    // pull-quotes between cream sections. The homepage renders each slot
    // conditionally, so an empty array simply omits them.
    //
    // RHYTHM NOTE: the homepage already has dark sections at Hero, SocialProofStrip,
    // MeetPhotographer(dark variant), TestimonialsCarousel, UrgencyBlock, and
    // BookingUrgencyCTA. ImageQuotes also render dark (image + heavy overlay),
    // so use them sparingly — adding all 3 stacks the dark count. Pattern that
    // reads best: 2 imageQuotes (slots 0 and 1), skip slot 2.
    //
    // IMAGE SELECTION: pick editorial-quality photos with a clear focal area
    // OUT of the text path (`position` lets you nudge — `"center 30%"` pulls the
    // subject up so the centered overlay text doesn't land on a face). Avoid:
    // - busy backgrounds that fight the quote
    // - subjects with masks/sunglasses (face is the emotional anchor)
    // - tight crops that look bad at 100vw width
    //
    // Example:
    //   { src: "/images/portrait-01.webp", alt: "...", quote: "...",
    //     attribution: "Portrait Session Client", align: "left",
    //     position: "center 30%" },
    imageQuotes: [],
  },
  // Self-hosted quiz funnel. DISABLED by default — a fork enables it after
  // swapping the placeholder content + image. Token-driven theme (no hex):
  // `mode: "light"` = ink text on a light scrim; "dark" = the inverse. Replace
  // `background.imageSrc` with a real /images/* path and (optionally) add one
  // `statementImages` entry per main question. See docs/quiz-engine.md.
  quiz: {
    id: "studio-challenge",
    enabled: false,
    content: defaultQuizContent,
    theme: {
      font: "var(--font-serif), Georgia, serif",
      mode: "light",
      modeMobile: "dark",
    },
    background: {
      // Placeholder — replace with a real, no-face / 3-4-length image.
      imageSrc: "/placeholder/hero.svg",
      opacity: 1,
      // Readable cream scrim (not pure white) — forks can tune per photo.
      overlayStrength: 80,
      overlayColor: "241, 236, 227",
      gradientOverlay: true,
    },
    // One image per main question (index-aligned). Null = no per-question image.
    statementImages: [null, null, null, null],
    showOn: ["/"],
    triggers: {
      exitIntent: true,
      delaySeconds: 12,
      scrollDepthPct: 55,
      seenCooldownDays: 3,
      submittedCooldownDays: 30,
      // Defense-in-depth backstop for the homepage-only rule above: even if
      // `showOn` is widened, the popup must NEVER auto-open on a thank-you,
      // pricing, scheduling, or promo/campaign page (substring match on the
      // path). When you add a client-specific funnel page (e.g. "40-over-40",
      // "bridal-...-sale"), add its slug here too. A promo page with its OWN
      // quiz variation overrides this — its `showOn` wins in
      // getPopupQuizForPath and it carries its own blockedPathSegments.
      blockedPathSegments: [
        "thank-you", // covers /thank-you, /quiz-thank-you, *-thank-you
        "pricing",
        "schedule", // also matches /scheduling
        "booking",
        "promo",
        "campaign",
      ],
    },
    standalone: { backdrop: "image" },
    redirectTo: "/quiz-thank-you",
    navCta: "Claim Your Offer", // standout nav button → /quiz (renders once the quiz is enabled)
    // `partials: true` also sends the email-capture (abandoned) quiz stage to
    // GHL, tagged `quiz-abandoned`, so an abandoner workflow can nudge people who
    // started the quiz but didn't finish. A partial never carries `quiz`, so it
    // never enters the booked-lead automations (which trigger on `quiz`). New
    // sites scaffolded from this template inherit abandoned-lead capture.
    delivery: { ghl: true, webhook: false, partials: true },
    // Fill these for the live booking embed + branded thank-you copy.
    thankYouPage: {},
    schedulerEmbedUrl: "",
    redemptionVideoUrl: "",
  },
};
