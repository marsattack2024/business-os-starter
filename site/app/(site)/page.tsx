import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/Hero";
import { SocialProofStrip } from "@/components/sections/SocialProofStrip";
import { ImageQuote } from "@/components/sections/ImageQuote";
import { BookingUrgencyCTA } from "@/components/sections/BookingUrgencyCTA";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildFAQSchema,
  buildLocalBusinessSchema,
  buildServiceSchema,
  buildWebSiteSchema,
} from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";
import { faqs } from "@/lib/content.config";

// Below-fold: deferred until after hero paints
const EmpathyBlock = dynamic(() =>
  import("@/components/sections/EmpathyBlock").then((m) => ({ default: m.EmpathyBlock }))
);
const ProcessSteps = dynamic(() =>
  import("@/components/sections/ProcessSteps").then((m) => ({ default: m.ProcessSteps }))
);
const MeetPhotographer = dynamic(() =>
  import("@/components/sections/MeetPhotographer").then((m) => ({ default: m.MeetPhotographer }))
);
const IncludesGrid = dynamic(() =>
  import("@/components/sections/IncludesGrid").then((m) => ({ default: m.IncludesGrid }))
);
const GalleryGrid = dynamic(() =>
  import("@/components/sections/GalleryGrid").then((m) => ({ default: m.GalleryGrid }))
);
const TestimonialsCarousel = dynamic(() =>
  import("@/components/sections/TestimonialsCarousel").then((m) => ({ default: m.TestimonialsCarousel }))
);
const ContactForm = dynamic(() =>
  import("@/components/sections/ContactForm").then((m) => ({ default: m.ContactForm }))
);
const FAQSection = dynamic(() =>
  import("@/components/sections/FAQSection").then((m) => ({ default: m.FAQSection }))
);

export const metadata: Metadata = buildPageMetadata({
  // Main keyword first (city + service). titleTemplate appends "| [Studio Name]".
  // After fork: "Denver Boudoir Photography" → "Denver Boudoir Photography | Brand".
  title: "[City] Boudoir Photography",
  description: siteConfig.seo.description,
  path: "/",
});

/**
 * HOMEPAGE RHYTHM CONTRACT (composition is not optional)
 * -----------------------------------------------------
 * Every section has a plane: CREAM | DARK | PHOTO-DARK (full-bleed breaker).
 * Rule: never 3 cream text jobs in a row. Never 3 dark ASP / quote planes in a row.
 * ImageQuote must sit between cream jobs when present — gate on config, never invent.
 * Contact + FAQ share ONE cream close chapter (flushBottom + continueFromAbove).
 * Urgency sits BEFORE inquire (dark bridge), not after FAQ.
 * Gallery comes early (proof before process) — Logan conversion lesson.
 * WhyBook / TestimonialCards stay OFF default home (redundant cream jobs).
 * Missing assets: skip the section or leave the gated slot empty; ask the human
 * for real copy/images. Never invent quotes, prices, awards, or proof.
 *
 * Plane map (verify before reordering):
 * Hero DARK → Proof DARK(thin) → Empathy CREAM → Quote[0] PHOTO-DARK? →
 * Gallery CREAM → Process DARK → Includes CREAM → Quote[1] PHOTO-DARK? →
 * Meet CREAM → Carousel DARK → Urgency DARK(bridge) →
 * Contact+FAQ CREAM(one chapter) → Footer DARK
 */
export default function Home() {
  const base = getCanonicalBaseUrl();
  const quote0 = siteConfig.images.imageQuotes[0];
  const quote1 = siteConfig.images.imageQuotes[1];

  return (
    <>
      <JsonLd data={buildLocalBusinessSchema()} />
      <JsonLd data={buildFAQSchema(faqs)} />
      {/* Organization deliberately REMOVED — LocalBusiness now owns #org.
          WebSite.publisher still resolves correctly via the shared @id. */}
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd
        data={buildServiceSchema({
          name: `${siteConfig.brand.category ?? "Portrait"} Photography`,
          serviceType: `${siteConfig.brand.category?.toLowerCase() ?? "portrait"} photography`,
          description: siteConfig.seo.description,
          url: `${base}/`,
          image: siteConfig.images.portrait.src,
          // Emits a "from $X" Offer only when siteConfig.brand.startingPrice is set.
          ...(siteConfig.brand.startingPrice && {
            offers: { price: siteConfig.brand.startingPrice, priceCurrency: "USD" },
          }),
        })}
      />

      {/* DARK — static import, server component, LCP paints before hydration */}
      <Hero {...siteConfig.hero} />

      {/* DARK thin trust (allowed after hero; different format from full hero) */}
      <SocialProofStrip />

      {/* CREAM — emotional argument before proof visuals */}
      <EmpathyBlock />

      {/* PHOTO-DARK breaker — skip when no real quote asset */}
      {quote0 && (
        <ImageQuote
          src={quote0.src}
          alt={quote0.alt}
          quote={quote0.quote}
          attribution={quote0.attribution}
          objectPosition={quote0.position}
          align={quote0.align}
        />
      )}

      {/* CREAM — gallery early (Logan: visuals before process essay) */}
      <GalleryGrid />

      {/* DARK — how it works */}
      <ProcessSteps tone="dark" />

      {/* CREAM — what's included */}
      <IncludesGrid />

      {/* PHOTO-DARK breaker — second quote only when configured */}
      {quote1 && (
        <ImageQuote
          src={quote1.src}
          alt={quote1.alt}
          quote={quote1.quote}
          attribution={quote1.attribution}
          objectPosition={quote1.position}
          align={quote1.align}
        />
      )}

      {/* CREAM — meet the photographer (breaks quote/includes before dark proof) */}
      <MeetPhotographer variant="light" />

      {/* DARK — deep proof carousel */}
      <TestimonialsCarousel />

      {/* DARK bridge into inquire — single scarcity nudge.
          UrgencyBlock (accent band) stays OFF default home. */}
      {siteConfig.bookingCTA && <BookingUrgencyCTA {...siteConfig.bookingCTA} />}

      {/* CREAM close chapter (one plane: form + objections) → Footer DARK.
          Contact MUST surface clickable phone + email (docs/contact-standard.md).
          FAQ: no relatedLinks mini-nav; no redundant Inquire CTA (form is above). */}
      <ContactForm
        contactPhone={siteConfig.brand.phone}
        contactEmail={siteConfig.brand.email}
        contactMapsUrl={siteConfig.brand.location?.mapUrl}
        flushBottom
      />
      <FAQSection
        continueFromAbove
        relatedLinks={[]}
        footerText=""
        footerCtaLabel=""
        footerCtaHref=""
      />

      {/* WhyBook / TestimonialCards intentionally OFF default homepage —
          they restate inclusions + process + carousel proof as cream stacks.
          Components still ship under components/sections/ for forks that need
          one unique beat. Prefer editorial site sections when a stronger “why”
          moment is required. */}

      {/* Footer rendered globally by app/(site)/layout.tsx */}
    </>
  );
}
