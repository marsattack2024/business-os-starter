import { NextResponse, type NextRequest } from "next/server";

/**
 * Markdown content negotiation for AI agents.
 *
 * A request that explicitly prefers `text/markdown` over HTML is served the
 * page's markdown view (the existing /md/[...slug] route) at the SAME URL,
 * while browsers — which send `text/html` — get the normal HTML page.
 *
 * This is the ONE sanctioned proxy in this template. It is required
 * request behavior (Accept-based content negotiation for agent-readiness),
 * not a convenience route. Keep the matcher tight so static assets, the
 * /md route itself, /api, and the agent/SEO surfaces never pass through here.
 */
export function proxy(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  // Only agents that want markdown over HTML. Browsers send text/html and are
  // untouched; pure-markdown (or markdown-without-html) Accept gets the md view.
  const wantsMarkdown = accept.includes("text/markdown") && !accept.includes("text/html");
  if (!wantsMarkdown) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = url.pathname === "/" ? "/md" : `/md${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Exclude /api, /_next, the /md route itself, /.well-known, and any path with
  // a file extension (sitemap.xml, robots.txt, llms.txt, auth.md, *.js, images…).
  matcher: ["/((?!api/|_next/|md(?:/|$)|\\.well-known/|.*\\.).*)"],
};
