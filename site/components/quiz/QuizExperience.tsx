"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { adaptQuiz } from "@/lib/quiz/adapt";
import { trackQuizEvent } from "@/lib/quiz/analytics";
import { validateSiteQuizAlignment } from "@/lib/quiz/validate";
import { getStoredAttribution } from "@/lib/contact-attribution";
import { getLenis } from "@/lib/lenis-instance";
import { QuizRunner } from "./QuizRunner";
import type { QuizSubmitPayload, SiteQuiz } from "@/lib/quiz/types";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface QuizExperienceProps {
  siteQuiz: SiteQuiz;
  onClose: () => void;
  onComplete?: (leadEventId?: string) => void;
  /** Render inline (fills parent) instead of a fixed portal — used by /quiz. */
  inline?: boolean;
  /** Tags the lead by surface (e.g. "quiz-popup" vs "quiz-standalone"). */
  sourceAgent?: string;
}

/**
 * The shared quiz overlay. Adapts the contract → runner data, locks body scroll
 * + pauses Lenis (when a host fork runs smooth scroll; a no-op otherwise) while
 * open, and posts leads to /api/v1/quiz (server-side delivery to GHL/webhook).
 * Used by both the triggered popup and the standalone /quiz route.
 */
export function QuizExperience({
  siteQuiz,
  onClose,
  onComplete,
  inline,
  sourceAgent = "quiz-popup",
}: QuizExperienceProps) {
  const quiz = useMemo(() => adaptQuiz(siteQuiz), [siteQuiz]);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Give SR users the real quiz name on entry, not a generic "Quiz, dialog".
  const dialogLabel = quiz.welcome.headline ? `Quiz: ${quiz.welcome.headline}` : "Quiz";

  // Opaque per-session id (no PII) sent on every post so the email-stage and
  // complete-stage records of one lead correlate in the server logs. Generated in
  // a mount effect (id generation is impure — not allowed during render); it's set
  // well before any user-triggered submit.
  const sessionIdRef = useRef("");
  useEffect(() => {
    sessionIdRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}`;
  }, []);

  // Abandonment signal: fire quiz_closed on unmount UNLESS the quiz completed, so
  // the funnel can measure close/drop-off rate (otherwise it jumps straight from
  // quiz_viewed to quiz_completed with no visibility into where people leave).
  const completedRef = useRef(false);
  const mountedRef = useRef(false);
  useEffect(() => {
    // rAF gate: React StrictMode's dev mount→unmount→remount probe tears down
    // before the frame fires, so mountedRef stays false and the synthetic unmount
    // doesn't emit a spurious quiz_closed (production runs the effect once).
    const raf = requestAnimationFrame(() => {
      mountedRef.current = true;
    });
    return () => {
      cancelAnimationFrame(raf);
      if (mountedRef.current && !completedRef.current) {
        trackQuizEvent("quiz_closed", { quiz_id: quiz.id });
      }
    };
  }, [quiz.id]);

  // Dev-only: surface a misconfigured SiteQuiz loudly instead of failing
  // silently at render (missing bg, misaligned images, bad color override).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const res = validateSiteQuizAlignment(siteQuiz);
    if (!res.ok) {
      console.error(`[quiz] invalid SiteQuiz config "${siteQuiz.id}":\n- ${res.errors.join("\n- ")}`);
    }
  }, [siteQuiz]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = getLenis();
    lenis?.stop();
    // Focus management: move focus into the dialog, trap Tab inside it, and
    // restore focus to the trigger on close (WCAG 2.1 modal pattern).
    const prevFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const handleSubmit = async (payload: QuizSubmitPayload): Promise<{ ok: boolean }> => {
    try {
      const attrFields = Object.fromEntries(
        Object.entries(getStoredAttribution()).map(([k, v]) => [`attr_${k}`, v]),
      );
      const res = await fetch("/api/v1/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          sessionId: sessionIdRef.current,
          sourcePage: window.location.pathname,
          source_agent: sourceAgent,
          ...attrFields,
        }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean };
      return { ok: Boolean(data?.ok) };
    } catch {
      return { ok: false };
    }
  };

  const runner = (
    <QuizRunner
      quiz={quiz}
      fillParent
      // Standalone /quiz (inline) has a priority server backdrop behind it, so the
      // runner backdrop skips its opaque base (no flat-color flash). The popup has
      // nothing behind, so it keeps the base.
      backdropBehind={inline}
      onClose={onClose}
      onSubmit={handleSubmit}
      onComplete={(leadEventId) => {
        completedRef.current = true; // suppress the quiz_closed abandonment event
        onComplete?.(leadEventId);
      }}
    />
  );

  if (inline) {
    return (
      <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[120] outline-none" role="dialog" aria-modal="true" aria-label={dialogLabel}>
        {runner}
      </div>
    );
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[120] outline-none" role="dialog" aria-modal="true" aria-label={dialogLabel}>
      {runner}
    </div>,
    document.body,
  );
}
