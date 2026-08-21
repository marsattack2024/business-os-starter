/**
 * WebMCP registration, kept separate from the tool definitions so the spec's
 * churn lives in exactly one small file per site.
 *
 * The API has moved twice since we first shipped against it:
 *   - `provideContext({ tools })` was replaced by per-tool `registerTool(tool,
 *     { signal })`, because bulk registration silently overwrote tools and
 *     bypassed the duplicate-name check.
 *   - The getter moved from `navigator` to `document` (tools belong to a page,
 *     not a browsing context). Chrome deprecated the `navigator` location while
 *     the origin trial still serves it.
 *
 * So we feature-detect both locations and both registration shapes: the page
 * registers on any build that implements either, and no-ops silently on the
 * browsers that implement neither (still most of them).
 *
 * Spec: https://github.com/webmachinelearning/webmcp
 */

export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: () => Promise<{ content: Array<{ type: "text"; text: string }> }>;
}

interface ModelContext {
  /** Current spec: one tool per call, unregistered by aborting the signal. */
  registerTool?: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => unknown;
  /** Retired bulk shape, still present in the earliest origin-trial builds. */
  provideContext?: (context: { tools: ModelContextTool[] }) => unknown;
}

function getModelContext(): ModelContext | undefined {
  if (typeof document !== "undefined") {
    const fromDocument = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (fromDocument) return fromDocument;
  }
  if (typeof navigator !== "undefined") {
    return (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  }
  return undefined;
}

/**
 * Registers `tools` with the browser's model context.
 *
 * Returns a cleanup function — call it on unmount, so a remount (React strict
 * mode, a client navigation) does not trip `registerTool`'s duplicate-name
 * error. Safe to call anywhere: it no-ops when the API is absent, and a failed
 * registration never propagates to the page.
 */
export function registerModelContextTools(tools: ModelContextTool[]): () => void {
  const modelContext = getModelContext();
  if (!modelContext) return () => {};

  if (typeof modelContext.registerTool === "function") {
    const controller = new AbortController();
    for (const tool of tools) {
      try {
        void Promise.resolve(
          modelContext.registerTool(tool, { signal: controller.signal }),
        ).catch(() => {
          /* A duplicate name or a rejected registration must not break the page. */
        });
      } catch {
        /* Synchronous throw from an older/different implementation. */
      }
    }
    return () => controller.abort();
  }

  if (typeof modelContext.provideContext === "function") {
    try {
      modelContext.provideContext({ tools });
    } catch {
      /* Experimental API shape may differ across implementations — fail silent. */
    }
  }

  return () => {};
}
