import Link from "next/link";

/**
 * The visible breadcrumb trail, e.g. Home / Family Portraits.
 *
 * Deliberately markup only. The BreadcrumbList JSON-LD stays page-side in
 * `buildBreadcrumbSchema` (lib/schema.ts) so the machine-readable trail and the
 * human one can be read next to each other at the call site; a component that
 * quietly emitted its own <script> would make a page's structured data depend
 * on where a design element happened to be placed. Pass the same trail to both
 * and they cannot drift.
 *
 * Server component with no client JavaScript, like the rest of the kit: a list
 * of links needs no hydration boundary. The type scale is the kit's label voice
 * (`Eyebrow`), so a trail reads as studio furniture rather than a browser chrome
 * artefact. Layout is the page's job — pass `className` for the spacing the band
 * around it needs.
 */
export function Breadcrumbs({
  trail,
  onDark = false,
  className = "",
}: {
  trail: { name: string; href: string }[];
  onDark?: boolean;
  className?: string;
}) {
  if (trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className || undefined}>
      <ol
        className={`flex flex-wrap items-center gap-2 text-eyebrow font-semibold uppercase tracking-(--tracking-label) ${
          onDark ? "text-(--color-on-dark-muted)" : "text-(--color-muted)"
        }`}
      >
        {trail.map((crumb, i) => (
          <li key={`${i}-${crumb.href}`} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>·</span>}
            {i < trail.length - 1 ? (
              <Link
                href={crumb.href}
                className={`transition-colors ${
                  onDark
                    ? "hover:text-(--color-accent-light)"
                    : "hover:text-(--color-accent-text)"
                }`}
              >
                {crumb.name}
              </Link>
            ) : (
              /* The current page is not a link to itself. `aria-current` is what
                 tells a screen reader which crumb is where the reader already is. */
              <span
                aria-current="page"
                className={onDark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"}
              >
                {crumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
