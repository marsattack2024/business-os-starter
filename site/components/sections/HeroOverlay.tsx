"use client";
import { m } from "framer-motion";

interface HeroOverlayProps {
  eyebrow?: string;
  headline: React.ReactNode;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
}

export function HeroOverlay({ eyebrow, headline, subline, ctaLabel, ctaHref }: HeroOverlayProps) {
  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 pb-16 md:pb-28 flex justify-center md:justify-start">
      <m.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg flex flex-col gap-5 text-center md:text-left items-center md:items-start"
      >
        {eyebrow && (
          <span className="text-eyebrow uppercase tracking-[0.25em] text-white/80 font-medium">
            {eyebrow}
          </span>
        )}

        <h1 className="font-serif text-[clamp(2.25rem,6vw,3.75rem)] font-normal leading-[1.1] text-white">
          {headline}
        </h1>

        <p className="text-body leading-relaxed text-white/85 max-w-sm">
          {subline}
        </p>

        <div className="pt-2">
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center tracking-widest uppercase text-xs font-medium border border-white/40 text-white px-8 py-4 hover:bg-white hover:text-(--color-ink) transition-colors duration-300"
          >
            {ctaLabel}
          </a>
        </div>
      </m.div>
    </div>
  );
}
