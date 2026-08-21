import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui";

interface SplitSectionProps {
  imageSrc: string;
  imageAlt: string;
  eyebrow?: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  reverse?: boolean;
}

export function SplitSection({
  imageSrc,
  imageAlt,
  eyebrow,
  headline,
  body,
  ctaLabel,
  ctaHref = "#",
  reverse = false,
}: SplitSectionProps) {
  return (
    <section className="grid md:grid-cols-2 min-h-[var(--min-h-split)]">
      {/* Image */}
      <AnimateOnScroll
        from={reverse ? "right" : "left"}
        className={`relative min-h-[var(--min-h-image-col)] md:min-h-full bg-(--color-image-loading) ${reverse ? "md:order-2" : ""}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </AnimateOnScroll>

      {/* Text */}
      <AnimateOnScroll
        from={reverse ? "left" : "right"}
        delay={120}
        className={`flex flex-col justify-center gap-6 px-10 py-16 md:px-16 bg-(--color-cream) ${
          reverse ? "md:order-1" : ""
        }`}
      >
        {eyebrow && (
          <span className="text-eyebrow uppercase tracking-[0.2em] text-(--color-muted)">
            {eyebrow}
          </span>
        )}
        <h2 className="font-serif text-4xl font-normal leading-tight text-(--color-ink) md:text-5xl">
          {headline}
        </h2>
        <p className="text-body text-(--color-muted) max-w-sm">{body}</p>
        {ctaLabel && (
          <div>
            <Button variant="ghost" href={ctaHref}>{ctaLabel}</Button>
          </div>
        )}
      </AnimateOnScroll>
    </section>
  );
}
