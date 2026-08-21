// lib/quiz/frequency.ts
// Frequency caps for the triggered popup. Pure gate + record (unit-tested);
// thin localStorage wrappers below. The popup may auto-show at most
// `maxShowsPerDay` times within one LOCAL calendar day, and never within
// `submittedCooldownDays` of a completed submission (the longer window, 30 days
// by default). `seenCooldownDays` is an OPTIONAL extra cooldown (off by default)
// for sites that also want a multi-day gap between auto-shows.

export interface QuizShowRecord {
  shownAt?: number; // last auto-show timestamp (ms epoch)
  submittedAt?: number; // last completed-submission timestamp (ms epoch)
  shownDate?: string; // local calendar day (YYYY-MM-DD) that `shownCount` counts
  shownCount?: number; // number of auto-shows recorded on `shownDate`
  // Legacy field tolerated on read (older records); no longer written.
  submitted?: boolean;
}

export interface FrequencyConfig {
  /** Max auto-shows allowed within one local calendar day. */
  maxShowsPerDay: number;
  /** Don't show within this many days of a completed submission. */
  submittedCooldownDays: number;
  /** Optional extra cooldown: also don't re-show within this many days of the
   *  last auto-show. 0/undefined = off (the per-day cap governs on its own). */
  seenCooldownDays?: number;
}

const DAY_MS = 86_400_000;

/** Local calendar-day key (YYYY-MM-DD) for a timestamp. The per-day cap resets at
 *  the visitor's local midnight — which is what "twice a day" means to them. */
export function localDayKey(now: number): string {
  const d = new Date(now);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** True when the popup must NOT be shown given the stored record + caps. */
export function isCapped(rec: QuizShowRecord, cfg: FrequencyConfig, now: number): boolean {
  // A completed submission suppresses the popup for the longer window. Fall back
  // to legacy `submitted: true` records (which had no timestamp) by treating the
  // last show — or now — as the submission time, so they stay suppressed.
  const submittedAt =
    rec.submittedAt ?? (rec.submitted ? rec.shownAt ?? now : undefined);
  if (submittedAt !== undefined && now - submittedAt < cfg.submittedCooldownDays * DAY_MS) {
    return true;
  }
  // Optional multi-day cooldown between auto-shows (off unless configured).
  if (
    cfg.seenCooldownDays &&
    rec.shownAt !== undefined &&
    now - rec.shownAt < cfg.seenCooldownDays * DAY_MS
  ) {
    return true;
  }
  // Per-day cap: only shows recorded for TODAY count; a new local day resets to 0.
  const todayCount = rec.shownDate === localDayKey(now) ? rec.shownCount ?? 0 : 0;
  if (todayCount >= cfg.maxShowsPerDay) {
    return true;
  }
  return false;
}

/** Next record after an auto-show: increments today's count (resetting on a new
 *  local day), stamps the show time, and preserves the submission timestamp. */
export function recordShow(prev: QuizShowRecord, now: number): QuizShowRecord {
  const today = localDayKey(now);
  const sameDay = prev.shownDate === today;
  return {
    shownAt: now,
    submittedAt: prev.submittedAt,
    shownDate: today,
    shownCount: sameDay ? (prev.shownCount ?? 0) + 1 : 1,
  };
}

/* ------------------------- Browser helpers ------------------------- */
const KEY = (id: string) => `quiz_${id}`;

// Same-session fallback when localStorage is unavailable (Safari private mode,
// blocked storage, embedded contexts). Without it the cap fails OPEN — the popup
// would re-arm on every page load. The Map only persists within a tab/session;
// cross-session suppression genuinely needs storage and is out of scope by design.
const memoryStore = new Map<string, QuizShowRecord>();

export function readRecord(id: string): QuizShowRecord {
  try {
    const raw = localStorage.getItem(KEY(id));
    // An empty localStorage may just mean a prior write fell back to memory
    // (storage blocked mid-session), so consult the fallback too.
    if (raw) return JSON.parse(raw) as QuizShowRecord;
    return memoryStore.get(id) ?? {};
  } catch {
    return memoryStore.get(id) ?? {};
  }
}

export function writeRecord(id: string, rec: QuizShowRecord): void {
  // Always mirror to memory so a blocked-storage session still caps the popup.
  memoryStore.set(id, rec);
  try {
    localStorage.setItem(KEY(id), JSON.stringify(rec));
  } catch {
    /* storage unavailable — the in-memory mirror holds it for this session */
  }
}

export function markSubmitted(id: string, now: number = Date.now()): void {
  const cur = readRecord(id);
  writeRecord(id, { ...cur, submittedAt: now, submitted: true });
}
