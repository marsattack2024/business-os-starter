import Image from "next/image";
import { HeroOverlay } from "./HeroOverlay";

interface HeroProps {
  eyebrow?: string;
  headline: React.ReactNode;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  imagePositionMobile?: string;
  imagePositionDesktop?: string;
}

export function Hero({
  eyebrow,
  headline,
  subline,
  ctaLabel,
  ctaHref,
  imageSrc,
  imageAlt,
  imagePositionMobile = "center 15%",
  imagePositionDesktop = "62% 15%",
}: HeroProps) {
  return (
    <section
      className="relative w-full min-h-[var(--min-h-hero)] flex items-end overflow-hidden bg-(--color-ink)"
      style={
        {
          "--hero-position-mobile": imagePositionMobile,
          "--hero-position-desktop": imagePositionDesktop,
        } as React.CSSProperties
      }
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[var(--hero-position-mobile)] md:object-[var(--hero-position-desktop)]"
      />

      {/* Desktop: left-to-right gradient — darkness sits behind left-aligned text */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
      {/* Mobile: bottom-up gradient — darkness sits behind centered text at the bottom */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      {/* Bottom vignette (both viewports, stronger on mobile already covered above) */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Client component handles motion entrance animation */}
      <HeroOverlay
        eyebrow={eyebrow}
        headline={headline}
        subline={subline}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
      />
    </section>
  );
}
