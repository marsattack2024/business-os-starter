"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackQuizEvent } from "@/lib/quiz/analytics";
import { isCapped, readRecord, writeRecord, recordShow } from "@/lib/quiz/frequency";

export type TriggerReason = "delay" | "scroll" | "exit" | "manual" | "force" | null;

export interface UseQuizTriggersConfig {
  id: string;
  /** Max times the popup may auto-show in one local calendar day. Default 2. */
  maxShowsPerDay?: number;
  /** Optional extra cooldown between auto-shows, in days. Default 0 (off). */
  seenCooldownDays?: number;
  /** Don't show within this many days of a completed submission. Default 30. */
  submittedCooldownDays?: number;
  /** ms; null/undefined disables the time trigger. */
  delayMs?: number | null;
  /** 0..100; null/undefined disables the scroll trigger. */
  scrollDepthPct?: number | null;
  exitIntent?: boolean;
  /** Path substrings on which the popup must never auto-open (e.g. ["thank-you"]). */
  blockedPathSegments?: string[];
  /** Config/env says the quiz is on (no window access — safe for SSR). */
  enabled?: boolean;
  /** Current pathname is in the quiz's showOn allow-list (no window access). */
  pageAllowed?: boolean;
}

export interface UseQuizTriggers {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  reason: TriggerReason;
}

export function useQuizTriggers(config: UseQuizTriggersConfig): UseQuizTriggers {
  const {
    id,
    maxShowsPerDay = 2,
    seenCooldownDays = 0,
    submittedCooldownDays = 30,
    delayMs,
    scrollDepthPct,
    exitIntent,
    blockedPathSegments = [],
    enabled = false,
    pageAllowed = true,
  } = config;

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<TriggerReason>(null);
  const firedRef = useRef(false);
  const blockedKey = blockedPathSegments.join("|");

  const fire = useCallback(
    (r: TriggerReason) => {
      if (firedRef.current) return;
      firedRef.current = true;
      setReason(r);
      setIsOpen(true);
      // Only real auto-triggers count toward the frequency cap.
      if (r === "delay" || r === "scroll" || r === "exit") {
        writeRecord(id, recordShow(readRecord(id), Date.now()));
      }
      trackQuizEvent("quiz_shown", { quiz_id: id, reason: r ?? "unknown" });
    },
    [id],
  );

  const open = useCallback(() => fire("manual"), [fire]);
  const close = useCallback(() => setIsOpen(false), []);

  // Multi-variation: the popup is mounted once in the persistent layout, so it
  // never remounts on client navigation. Reset the once-per-session fire GUARD
  // when the armed VARIATION changes (a different offer on a /service page) so
  // the main trigger effect (also keyed on id) can re-arm the new variation. Only
  // the ref is touched here — no setState in an effect — and per-id isCapped still
  // prevents re-showing the SAME variation.
  useEffect(() => {
    firedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (firedRef.current) return;
    if (typeof window === "undefined") return;

    // Window-dependent gates resolved here (not in render) so the popup needs no
    // window-reading state. ?quizPreview=1 force-opens ignoring caps; on
    // localhost in dev the quiz runs regardless of the enabled flag.
    const params = new URLSearchParams(window.location.search);
    const preview = params.get("quizPreview") === "1";
    const host = window.location.hostname;
    const devForce =
      process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1");

    if (preview) {
      fire("force");
      return;
    }

    const shouldArm = (enabled && pageAllowed) || devForce;
    if (!shouldArm) return;

    const path = window.location.pathname;
    if (blockedKey && blockedKey.split("|").some((seg) => seg && path.includes(seg))) return;
    if (isCapped(readRecord(id), { maxShowsPerDay, seenCooldownDays, submittedCooldownDays }, Date.now())) return;

    let timer: number | undefined;
    let exitArmTimer: number | undefined;
    let rafScheduled = false;

    const onScroll = () => {
      if (rafScheduled) return;
      rafScheduled = true;
      window.requestAnimationFrame(() => {
        rafScheduled = false;
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        const pct = scrollable <= 0 ? 100 : ((window.scrollY || doc.scrollTop) / scrollable) * 100;
        if (typeof scrollDepthPct === "number" && pct >= scrollDepthPct) fire("scroll");
      });
    };

    const onMouseOut = (e: MouseEvent) => {
      // Cursor left through the top of the viewport toward the browser chrome.
      if (e.clientY > 30 || e.relatedTarget) return;
      fire("exit");
    };

    if (typeof delayMs === "number" && delayMs >= 0) {
      timer = window.setTimeout(() => fire("delay"), delayMs);
    }
    if (typeof scrollDepthPct === "number") {
      window.addEventListener("scroll", onScroll, { passive: true });
      // Fire once on arm so a page already at/over the threshold on load (e.g. a
      // short page with no scroll room) still opens — a scroll event may never come.
      onScroll();
    }
    if (exitIntent) {
      // Arm exit-intent after a short grace period so a visitor whose cursor
      // happens to sit near the top on load doesn't get an instant popup.
      exitArmTimer = window.setTimeout(
        () => window.addEventListener("mouseout", onMouseOut),
        1500,
      );
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      if (exitArmTimer) window.clearTimeout(exitArmTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mouseout", onMouseOut);
    };
  }, [fire, enabled, pageAllowed, id, maxShowsPerDay, seenCooldownDays, submittedCooldownDays, delayMs, scrollDepthPct, exitIntent, blockedKey]);

  return { isOpen, open, close, reason };
}
