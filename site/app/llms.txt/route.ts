import { buildLlmsTxt } from "@/lib/llms/content";

export const revalidate = 86400; // 24h

export async function GET() {
  return new Response(buildLlmsTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
