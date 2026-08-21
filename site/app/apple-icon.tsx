import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site.config";
import { OG_COLORS } from "@/lib/og-colors";

/**
 * iOS home-screen icon — 180×180. Auto-generated from siteConfig.
 * Larger size lets us add the initial + a small accent dot for distinction.
 */

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const { accent: COLOR_ACCENT, ink: COLOR_INK, cream: COLOR_CREAM } = OG_COLORS;

export default async function AppleIcon() {
  const stripped = siteConfig.brand.name.replace(/^[\[\(\{"']+/, "");
  const initial = (stripped.trim()[0] ?? "S").toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: COLOR_INK,
          color: COLOR_CREAM,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 110,
          fontWeight: 400,
          lineHeight: 1,
          position: "relative",
        }}
      >
        <span style={{ display: "flex" }}>{initial}</span>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLOR_ACCENT,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
