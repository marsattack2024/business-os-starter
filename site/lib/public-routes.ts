import type { MetadataRoute } from "next";

export type RouteChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

export type PublicRouteKind =
  | "home"
  | "blog-index"
  | "blog-post"
  | "landing-page"
  | "legal"
  | "noindex";

export interface PublicRoute {
  path: string;
  title: string;
  description: string;
  kind: PublicRouteKind;
  indexable: boolean;
  exposeInLlms: boolean;
  markdown: boolean;
  changeFrequency: RouteChangeFrequency;
  priority: number;
  lastModified?: Date;
}

export interface RoutePost {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
}

export interface RoutePage {
  slug: string;
  title: string;
  description?: string;
  status?: "draft" | "indexable" | "noindex" | "redirect" | "retired";
}

export const NAV_ITEMS = [
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Journal", href: "/blog" },
  { label: "Contact", href: "#contact" },
] as const;

export const AGENT_DISCOVERY_ROUTES = [
  "/llms.txt",
  "/llms-full.txt",
  "/api/openapi.json",
  "/.well-known/agent.json",
  "/.well-known/agents.json",
  "/.well-known/agent-skills/index.json",
  "/.well-known/api-catalog",
  "/.well-known/mcp/server-card.json",
] as const;

export function buildPublicRoutes({
  posts = [],
  pages = [],
}: {
  posts?: RoutePost[];
  pages?: RoutePage[];
} = {}): PublicRoute[] {
  const routes: PublicRoute[] = [
    {
      path: "/",
      title: "Home",
      description:
        "Homepage with hero, social proof, photographer bio, process, gallery, testimonials, and contact form.",
      kind: "home",
      indexable: true,
      exposeInLlms: true,
      markdown: true,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      path: "/thank-you",
      title: "Thank You",
      description: "Post-form confirmation page.",
      kind: "noindex",
      indexable: false,
      exposeInLlms: false,
      markdown: true,
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];

  if (posts.length > 0) {
    routes.push({
      path: "/blog",
      title: "Journal",
      description: "Stories, tips, and behind-the-scenes from the studio.",
      kind: "blog-index",
      indexable: true,
      exposeInLlms: true,
      markdown: true,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const post of posts) {
    routes.push({
      path: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt ?? "",
      kind: "blog-post",
      indexable: true,
      exposeInLlms: true,
      markdown: true,
      changeFrequency: "yearly",
      priority: 0.6,
      lastModified: post.date ? new Date(`${post.date}T00:00:00`) : undefined,
    });
  }

  for (const page of pages) {
    if (page.status !== "indexable" && page.status !== "noindex") continue;
    routes.push({
      path: `/${page.slug}`,
      title: page.title,
      description: page.description ?? "",
      kind: "landing-page",
      indexable: page.status === "indexable",
      exposeInLlms: page.status === "indexable",
      markdown: true,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return routes;
}

export function indexableRoutes(routes: PublicRoute[]): PublicRoute[] {
  return routes.filter((route) => route.indexable);
}

export function llmsRoutes(routes: PublicRoute[]): PublicRoute[] {
  return routes.filter((route) => route.exposeInLlms);
}
