import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
// Fonts are vendored via next/font/local: fonts.gstatic.com outages failed CI
// builds twice on 2026-08-15, so builds must not fetch fonts. Variable woff2,
// latin subset, downloaded from the Google Fonts CSS API at the exact axis
// ranges each face uses. Forks: swap the files in app/fonts when restyling.
import localFont from "next/font/local";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { InteractionTracker } from "@/components/tracking/InteractionTracker";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { AttributionTracker } from "@/components/ui/AttributionTracker";
import { WebMcp } from "@/components/seo/WebMcp";
import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";
import "./globals.css";

// Analytics IDs: prefer siteConfig, fall back to env vars at runtime.
// Production-only by design: localhost + Vercel preview deploys never load
// analytics so we don't pollute the photographer's data with test traffic.
// VERCEL_ENV is "production" | "preview" | "development" on Vercel; undefined
// locally. Missing ID still no-ops gracefully — never blocks the build/launch.
const IS_PRODUCTION = process.env.VERCEL_ENV === "production";
const GTM_ID = IS_PRODUCTION
  ? siteConfig.analytics?.gtmId || process.env.NEXT_PUBLIC_GTM_ID
  : undefined;
const GA_ID = IS_PRODUCTION
  ? siteConfig.analytics?.gaId || process.env.NEXT_PUBLIC_GA_ID
  : undefined;

/** Scaffold type — intentional, neutral, not the Playfair “luxury default”.
 *  Forks that want a luxe serif pair should swap fonts here after picking a
 *  palette pack (see lib/themes/README.md). */
const sourceSerif = localFont({
  src: [
    { path: "./fonts/source-serif-4-normal.woff2", weight: "200 900", style: "normal" },
    { path: "./fonts/source-serif-4-italic.woff2", weight: "200 900", style: "italic" },
  ],
  variable: "--font-source-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const sourceSans = localFont({
  src: [{ path: "./fonts/source-sans-3-normal.woff2", weight: "200 900", style: "normal" }],
  variable: "--font-source-sans",
  display: "swap",
});

// viewport-fit=cover lets content honor iOS safe areas (notch / home indicator);
// components opt in with env(safe-area-inset-*) padding (footer, sticky CTA).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalBaseUrl()),
  title: {
    default: siteConfig.brand.name,
    template:
      siteConfig.seo.titleTemplate ?? `%s | ${siteConfig.brand.name}`,
  },
  description: siteConfig.seo.description,
  // openGraph.images falls through to app/opengraph-image.tsx (auto-generated).
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${sourceSans.variable}`}>
      <head>
        {/*
          Preconnect to GoHighLevel — first contact-form submission hits
          services.leadconnectorhq.com. Resolving TLS + DNS during idle
          page load saves ~100-200ms off the first submit.
        */}
        <link
          rel="preconnect"
          href="https://services.leadconnectorhq.com"
          crossOrigin="anonymous"
        />
        {/*
          Preconnect to GTM only when actually loading it. GTM script fetches
          additional resources from googletagmanager.com on init — preconnect
          shaves ~100ms off the first paint after script execution.
        */}
        {GTM_ID && (
          <>
            <link
              rel="preconnect"
              href="https://www.googletagmanager.com"
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {/*
          Fail-open for scroll entrances when scripting never runs at all.
          AnimateOnScroll renders opacity:0 and relies on JS to reveal it, so
          without this a no-JS reader gets a blank page with all the copy
          technically present. Inline styles need !important to override.
        */}
        <noscript>
          <style>{`[data-animate-on-scroll]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      <body>
        {/* Skip nav — first element in body, visible on focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-(--color-ink) focus:text-(--color-cream) focus:text-xs focus:uppercase focus:tracking-widest focus:border focus:border-(--color-cream)"
        >
          Skip to main content
        </a>
        <AttributionTracker />
        {GTM_ID && (
          <Suspense fallback={null}>
            <PageViewTracker />
            <InteractionTracker />
          </Suspense>
        )}
        <WebMcp />
        {/* LazyMotion + strict: tree-shakes ~25KB by only bundling
            the domAnimation feature pack. `strict` enforces `m.*` (not
            `motion.*`) so missing features fail at compile time, not runtime. */}
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </LazyMotion>
        {/* GA4 only loads when GA_ID set AND GTM is not — most setups load GA
            via GTM instead of duplicating it. */}
        {GA_ID && !GTM_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
