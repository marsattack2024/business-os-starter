"use client";
import Image from "next/image";
import { m } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface ImageQuoteProps {
  src: string;
  alt: string;
  quote: string;
  attribution?: string;
  /**
   * CSS object-position for the underlying image. Lets you keep the subject
   * out of the text's path (e.g. "center 25%" pulls the focal point up).
   * Critical on portraits — text landing on a face ruins the section.
   */
  objectPosition?: string;
  /** Where the quote sits within the image. Use to alternate L/R across the page. */
  align?: "center" | "left" | "right";
}

/**
 * Full-width image with overlaid quote — used as a visual breaker between
 * text-heavy cream sections. **DO NOT place adjacent to a dark section**;
 * the overlay loses its "cutting" effect when it follows another dark
 * background. Pair with cream sections above AND below.
 */
export function ImageQuote({
  src,
  alt,
  quote,
  attribution,
  objectPosition = "center",
  align = "center",
}: ImageQuoteProps) {
  const containerAlign =
    align === "right"
      ? "items-center justify-center md:justify-end px-6 md:pr-24 lg:pr-32 md:pl-8"
      : align === "left"
        ? "items-center justify-center md:justify-start px-6 md:pl-24 lg:pl-32 md:pr-8"
        : "items-center justify-center px-6 md:px-16 lg:px-24";

  const textAlign =
    align === "center"
      ? "text-center items-center"
      : align === "right"
        ? "text-center md:text-right items-center md:items-end"
        : "text-center md:text-left items-center md:items-start";

  return (
    <div className="relative w-full h-[var(--h-breaker-sm)] md:h-[var(--h-breaker-md)] lg:h-[var(--h-breaker-lg)] overflow-hidden bg-(--color-ink)">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        style={{ objectPosition }}
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-(--color-overlay-dark-heavy)" />
      <div className={`absolute inset-0 flex ${containerAlign}`}>
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className={`max-w-xl flex flex-col gap-3 ${textAlign}`}
        >
          <blockquote className="font-serif text-base md:text-2xl lg:text-[1.7rem] italic text-(--color-on-dark-primary) leading-relaxed">
            &ldquo;{quote}&rdquo;
          </blockquote>
          {attribution && (
            <p className="text-xs tracking-widest uppercase text-(--color-on-dark-muted) mt-1">
             – {attribution}
            </p>
          )}
        </m.div>
      </div>
    </div>
  );
}
