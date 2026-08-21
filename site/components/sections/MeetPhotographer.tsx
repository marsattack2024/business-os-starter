import Image from "next/image";
import { siteConfig } from "@/lib/site.config";
import { photographerBio } from "@/lib/content.config";

export interface MeetPhotographerProps {
  /** Eyebrow above the headline. */
  eyebrow?: string;
  /** First name (rendered italic in the headline). */
  name?: string;
  /** Body paragraphs — keep to 2-3 for rhythm. */
  bioParagraphs?: string[];
  photoSrc?: string;
  photoAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /**
   * "light" = cream bg (default; sits between other cream sections).
   * "dark"  = ink bg with cream text (use to break up long cream stretches).
   */
  variant?: "light" | "dark";
}

export function MeetPhotographer({
  eyebrow = "Meet Your Photographer",
  // Single source of truth: the photographer's name lives in siteConfig.brand,
  // not hardcoded here. Falls back to the brand name for solo/owner-operator
  // studios that don't set a separate person.
  name = siteConfig.brand.photographer ?? siteConfig.brand.name,
  bioParagraphs = photographerBio,
  photoSrc = siteConfig.images.portrait.src,
  photoAlt = siteConfig.images.portrait.alt,
  ctaLabel = "Inquire",
  ctaHref = "#contact",
  variant = "light",
}: MeetPhotographerProps = {}) {
  const isDark = variant === "dark";

  const sectionBg = isDark ? "bg-(--color-ink)" : "bg-(--color-border)/30";
  const eyebrowColor = isDark ? "text-(--color-on-dark-secondary)" : "text-(--color-accent-text)";
  const headlineColor = isDark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)";
  const bodyColor = isDark ? "text-(--color-on-dark-secondary)" : "text-(--color-muted)";
  const ctaClasses = isDark
    ? "text-(--color-on-dark-primary) border-(--color-on-dark-primary) hover:bg-(--color-on-dark-primary) hover:text-(--color-ink)"
    : "border-(--color-ink) hover:bg-(--color-ink) hover:text-(--color-cream)";

  return (
    <section
      id="about"
      className={`py-[var(--space-section-y)] px-[var(--space-section-x)] ${sectionBg}`}
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-(--color-image-loading)">
          <Image
            src={photoSrc}
            alt={photoAlt}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
        <div className="flex flex-col gap-6">
          <span className={`text-eyebrow tracking-widest uppercase ${eyebrowColor}`}>
            {eyebrow}
          </span>
          <h2
            className={`font-serif text-4xl md:text-5xl font-normal leading-tight ${headlineColor}`}
          >
            Hi, I&apos;m <em className="italic">{name}</em>
          </h2>
          {bioParagraphs.map((p, i) => (
            <p key={i} className={`text-body ${bodyColor}`}>
              {p}
            </p>
          ))}
          <a
            href={ctaHref}
            className={`self-start inline-flex items-center justify-center tracking-widest uppercase text-xs font-medium border px-6 py-3 transition-colors duration-300 ${ctaClasses}`}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
