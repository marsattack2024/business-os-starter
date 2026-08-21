/**
 * Section components — re-exported from one barrel for ergonomics.
 *
 * Forks can pick sections off as needed:
 *   import { Hero, FAQSection, AboutTeaser } from "@/components/sections";
 *
 * Sections marked "opt-in" below aren't wired into the default homepage
 * (`app/(site)/page.tsx`) but are template-ready — drop them in any page
 * to extend the layout. Useful for sub-pages (/about, /services) or for
 * forks that want a richer single-page composition.
 */

// ── Default homepage rhythm (see app/(site)/page.tsx) ────────────────
export { Hero } from "./Hero";
export { HeroOverlay } from "./HeroOverlay";
export { SocialProofStrip } from "./SocialProofStrip";
export { TestimonialCards } from "./TestimonialCards";
export { ImageQuote } from "./ImageQuote";
export { ProcessSteps } from "./ProcessSteps";
export { MeetPhotographer } from "./MeetPhotographer";
export { WhyBook } from "./WhyBook";
export { IncludesGrid } from "./IncludesGrid";
export { GalleryGrid } from "./GalleryGrid";
export { TestimonialsCarousel } from "./TestimonialsCarousel";
export { UrgencyBlock } from "./UrgencyBlock";
export { ContactForm } from "./ContactForm";
export { FAQSection } from "./FAQSection";
export { BookingUrgencyCTA } from "./BookingUrgencyCTA";
export { EmpathyBlock } from "./EmpathyBlock";

// ── Opt-in sections (not wired by default) ───────────────────────────
// Generic two-column image/text split — useful for service detail pages
// or as a richer alternative to MeetPhotographer.
export { SplitSection } from "./SplitSection";
// Photo-collage + intro block — pairs an editorial 3-up grid with a CTA.
// Drop above ContactForm for an additional editorial moment.
export { AboutTeaser } from "./AboutTeaser";
// Compact 3-up testimonial grid — alternative to TestimonialsCarousel
// when you want all three quotes visible at once without animation.
export { TestimonialsGrid } from "./TestimonialsGrid";

// ── Shared types ─────────────────────────────────────────────────────
export type * from "./types";
