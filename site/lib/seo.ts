import type { Metadata } from "next";
import { siteConfig } from "@/lib/site.config";
import { absoluteUrl, getCanonicalBaseUrl } from "@/lib/site-url";

/**
 * Page metadata builder — pulls all defaults from siteConfig (the single
 * source of truth for brand + SEO config). No duplicated env-var reads.
 *
 * OG image cascade (both Open Graph + Twitter):
 *   1. per-page `image` override
 *   2. `siteConfig.seo.defaultOgImage` — Facebook-safe real photo (required
 *      before launch; not a logo / not a blurred wordmark)
 *   3. `/opengraph-image` typographic brand card (plumbing fallback only)
 *
 * Relying on Next's file-based OG merge alone has left live HTML without
 * `og:image` on prerendered pages, so this always emits an explicit URL.
 */

type PageMetadataOptions = {
  title: string;
  description?: string;
  /** Relative path, e.g. "/galleries/golden-hour" */
  path?: string;
  /** Absolute URL or path. Overrides the site default + auto-generated OG. */
  image?: string;
  noIndex?: boolean;
};

function resolveOgImageUrl(image?: string): string {
  const candidate = image?.trim() || siteConfig.seo.defaultOgImage?.trim();
  if (!candidate) return absoluteUrl("/opengraph-image");
  return candidate.startsWith("http") ? candidate : absoluteUrl(candidate);
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: PageMetadataOptions): Metadata {
  const desc = description ?? siteConfig.seo.description;
  const canonical = path ? absoluteUrl(path) : getCanonicalBaseUrl();
  const ogImage = resolveOgImageUrl(image);

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: siteConfig.brand.name,
      title,
      description: desc,
      url: canonical,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

type ArticleMetadataOptions = PageMetadataOptions & {
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
};

export function buildArticleMetadata({
  publishedTime,
  modifiedTime,
  tags,
  ...base
}: ArticleMetadataOptions): Metadata {
  const page = buildPageMetadata(base);
  return {
    ...page,
    openGraph: {
      ...page.openGraph,
      type: "article",
      publishedTime,
      modifiedTime: modifiedTime ?? publishedTime,
      tags,
    },
  };
}
