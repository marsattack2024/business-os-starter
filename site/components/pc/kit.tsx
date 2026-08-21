import type { ReactNode } from "react";

/**
 * EDITORIAL KIT — the band-and-plane page system's primitives.
 *
 * Every page built on `ServicePage` composes from these, so the type scale,
 * band rhythm and gutters are decided once. They are server components with no
 * client JavaScript: a heading does not need a hydration boundary, and keeping
 * them server-only is what lets a long page ship almost no JS. Motion lives in
 * `Reveal`, the single client primitive, so the cost is paid exactly where it
 * buys something.
 *
 * These read `--container-editorial`, `--spacing-gutter`, `--spacing-band`,
 * `--text-display` / `--text-h2`, `--text-measure` and the colour tokens from
 * `app/globals.css`. A fork retunes the values there, never in here.
 */

export type Plane = "paper" | "paper-2" | "dark";

const PLANE_CLASS: Record<Plane, string> = {
  paper: "bg-(--color-cream) text-(--color-ink)",
  "paper-2": "bg-(--color-paper-2) text-(--color-ink)",
  dark: "bg-(--color-ink) text-(--color-on-dark-primary)",
};

/** Page-width container. One max-width and one gutter for the whole site. */
export function Wrap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-(--container-editorial) px-(--spacing-gutter) ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * A full-width horizontal band. `plane` is the rhythm contract: the page
 * alternates paper / paper-2 / dark so no three text sections read as one wall.
 */
export function Band({
  children,
  plane = "paper",
  id,
  className = "",
}: {
  children: ReactNode;
  plane?: Plane;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`py-(--spacing-band) ${PLANE_CLASS[plane]} ${
        id ? "scroll-mt-8" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

/** Small uppercase accent label that opens a section. */
export function Eyebrow({
  children,
  onDark = false,
  className = "",
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`text-eyebrow font-semibold uppercase tracking-(--tracking-label) ${
        onDark ? "text-(--color-accent-light)" : "text-(--color-accent-text)"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** Display headline. `as` keeps the document outline honest (one h1 per page). */
export function Display({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  const size = Tag === "h1" ? "text-display" : "text-h2";
  return (
    <Tag className={`font-serif font-normal text-balance ${size} ${className}`}>
      {children}
    </Tag>
  );
}

/** Body copy, held to a readable measure. */
export function Body({
  children,
  onDark = false,
  className = "",
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`text-body max-w-(--text-measure) ${
        onDark ? "text-(--color-on-dark-secondary)" : "text-(--color-ink-soft)"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * The one call to action on the page.
 *
 * A rule under uppercase letters rather than a filled button: on a page that is
 * almost entirely photograph, a solid block of colour is the loudest thing on
 * screen and it reads as an advertisement. The letterspacing opening on hover
 * is the whole interaction, and it is CSS, so this stays a server component.
 *
 * A plain anchor, not `next/link`, on purpose: these hrefs are cross-page
 * ANCHORS (`/#contact`, `/apply#form`), and a client-side navigation to a hash
 * on another route lands before the target exists. A hard load always arrives
 * at the right place.
 */
export function Cta({
  href,
  children,
  onDark = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-block border-b-[1.5px] py-3.5 text-xs font-semibold uppercase tracking-[0.17em] transition-[color,border-color,letter-spacing] duration-300 hover:tracking-[0.215em] ${
        onDark
          ? "border-current text-(--color-on-dark-primary) hover:border-(--color-accent-light) hover:text-(--color-accent-light)"
          : "border-current text-(--color-ink) hover:border-(--color-accent-text) hover:text-(--color-accent-text)"
      } ${className}`}
    >
      {children}
    </a>
  );
}

/** Vertical stack with a consistent gap. Saves a flex-col incantation per use. */
export function Stack({
  children,
  gap = "gap-5",
  className = "",
}: {
  children: ReactNode;
  gap?: string;
  className?: string;
}) {
  return <div className={`flex flex-col ${gap} ${className}`}>{children}</div>;
}

/** Eyebrow + headline + optional intro — the opening of most sections. */
export function SectionHead({
  eyebrow,
  headline,
  body,
  onDark = false,
  as = "h2",
  className = "",
}: {
  eyebrow: string;
  headline: ReactNode;
  body?: ReactNode;
  onDark?: boolean;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Stack gap="gap-[1.1rem]" className={className}>
      <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
      <Display as={as}>{headline}</Display>
      {body ? <Body onDark={onDark}>{body}</Body> : null}
    </Stack>
  );
}
