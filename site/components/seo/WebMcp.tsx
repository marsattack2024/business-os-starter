"use client";

import { useEffect } from "react";
import { siteConfig } from "@/lib/site.config";
import { registerModelContextTools, type ModelContextTool } from "@/lib/webmcp";
import { getQuizzes, quizSlug, isQuizEnabled } from "@/lib/quiz/registry";

/**
 * WebMCP — exposes safe, read-only studio tools to in-browser AI agents that
 * implement the experimental model-context API. Registration (and the spec's
 * moving API surface) lives in lib/webmcp.ts; this file only declares the
 * tools. No-ops cleanly in browsers without the API, which is still most of
 * them. Nothing here mutates server state; the inquiry tool just points the
 * agent at the public inquiry path. Rendered once, globally, from the root
 * layout.
 */

export function WebMcp() {
  useEffect(() => {
    const { brand, seo } = siteConfig;
    const loc = brand.location ? `${brand.location.city}, ${brand.location.state}` : "";

    // Self-gate the quiz tool exactly like the popup + /quiz route: only the
    // enabled variations are advertised. No enabled quiz → no quiz tool at all.
    const enabledQuizzes = getQuizzes(siteConfig).filter(isQuizEnabled);

    const quizTool: ModelContextTool | null =
      enabledQuizzes.length > 0
        ? {
            name: "how_to_take_quiz",
            description:
              "Explain how to take the studio's interactive quiz and how an agent can submit a quiz lead via the public API.",
            inputSchema: { type: "object", properties: {} },
            async execute() {
              // The default variation backs /quiz; any extra variations have
              // their own /quiz/<slug> route. List both so an agent can pick.
              const links = enabledQuizzes.map((q) =>
                q.default ? `${seo.baseUrl}/quiz` : `${seo.baseUrl}/quiz/${quizSlug(q)}`,
              );
              const uniqueLinks = Array.from(new Set(links));
              return {
                content: [
                  {
                    type: "text",
                    text:
                      `${brand.name} offers an interactive quiz. Take it at ` +
                      `${uniqueLinks.join(" or ")}. ` +
                      `To submit a lead programmatically, POST to ${seo.baseUrl}/api/v1/quiz ` +
                      `(public, no auth; schema at ${seo.baseUrl}/api/openapi.json). ` +
                      `Email is required; name/phone/answers/score are optional.`,
                  },
                ],
              };
            },
          }
        : null;

    return registerModelContextTools([
      {
        name: "get_studio_info",
        description: `Get this ${
          brand.category || "studio"
        }'s details: name, location, services, contact, and how to inquire.`,
        inputSchema: { type: "object", properties: {} },
        async execute() {
          return {
            content: [
              {
                type: "text",
                text:
                  `${brand.name}${brand.category ? `, ${brand.category}` : ""}` +
                  `${loc ? `, ${loc}` : ""}. ` +
                  `${brand.phone ? `Phone ${brand.phone}. ` : ""}` +
                  `${brand.email ? `Email ${brand.email}. ` : ""}` +
                  `Inquire at ${seo.baseUrl}/#contact (public form, no account needed).`,
              },
            ],
          };
        },
      },
      {
        name: "how_to_inquire",
        description:
          "Explain how to send a booking inquiry to the studio, including the public API endpoint.",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          return {
            content: [
              {
                type: "text",
                text:
                  `Submit the inquiry form at ${seo.baseUrl}/#contact, or POST to ` +
                  `${seo.baseUrl}/api/v1/inquiry (public, no auth; schema at ${seo.baseUrl}/api/openapi.json). ` +
                  `${brand.photographer ? `${brand.photographer} replies` : "We reply"} within 1–2 business days.`,
              },
            ],
          };
        },
      },
      ...(quizTool ? [quizTool] : []),
    ]);
  }, []);

  return null;
}
