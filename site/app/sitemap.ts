import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getIndexablePages } from "@/lib/pages";
import { buildPublicRoutes, indexableRoutes } from "@/lib/public-routes";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 3600; // 1h

/**
 * Generates /sitemap.xml from the routes that actually exist. The blog index +
 * posts are included only when there are posts; migrated landing pages are
 * included from content/pages. /thank-you is intentionally omitted (noindex).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes(
    buildPublicRoutes({ posts: getAllPosts(), pages: getIndexablePages() }),
  ).map((route) => ({
    url: absoluteUrl(route.path),
    // Only emit lastModified when we have a real content date (posts). Defaulting
    // dateless routes (home/blog index/landing) to build-time `now` churns lastmod
    // on every deploy and trains crawlers to distrust the signal — omit instead.
    ...(route.lastModified && { lastModified: route.lastModified }),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
