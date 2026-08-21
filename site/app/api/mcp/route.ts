/**
 * MCP server — streamable HTTP transport.
 * Exposes submit_inquiry (wraps upsertContact → GHL), plus submit_quiz_lead
 * (wraps deliverQuizLead) when a quiz is enabled.
 *
 * Adding more tools: register them inside createMcpServer(). Good future
 * candidates once a booking DB exists:
 *   - get_session_details({email}) — return a booked session for a client
 *   - get_prep_checklist({sessionType}) — return wardrobe/timing guide
 *   - reschedule_request({email, reason}) — fire a workflow
 *
 * Pattern adapted from p2p-react-website/app/api/mcp/route.ts, stripped
 * to one tool. The streamable-http transport is native Web Fetch — no
 * Node bridge needed, but runtime stays nodejs because upsertContact
 * accesses env vars + makes outbound fetches.
 */

export const runtime = "nodejs";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { upsertContact } from "@/lib/ghl/contacts";
import { siteConfig } from "@/lib/site.config";
import { rateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { InquirySchema, QuizLeadSchema } from "@/lib/validators";
import { deliverQuizLead } from "@/lib/quiz/deliver";
import { getQuizzes, getDefaultQuiz, isQuizEnabled } from "@/lib/quiz/registry";
import { logSubmission } from "@/lib/submissions-log";

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: `${siteConfig.brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-mcp`,
    version: "1.0.0",
  });

  server.registerTool(
    "submit_inquiry",
    {
      title: `Submit an Inquiry to ${siteConfig.brand.name}`,
      description: `Submit a contact inquiry to ${siteConfig.brand.name}'s CRM (GoHighLevel)${siteConfig.brand.category ? `, ${siteConfig.brand.category}` : ""}. Use when a user wants to book a session, ask about availability, or request more information. Idempotent by email. Re-submissions update the existing contact instead of creating duplicates.`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true, // writes to external CRM
      },
      inputSchema: {
        name: z
          .string()
          .min(2)
          .max(100)
          .describe("Full name of the person inquiring."),
        email: z
          .string()
          .email()
          .describe("Contact email. This is also the idempotency key in the CRM."),
        phone: z
          .string()
          .max(40)
          .optional()
          .describe("Phone number for follow-up. Optional but strongly preferred for higher-quality leads."),
        sessionType: z
          .string()
          .max(50)
          .optional()
          .describe("Type of session (e.g. 'portrait', 'couples', 'family', 'bridal'). Stored in the CRM note when present."),
        message: z
          .string()
          .max(2000)
          .optional()
          .describe("Free-form message with the vision, timing, or questions. Stored as a note on the contact."),
      },
    },
    async (args) => {
      // Re-validate through the canonical InquirySchema so MCP submissions
      // get the same phone normalization + length caps as the REST endpoint
      // and the browser form. MCP's inputSchema is for client advertisement;
      // this is the trust boundary.
      const parsed = InquirySchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Inquiry validation failed: ${parsed.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")}`,
            },
          ],
          isError: true,
        };
      }

      const crmResult = await upsertContact({
        ...parsed.data,
        sourceName: `${siteConfig.brand.name} (MCP)`,
      });

      const logResult = await logSubmission({
        source: "inquiry",
        synced: crmResult.ok,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.message,
        sourceAgent: "mcp",
        payload: parsed.data,
      }).catch(() => ({ ok: false as const, error: "network_error" as const }));

      if (!crmResult.ok && !logResult.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Inquiry submission failed. The user may want to try again or contact the studio directly at ${siteConfig.brand.email ?? "the website"}.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "Inquiry submitted successfully. The studio typically responds personally within one business day.",
          },
        ],
      };
    }
  );

  // Self-gate the quiz tool exactly like the popup + /quiz route + openapi:
  // only register it when a quiz is enabled. A brochure fork with no live quiz
  // exposes no quiz tool — agents never discover a dead capability. Secrets
  // (GHL token, webhook URL/secret) stay server-side inside deliverQuizLead.
  const defaultQuiz = getDefaultQuiz(siteConfig);
  if (defaultQuiz && isQuizEnabled(defaultQuiz)) {
    server.registerTool(
      "submit_quiz_lead",
      {
        title: `Submit a Quiz Lead to ${siteConfig.brand.name}`,
        description: `Submit a lead from ${siteConfig.brand.name}'s interactive quiz to its CRM (GoHighLevel) and/or webhook${siteConfig.brand.category ? `, ${siteConfig.brand.category}` : ""}. Progressive capture: post once with stage:"email" for backup/webhook, then again with stage:"complete" (name/phone/answers/score). GHL only receives the complete post so SMS workflows see phone/name immediately.`,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true, // writes to external CRM / webhook
        },
        inputSchema: {
          email: z
            .string()
            .email()
            .describe("Lead email. This is also the idempotency key in the CRM."),
          stage: z
            .enum(["email", "complete"])
            .optional()
            .describe("Progressive-capture stage. 'email' = backup/webhook only; 'complete' = final post sent to GHL with name/phone/answers/score. Defaults to 'complete'."),
          name: z
            .string()
            .max(100)
            .optional()
            .describe("Full name of the person. Arrives on the 'complete' post."),
          phone: z
            .string()
            .max(40)
            .optional()
            .describe("Phone number for follow-up. Optional but preferred for higher-quality leads."),
          why: z
            .string()
            .max(2000)
            .optional()
            .describe("Free-text reason/motivation captured by the quiz."),
          whyQuestion: z
            .string()
            .max(240)
            .optional()
            .describe("Human-readable prompt for the free-text reason, recorded above the answer in CRM notes."),
          quizId: z
            .string()
            .max(80)
            .optional()
            .describe("Identifier of the quiz variation (routes delivery policy and note context)."),
          resultKey: z
            .string()
            .max(80)
            .optional()
            .describe("The quiz result/outcome key the user landed on."),
          score: z
            .number()
            .int()
            .min(0)
            .max(100)
            .optional()
            .describe("The user's quiz score (0–100)."),
          answers: z
            .array(
              z.object({
                q: z.string().max(160),
                a: z.string().max(400),
              })
            )
            .max(40)
            .optional()
            .describe("Per-question answers, recorded as a note on the CRM contact."),
        },
      },
      async (args) => {
        // Re-validate through the canonical QuizLeadSchema so MCP submissions
        // get the same preprocessing + caps as the REST endpoint. MCP's
        // inputSchema is for client advertisement; this is the trust boundary.
        const parsed = QuizLeadSchema.safeParse(args);
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Quiz lead validation failed: ${parsed.error.issues
                  .map((i) => `${i.path.join(".")}: ${i.message}`)
                  .join("; ")}`,
              },
            ],
            isError: true,
          };
        }

        // Route delivery by the named variation's policy (a site can host
        // several), falling back to the default quiz's policy.
        const variation = parsed.data.quizId
          ? getQuizzes(siteConfig).find((q) => q.id === parsed.data.quizId)
          : undefined;
        const variationName = variation ? ` ${variation.id}` : "";

        const deliveryResult = await deliverQuizLead({
          ...parsed.data,
          sourceName: `${siteConfig.brand.name} (Quiz${variationName} · MCP)`,
          sourceAgent: "mcp",
          deliveryPolicy: variation?.delivery ?? defaultQuiz.delivery,
        });

        const logResult = await logSubmission({
          source: "quiz",
          synced: deliveryResult.ok && deliveryResult.delivered.includes("ghl"),
          stage: parsed.data.stage,
          sessionId: parsed.data.sessionId,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.why,
          quizId: parsed.data.quizId,
          score: parsed.data.score,
          sourceAgent: "mcp",
          payload: {
            answers: parsed.data.answers,
            resultKey: parsed.data.resultKey,
            whyQuestion: parsed.data.whyQuestion,
          },
        }).catch(() => ({ ok: false as const, error: "network_error" as const }));

        if (!deliveryResult.ok && !logResult.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Quiz lead submission failed. The user may want to try again or contact the studio directly at ${siteConfig.brand.email ?? "the website"}.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: "Quiz lead submitted successfully. The studio typically responds personally within one business day.",
            },
          ],
        };
      }
    );
  }

  return server;
}

export async function POST(req: Request) {
  // Rate limit: shared "inquiry:<ip>" key namespace with /api/v1/inquiry +
  // submitInquiry server action. A single IP can't get 15 submissions by
  // mixing form + REST + MCP — all three count against the same 5/min cap.
  // Without this, /api/mcp was an unauthenticated write surface to GHL.
  const ip = getClientIpFromRequest(req);
  const limit = rateLimit(`inquiry:${ip}`, { max: 5, windowMs: 60_000 });
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32029, // MCP convention: rate-limit
          message: `Rate limited. Retry after ${limit.retryAfter}s.`,
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfter),
        },
      }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET() {
  // MCP discovery probe — some clients GET /api/mcp before POSTing.
  // No CORS header: the MCP POST transport doesn't require browser CORS,
  // and exposing wildcard ACAO here would signal the full surface as
  // browser-callable (it isn't). Server-to-server clients ignore CORS.
  return new Response(
    JSON.stringify({
      mcp: "streamable-http",
      info: `MCP server for ${siteConfig.brand.name}. Use POST with an MCP client (Claude Desktop, etc.).`,
      capabilities: { tools: true },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
