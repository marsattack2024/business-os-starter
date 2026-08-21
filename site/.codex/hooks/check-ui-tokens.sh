#!/bin/bash
# PostToolUse hook: BLOCK writes that introduce hardcoded UI tokens.
# Phase 3 token sweep is complete — this hook now BLOCKS (exit 2).
# References lessons.md #97 (CARD_CLASSES), #100 (token quick-ref), #101 (collateral violations).

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")

# Only check src/components/** and src/app/** files (not lib, not config)
if ! echo "$FILE_PATH" | grep -qE '^src/(components|app)/.*\.(tsx?|jsx?)$'; then
  exit 0
fi

# Exclude: shadcn internals, Puppeteer render pipeline, legacy catalyst, landing page, ui-constants
if echo "$FILE_PATH" | grep -qE '^src/components/(ui|ad-templates|catalyst|p2p-landing)/'; then
  exit 0
fi

# Skip if file doesn't exist
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

VIOLATIONS=""

# 1. Raw pixel font sizes: text-[Npx]
HITS=$(grep -n 'text-\[[0-9]' "$FILE_PATH" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Raw pixel font size (use text-body, text-label, text-stat, etc.):\n${HITS}\n"
fi

# 2. text-foreground (should be text-[var(--color-text-primary)])
HITS=$(grep -n 'text-foreground' "$FILE_PATH" 2>/dev/null | grep -v 'text-primary-foreground\|text-card-foreground\|text-popover-foreground\|text-sidebar-foreground\|text-accent-foreground\|text-secondary-foreground\|text-destructive-foreground\|text-muted-foreground' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ text-foreground → text-[var(--color-text-primary)]:\n${HITS}\n"
fi

# 3. text-muted-foreground (should be text-[var(--color-text-secondary)] or similar)
HITS=$(grep -n 'text-muted-foreground' "$FILE_PATH" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ text-muted-foreground → text-[var(--color-text-secondary)] or similar:\n${HITS}\n"
fi

# 4. bg-white on non-button elements (should be bg-card or CARD_CLASSES)
HITS=$(grep -n 'bg-white' "$FILE_PATH" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ bg-white → bg-card or CARD_CLASSES (unless intentional on button):\n${HITS}\n"
fi

# 5. font-heading outside globals.css (deprecated usage)
if ! echo "$FILE_PATH" | grep -qE 'globals\.css$'; then
  HITS=$(grep -n 'font-heading' "$FILE_PATH" 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    VIOLATIONS="${VIOLATIONS}\n  ❌ font-heading outside globals.css → use font-[var(--font-heading)]:\n${HITS}\n"
  fi
fi

# 6. Inline card styling (should use CARD_CLASSES from @/lib/card-classes)
HITS=$(grep -n 'rounded-xl shadow-\[' "$FILE_PATH" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Inline card styling → import CARD_CLASSES from @/lib/card-classes:\n${HITS}\n"
fi

# 7. Hardcoded gray text colors (should use semantic text color tokens)
# Matches text-gray-100 through text-gray-950. Excludes comments and string literals.
HITS=$(grep -n 'text-gray-[0-9]' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' | grep -v "text-gray-700" || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ text-gray-* → use text-[var(--color-text-primary/secondary/tertiary/label/placeholder/faint)]:\n${HITS}\n"
fi

# 8. Hardcoded gray backgrounds (should use bg-card, bg-muted, or token)
# Matches bg-gray-50 through bg-gray-950. Excludes hover: and active: states.
HITS=$(grep -n 'bg-gray-[0-9]' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' | grep -v 'hover:\|active:\|group-hover:' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ bg-gray-* → use bg-card, bg-muted, or semantic token:\n${HITS}\n"
fi

# 9. Hardcoded gray borders (should use border-border or border-[var(--border)])
HITS=$(grep -n 'border-gray-[0-9]' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ border-gray-* → use border-border or border-[var(--border)]:\n${HITS}\n"
fi

# 10. Non-standard Tailwind opacity values (compile silently but apply nothing)
# Only standard scale: /0, /5, /10, /15, /20, /25, /30, /40, /50, /60, /70, /75, /80, /90, /95, /100
# Catches /3, /6, /7, /8, /12, /13, /14, /16, /17, /18, /19, etc.
# Excludes aspect-ratio brackets (e.g. aspect-[9/16], aspect-[1.91/1]) and fraction-style values
# Uses full-line grep to filter lines that contain the opacity pattern but not aspect-ratio patterns
HITS=$(grep -nE '[a-zA-Z0-9-]/(3|6|7|8|12|13|14|16|17|18|19|22|23|24|26|27|28|29|31|32|33|34|35|36|37|38|39|41|42|43|44|45|46|47|48|49|51|52|53|54|55|56|57|58|59|61|62|63|64|65|66|67|68|69|71|72|73|74|76|77|78|79|81|82|83|84|85|86|87|88|89|91|92|93|94|96|97|98|99)[^0-9/]' "$FILE_PATH" 2>/dev/null | grep -v 'aspect-\[' | head -5 || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Non-standard opacity value (use /5, /10, /20, /25, /50, /75, /90 or bracket syntax bg-gray-900/[8%]):\n${HITS}\n"
fi

# 11. text-stat without tabular-nums (stat numbers must have tabular-nums for alignment)
# Use word-boundary anchor to avoid matching text-status-* tokens
STAT_LINES=$(grep -n 'text-stat[^u]' "$FILE_PATH" 2>/dev/null || true)
if [ -n "$STAT_LINES" ]; then
  while IFS= read -r line; do
    LINE_NUM=$(echo "$line" | cut -d: -f1)
    LINE_CONTENT=$(echo "$line" | cut -d: -f2-)
    if ! echo "$LINE_CONTENT" | grep -q 'tabular-nums'; then
      VIOLATIONS="${VIOLATIONS}\n  ❌ text-stat without tabular-nums on line ${LINE_NUM} (required: text-stat font-bold tracking-tight tabular-nums):\n${line}\n"
    fi
  done <<< "$STAT_LINES"
fi

# 12. Hardcoded status accent backgrounds (should use bg-status-{success|warning|error|info}-bg)
# Catches bg-emerald-50, bg-green-50, bg-red-50, bg-amber-50, bg-blue-50, bg-indigo-50
HITS=$(grep -n 'bg-\(emerald\|green\|red\|amber\|blue\|indigo\)-50' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Hardcoded status bg (use bg-status-{success|warning|error|info}-bg):\n${HITS}\n"
fi

# 13. Hardcoded status text colors (should use text-status-{success|warning|error|info})
# Catches text-emerald-{500-900}, text-green-{500-700}, text-red-{500-700}, text-amber-{500-700}
# Excludes text-indigo-900 and text-indigo-300 (quiz decorative) and text-indigo-600 (checkbox control)
HITS=$(grep -n 'text-\(emerald\|green\|red\|amber\)-[5-9]' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Hardcoded status text color (use text-status-{success|warning|error|info}):\n${HITS}\n"
fi

# 14. Hardcoded focus ring colors (should use focus:ring-focus-ring)
# Catches focus:ring-indigo-{400-600}, focus:ring-blue-{400-600}
HITS=$(grep -n 'focus:ring-\(indigo\|blue\)-[4-6]' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Hardcoded focus ring (use focus:ring-focus-ring or focus:ring-status-error):\n${HITS}\n"
fi

# 15. Hardcoded overlay backgrounds (should use bg-overlay)
# Catches bg-black/40, bg-black/50, bg-black/60 but NOT bg-black/95 (lightbox) or hover:bg-black/70
HITS=$(grep -n 'bg-black/[456]0' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' | grep -v 'hover:' | grep -v 'bg-black/95' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS="${VIOLATIONS}\n  ❌ Hardcoded overlay (use bg-overlay token):\n${HITS}\n"
fi

if [ -n "$VIOLATIONS" ]; then
  echo "" >&2
  echo "🚫 UI TOKEN VIOLATION in $FILE_PATH — write blocked:" >&2
  echo -e "$VIOLATIONS" >&2
  echo "Fix these before writing. See .claude/rules/design-system.md for approved tokens." >&2
  echo "" >&2
  exit 2
fi

exit 0
