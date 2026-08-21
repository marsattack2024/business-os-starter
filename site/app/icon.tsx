import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site.config";
import { OG_COLORS } from "@/lib/og-colors";

/**
 * Browser tab favicon — auto-generated from siteConfig brand name.
 * Renders the first letter of the brand on the accent color background.
 *
 * Per-route override: drop an `icon.tsx` into a route segment.
 *
 * Notes:
 * - Hex literals (not CSS vars) because Satori renders SVG, not CSS context.
 *   If the palette in globals.css changes, also update these.
 * - 32×32 is the size most browsers tab-render at. Apple touch icon is
 *   handled separately by apple-icon.tsx.
 */

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const { accent: COLOR_ACCENT, ink: COLOR_INK } = OG_COLORS;

export default async function Icon() {
  // Strip leading bracket/parens/quotes from placeholder names like "[Studio Name]"
  const stripped = siteConfig.brand.name.replace(/^[\[\(\{"']+/, "");
  const initial = (stripped.trim()[0] ?? "S").toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLOR_ACCENT,
          color: COLOR_INK,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1,
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  );
}
