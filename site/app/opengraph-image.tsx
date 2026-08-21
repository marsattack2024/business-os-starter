import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site.config";
import { OG_COLORS } from "@/lib/og-colors";
import { getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * Dynamic OpenGraph image — auto-generated at the edge from siteConfig.
 * Replaces the prior reference to a static /og-default.jpg that never existed.
 *
 * Pulls colors from the site's CSS primitives (not via CSS vars — those don't
 * resolve in Satori's SVG renderer; oklch() literal is supported).
 *
 * Served at /opengraph-image (and referenced automatically in metadata by
 * Next.js's file-based metadata API). Per-route overrides can add their own
 * opengraph-image file in the route segment.
 */

export const runtime = "edge";
export const alt = siteConfig.brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { cream: COLOR_CREAM, ink: COLOR_INK, accent: COLOR_ACCENT, muted: COLOR_MUTED } = OG_COLORS;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: COLOR_CREAM,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Accent vertical bar on the left */}
        <div
          style={{
            width: 16,
            height: "100%",
            background: COLOR_ACCENT,
          }}
        />

        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 96px",
            gap: 32,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: COLOR_MUTED,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {siteConfig.brand.category ?? siteConfig.brand.name}
          </div>

          {/* Brand name — large serif */}
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.05,
              color: COLOR_INK,
              fontWeight: 400,
              maxWidth: 940,
            }}
          >
            {siteConfig.brand.name}
          </div>

          {/* Tagline — italic */}
          {siteConfig.brand.tagline && (
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.4,
                color: COLOR_MUTED,
                fontStyle: "italic",
                maxWidth: 880,
              }}
            >
              {siteConfig.brand.tagline}
            </div>
          )}

          {/* Domain footer */}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLOR_MUTED,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div
              style={{
                width: 32,
                height: 1,
                background: COLOR_ACCENT,
              }}
            />
            {new URL(getCanonicalBaseUrl()).hostname.replace(/^www\./, "")}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
