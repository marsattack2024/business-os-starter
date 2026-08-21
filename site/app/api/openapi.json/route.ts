import { siteConfig } from "@/lib/site.config";
import { getCanonicalBaseUrl } from "@/lib/site-url";
import { getDefaultQuiz, isQuizEnabled } from "@/lib/quiz/registry";

/**
 * OpenAPI 3.1 specification for the public REST API.
 * Discoverable via /.well-known/api-catalog (rel="service-desc") and the
 * Link response header on every page.
 *
 * Documents POST /api/v1/inquiry, plus POST /api/v1/quiz when (and only when)
 * an enabled quiz exists — a brochure fork with no live quiz advertises no
 * quiz endpoint. Add more endpoints here as the API surface grows.
 */

export const revalidate = 86400;

export async function GET() {
  const base = getCanonicalBaseUrl();

  // Self-gate the quiz endpoint exactly like the popup + /quiz route: only
  // advertise it when a quiz is actually enabled. A disabled/absent quiz means
  // the path is omitted entirely so agents never discover a dead endpoint.
  const defaultQuiz = getDefaultQuiz(siteConfig);
  const quizEnabled = defaultQuiz ? isQuizEnabled(defaultQuiz) : false;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${siteConfig.brand.name}: Inquiry API`,
      version: "1.0.0",
      description: `Public REST API for submitting inquiries to ${siteConfig.brand.name}${siteConfig.brand.category ? ` (${siteConfig.brand.category})` : ""}. Mirrors the website's contact form. Designed for AI agents acting on a client's behalf.`,
      contact: siteConfig.brand.email ? { email: siteConfig.brand.email } : undefined,
    },
    servers: [{ url: `${base}/api/v1` }],
    paths: {
      "/inquiry": {
        post: {
          operationId: "submitInquiry",
          summary: `Submit an inquiry to ${siteConfig.brand.name}.`,
          description:
            "Accepts a studio inquiry and forwards it to the studio's CRM when configured. Public success is intentionally opaque.",
          tags: ["inquiry"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InquiryInput" },
                example: {
                  name: "Alex Rivers",
                  email: "alex@example.com",
                  phone: "+1 555 0100",
                  sessionType: "portrait",
                  message:
                    "I'd love to book a portrait session for my 40th birthday in April.",
                  source_agent: "claude-mobile",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Inquiry accepted.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InquirySuccess" },
                },
              },
            },
            "400": {
              description: "Validation error or malformed JSON.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            "413": {
              description: "Request body exceeded 8KB.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            "429": {
              description:
                "Rate limited (5 requests/min/IP). Retry-After header indicates seconds until the next allowed request.",
              headers: {
                "Retry-After": {
                  schema: { type: "integer" },
                  description: "Seconds the client should wait before retrying.",
                },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            "502": {
              description: "Upstream CRM rejected the request.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      // Quiz capture endpoint — only present when a quiz is enabled.
      ...(quizEnabled
        ? {
            "/quiz": {
              post: {
                operationId: "submitQuizLead",
                summary: `Submit a quiz lead to ${siteConfig.brand.name}.`,
                description:
                  "Captures a lead from the interactive quiz funnel. Progressive capture posts once with stage:\"email\" for backup/webhook and again with stage:\"complete\" (name/phone/answers/score). The CRM only receives the complete post so SMS workflows see phone/name immediately. Public success is intentionally opaque.",
                tags: ["quiz"],
                requestBody: {
                  required: true,
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/QuizLeadInput" },
                      example: {
                        stage: "complete",
                        email: "alex@example.com",
                        name: "Alex Rivers",
                        phone: "+1 555 0100",
                        whyQuestion:
                          "What's making you think about this right now?",
                        why: "I want to do something for myself this year.",
                        quizId: defaultQuiz?.id,
                        resultKey: "ready-to-book",
                        score: 75,
                        answers: [
                          { q: "What matters most to you?", a: "Feeling confident" },
                        ],
                        source_agent: "claude-mobile",
                      },
                    },
                  },
                },
                responses: {
                  "200": {
                    description: "Quiz lead accepted.",
                    content: {
                      "application/json": {
                        schema: { $ref: "#/components/schemas/QuizLeadSuccess" },
                      },
                    },
                  },
                  "400": {
                    description: "Validation error or malformed JSON.",
                    content: {
                      "application/json": {
                        schema: { $ref: "#/components/schemas/ApiError" },
                      },
                    },
                  },
                  "429": {
                    description:
                      "Rate limited (10 requests/min/IP, progressive capture posts twice). Retry-After header indicates seconds until the next allowed request.",
                    headers: {
                      "Retry-After": {
                        schema: { type: "integer" },
                        description:
                          "Seconds the client should wait before retrying.",
                      },
                    },
                    content: {
                      "application/json": {
                        schema: { $ref: "#/components/schemas/ApiError" },
                      },
                    },
                  },
                  "502": {
                    description: "Upstream CRM/webhook rejected the request.",
                    content: {
                      "application/json": {
                        schema: { $ref: "#/components/schemas/ApiError" },
                      },
                    },
                  },
                  "503": {
                    description: "No delivery integration is configured.",
                    content: {
                      "application/json": {
                        schema: { $ref: "#/components/schemas/ApiError" },
                      },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    components: {
      schemas: {
        InquiryInput: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100 },
            email: { type: "string", format: "email" },
            phone: { type: "string", maxLength: 40 },
            sessionType: {
              type: "string",
              maxLength: 50,
              description:
                "Optional session category (e.g. 'portrait', 'couples', 'family'). Stored in the CRM note when present.",
            },
            message: { type: "string", maxLength: 2000 },
            sourcePage: {
              type: "string",
              description:
                "Page slug the inquiry originated from (for attribution).",
            },
            source_agent: {
              type: "string",
              maxLength: 80,
              description:
                "Identifier of the agent submitting the inquiry (e.g. 'claude-mobile', 'gpt-app'). Recorded as a tag.",
            },
            hp: {
              type: "string",
              description:
                "Honeypot field. It must be empty; filled values are silently dropped.",
            },
          },
        },
        InquirySuccess: {
          type: "object",
          required: ["ok"],
          properties: {
            ok: { type: "boolean", const: true },
          },
        },
        // Quiz schemas only referenced when the /quiz path is present.
        ...(quizEnabled
          ? {
              QuizLeadInput: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                  stage: {
                    type: "string",
                    enum: ["email", "complete"],
                    description:
                      "Progressive-capture stage. 'email' = backup/webhook only; 'complete' = final post sent to GHL with name/phone/answers/score. Defaults to 'complete'.",
                  },
                  name: { type: "string", minLength: 1, maxLength: 100 },
                  phone: { type: "string", maxLength: 40 },
                  why: {
                    type: "string",
                    maxLength: 2000,
                    description: "Free-text reason/motivation captured by the quiz.",
                  },
                  whyQuestion: {
                    type: "string",
                    maxLength: 240,
                    description:
                      "Human-readable prompt for the free-text reason, recorded above the answer in CRM notes.",
                  },
                  quizId: {
                    type: "string",
                    maxLength: 80,
                    description:
                      "Identifier of the quiz variation this lead came from (routes delivery policy and note context).",
                  },
                  resultKey: {
                    type: "string",
                    maxLength: 80,
                    description: "The quiz result/outcome key the user landed on.",
                  },
                  score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description: "The user's quiz score (0–100).",
                  },
                  answers: {
                    type: "array",
                    maxItems: 40,
                    description: "Per-question answers, recorded as a note on the CRM contact.",
                    items: {
                      type: "object",
                      required: ["q", "a"],
                      properties: {
                        q: { type: "string", maxLength: 160 },
                        a: { type: "string", maxLength: 400 },
                      },
                    },
                  },
                  sourcePage: {
                    type: "string",
                    description:
                      "Page slug the quiz lead originated from (for attribution).",
                  },
                  source_agent: {
                    type: "string",
                    maxLength: 80,
                    description:
                      "Identifier of the agent submitting the lead (e.g. 'claude-mobile'). Recorded as a tag.",
                  },
                  hp: {
                    type: "string",
                    description:
                      "Honeypot field. It must be empty; filled values are silently dropped.",
                  },
                },
              },
              QuizLeadSuccess: {
                type: "object",
                required: ["ok"],
                properties: {
                  ok: { type: "boolean", const: true },
                  stage: {
                    type: "string",
                    enum: ["email", "complete"],
                    description: "Echoes the stage that was accepted.",
                  },
                },
              },
            }
          : {}),
        ApiError: {
          type: "object",
          required: ["ok", "error"],
          properties: {
            ok: { type: "boolean", const: false },
            error: {
              type: "string",
              description: "Machine-readable error code.",
            },
            details: {
              type: "object",
              description: "Optional per-field validation errors.",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
