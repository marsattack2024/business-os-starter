import Link from "next/link";
import { isInternalRoute } from "@/lib/links";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  /**
   * When set, renders the button as a navigation element. Internal routes
   * (`/...`, no file extension) use next/link for SPA navigation; hashes,
   * tel:/mailto:, externals, and asset URLs fall through to a plain anchor.
   *
   * This is the supported way to make a button navigate — never wrap a
   * <Button> in an <a>/<Link> (invalid <a><button> nesting).
   */
  href: string;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>["rel"];
  "aria-label"?: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Shared (server-renderable) component — no "use client", no framer-motion.
// The press/hover micro-interaction is pure CSS (`hover:scale`/`active:scale`),
// which the global prefers-reduced-motion block neutralizes. This keeps every
// CTA out of the client bundle (the component is used many times per page).
const baseStyles =
  "inline-flex items-center justify-center tracking-widest uppercase text-xs font-medium border cursor-pointer transition-[color,background-color,transform] duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-cream)";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-(--color-cream) text-(--color-ink) border-(--color-ink) hover:bg-(--color-ink) hover:text-(--color-cream)",
  ghost:
    "bg-transparent text-(--color-ink) border-(--color-ink) hover:bg-(--color-ink) hover:text-(--color-cream)",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if ("href" in props && props.href) {
    const { href, target, rel } = props;
    return isInternalRoute(href) ? (
      <Link href={href} className={classes} aria-label={props["aria-label"]}>
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        aria-label={props["aria-label"]}
        className={classes}
      >
        {children}
      </a>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...buttonProps } = props;
  void _v; void _s; void _c; void _ch;
  return (
    <button className={classes} {...(buttonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
