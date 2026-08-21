import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui";
import { galleryImages as DEFAULT_GALLERY_IMAGES } from "@/lib/content.config";
import type { GalleryImage } from "./types";

export { DEFAULT_GALLERY_IMAGES };
export type { GalleryImage };

export interface GalleryGridProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  subheading?: string;
  /**
   * Images displayed in the 2-col masonry. Split evenly: first half →
   * left column, second half → right column. Pass an even-length array
   * for balanced columns.
   */
  images?: GalleryImage[];
  ctaLabel?: string;
  ctaHref?: string;
}

function GalleryColumn({
  images,
  baseDelay = 0,
}: {
  images: GalleryImage[];
  baseDelay?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {images.map((img, i) => (
        <AnimateOnScroll
          key={i}
          delay={baseDelay + i * 60}
          className={`relative w-full overflow-hidden bg-(--color-image-loading) ${img.h}`}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
        </AnimateOnScroll>
      ))}
    </div>
  );
}

export function GalleryGrid({
  eyebrow = "The Work",
  headline = (
    <>
      Real People. <em className="italic">Real Sessions.</em>
    </>
  ),
  subheading = "Not models. Not staged. Just everyday people who decided to show up for themselves.",
  images = DEFAULT_GALLERY_IMAGES,
  ctaLabel = "Inquire",
  ctaHref = "#contact",
}: GalleryGridProps = {}) {
  const mid = Math.ceil(images.length / 2);
  const leftCol = images.slice(0, mid);
  const rightCol = images.slice(mid);

  return (
    <section id="gallery" className="bg-(--color-cream) py-[var(--space-section-y)] px-[var(--space-section-x)]">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll className="text-center mb-[var(--space-heading-body-gap)]">
          <span className="text-eyebrow uppercase tracking-widest text-(--color-muted)">
            {eyebrow}
          </span>
          <h2 className="font-serif text-4xl font-normal text-(--color-ink) mt-[var(--space-heading-eyebrow-gap)] md:text-5xl">
            {headline}
          </h2>
          {subheading && (
            <p className="mt-[var(--space-subheading-gap)] text-lead text-(--color-muted) max-w-sm mx-auto">
              {subheading}
            </p>
          )}
        </AnimateOnScroll>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <GalleryColumn images={leftCol} baseDelay={0} />
          <GalleryColumn images={rightCol} baseDelay={80} />
        </div>

        {ctaLabel && ctaHref && (
          <AnimateOnScroll delay={200} className="flex justify-center mt-12">
            <Button variant="ghost" href={ctaHref}>{ctaLabel}</Button>
          </AnimateOnScroll>
        )}
      </div>
    </section>
  );
}
