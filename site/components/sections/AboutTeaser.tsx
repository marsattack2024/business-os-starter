import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui";

interface AboutTeaserProps {
  images: [string, string, string];
  imageAlts?: [string, string, string];
  headline: string;
  italicHeadline: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function AboutTeaser({
  images,
  imageAlts = ["Photo 1", "Photo 2", "Photo 3"],
  headline,
  italicHeadline,
  body,
  ctaLabel = "Get to Know Me",
  ctaHref = "#about",
}: AboutTeaserProps) {
  return (
    <section className="grid md:grid-cols-2 min-h-[var(--min-h-split)] bg-(--color-cream)">
      {/* Photo collage */}
      <div className="relative grid grid-cols-2 gap-3 p-10 md:p-16">
        <AnimateOnScroll delay={0} className="relative col-span-2 h-64 bg-(--color-image-loading)">
          <Image
            src={images[0]}
            alt={imageAlts[0]}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </AnimateOnScroll>
        <AnimateOnScroll delay={100} className="relative h-48 bg-(--color-image-loading)">
          <Image
            src={images[1]}
            alt={imageAlts[1]}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        </AnimateOnScroll>
        <AnimateOnScroll delay={180} className="relative h-48 mt-6 bg-(--color-image-loading)">
          <Image
            src={images[2]}
            alt={imageAlts[2]}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        </AnimateOnScroll>
      </div>

      {/* Text */}
      <AnimateOnScroll
        from="right"
        delay={80}
        className="flex flex-col justify-center gap-6 px-10 py-16 md:px-16"
      >
        <h2 className="font-serif text-5xl font-normal leading-tight text-(--color-ink) md:text-6xl">
          {headline}
          <br />
          <em className="italic">{italicHeadline}</em>
        </h2>
        <p className="text-lead leading-relaxed text-(--color-muted) max-w-sm">{body}</p>
        <div>
          <Button variant="ghost" href={ctaHref}>{ctaLabel}</Button>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
