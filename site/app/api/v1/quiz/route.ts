import { QuizLeadSchema } from "@/lib/validators";
import { deliverQuizLead } from "@/lib/quiz/deliver";
import { siteConfig } from "@/lib/site.config";
import { getQuizzes, getDefaultQuiz } from "@/lib/quiz/registry";
import { rateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { attributionFromJson } from "@/lib/contact-attribution";
import { sanitizeFreeText, sanitizeSlugSafe } from "@/lib/sanitize";
import { logInfo, logError } from "@/lib/logging";
import { logSubmission } from "@/lib/submissions-log";

/**
 * POST /api/v1/quiz — public capture endpoint for the self-hosted quiz.
 *
 * Mirrors /api/v1/inquiry (CORS-open, honeypot, Zod, rate-limited). Progressive
 * capture posts once on the email step and again on completion. GHL only receives
 * the completion post so SMS workflows see phone/name on the first CRM write;
 * Agency OS/webhook can still receive the email-stage backup.
 */

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

// Larger than inquiry (8192) — the completion post carries answers[].
const MAX_BODY_BYTES = 16384;

function json(
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  // CSRF guard: a quiz lead is a same-site action even though CORS is open for
  // read-style discovery. Reject only requests a browser explicitly marks as
  // cross-site; same-origin/same-site/none and non-browser callers (header
  // absent, e.g. server-to-server or curl) pass through.
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return json({ ok: false, error: "csrf_rejected" }, 403);
  }

  // Own namespace (not inquiry's). 10/min: progressive capture legitimately
  // posts twice (email step, then completion).
  const ip = getClientIpFromRequest(req);
  const limit = rateLimit(`quiz:${ip}`, { max: 10, windowMs: 60_000 });
  if (!limit.ok) {
    return json(
      { ok: false, error: "rate_limited", retryAfter: limit.retryAfter },
      429,
      { "Retry-After": String(limit.retryAfter) }
    );
  }

  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) {
    return json({ ok: false, error: "body_too_large" }, 413);
  }
  const rawBody = await req.text();
  // Measure actual bytes (not UTF-16 code units) against the byte budget.
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return json({ ok: false, error: "body_too_large" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Honeypot — silent success so bots don't retry
  if (typeof body.hp === "string" && body.hp.length > 0) {
    return json({ ok: true }, 200);
  }

  const parsed = QuizLeadSchema.safeParse(body);
  if (!parsed.success) {
    // Don't leak the field schema to attackers in production.
    return json(
      {
        ok: false,
        error: "validation_failed",
        ...(process.env.NODE_ENV !== "production"
          ? { details: parsed.error.flatten().fieldErrors }
          : {}),
      },
      400
    );
  }

  const sourceAgent = sanitizeSlugSafe(body.source_agent);
  const sourcePage = sanitizeFreeText(body.sourcePage);
  const attribution = attributionFromJson(body);

  // Resolve the specific variation (a site can host several) so delivery routes
  // by that variation's policy + name, not just the default quiz.
  const variation = parsed.data.quizId
    ? getQuizzes(siteConfig).find((q) => q.id === parsed.data.quizId)
    : undefined;
  const variationName = variation ? ` ${variation.id}` : "";

  const deliveryResult = await deliverQuizLead({
    ...parsed.data,
    sourcePage,
    sourceName: `${siteConfig.brand.name} (Quiz${variationName} · ${sourceAgent})`,
    sourceAgent,
    attribution,
    deliveryPolicy: variation?.delivery ?? getDefaultQuiz(siteConfig)?.delivery,
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
    sourcePage,
    sourceAgent,
    attribution: attribution as Record<string, unknown>,
    payload: {
      answers: parsed.data.answers,
      resultKey: parsed.data.resultKey,
      whyQuestion: parsed.data.whyQuestion,
    },
  }).catch(() => ({ ok: false as const, error: "network_error" as const }));

  if (!deliveryResult.ok && !logResult.ok) {
    // A dropped lead must be greppable server-side (the client only sees ok:false
    // and the captured email/answers are otherwise gone). No PII in the log.
    logError("quiz_lead_lost", {
      reason: deliveryResult.error,
      stage: parsed.data.stage ?? "complete",
      quiz_id: parsed.data.quizId,
      session_id: parsed.data.sessionId,
    });
    const status = deliveryResult.error === "integration_not_configured" ? 503 : 502;
    return json({ ok: false, error: "submission_failed" }, status);
  }

  const targets = [
    ...(deliveryResult.ok ? deliveryResult.delivered : []),
    ...(logResult.ok ? ["agency-os"] : []),
  ];
  logInfo("quiz_lead_received", {
    stage: parsed.data.stage ?? "complete",
    targets: targets.join(","),
    quiz_id: parsed.data.quizId,
    session_id: parsed.data.sessionId,
  });
  return json({ ok: true, stage: parsed.data.stage ?? "complete" }, 200);
}
