import "server-only";

type LogLevel = "info" | "warn" | "error";

type SafeMeta = Record<string, string | number | boolean | null | undefined>;

function emit(level: LogLevel, event: string, meta: SafeMeta = {}) {
  const safeMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined),
  );
  const payload = {
    event,
    level,
    ts: new Date().toISOString(),
    ...safeMeta,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logInfo(event: string, meta?: SafeMeta) {
  emit("info", event, meta);
}

export function logWarn(event: string, meta?: SafeMeta) {
  emit("warn", event, meta);
}

export function logError(event: string, meta?: SafeMeta) {
  emit("error", event, meta);
}
