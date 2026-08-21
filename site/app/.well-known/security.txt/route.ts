import { siteConfig } from "@/lib/site.config";

/**
 * security.txt (RFC 9116) — declares where to report security vulnerabilities.
 * Conventional file for security researchers; useful even for a brochure site
 * (someone discovers an XSS in the contact form, they need a way to tell you).
 *
 * Contact email defaults to siteConfig.brand.email. Override by setting
 * SECURITY_CONTACT_EMAIL in env if a separate inbox should receive reports.
 *
 * Expires field must be in the future. Refreshed annually via the rolling
 * 1-year window below.
 */

export const revalidate = 86400; // 24h

export async function GET() {
  const contactEmail =
    process.env.SECURITY_CONTACT_EMAIL ||
    siteConfig.brand.email ||
    "hello@yourdomain.com";

  // Rolling 1-year expiry. Past best practice keeps the file "fresh" for
  // researchers — a stale Expires erodes confidence the contact is monitored.
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresIso = expires.toISOString().replace(/\.\d{3}Z$/, "Z");

  const base = siteConfig.seo.baseUrl.replace(/\/+$/, "");

  const lines = [
    `Contact: mailto:${contactEmail}`,
    `Expires: ${expiresIso}`,
    "Preferred-Languages: en",
    `Canonical: ${base}/.well-known/security.txt`,
    "",
    "# Reports involving customer PII (contact form submissions, GHL contact",
    "# data) should be sent to the contact above. Please allow 72 hours for",
    "# acknowledgement.",
  ];

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
