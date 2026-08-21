#!/bin/bash
# PostToolUse hook: Detect console.log/warn/error in API route files.
# All API routes must use createRouteLogger — never raw console.* calls.
# Exits 2 with line numbers so Claude sees the violation and fixes it.
# References lessons.md #23 and docs/logging-standards.md.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")

# Only check API route TypeScript files
if ! echo "$FILE_PATH" | grep -qE 'src/app/api/.*\.(ts|tsx)$'; then
  exit 0
fi

# Skip if file doesn't exist
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Grep for console calls. Best-effort — catches real calls, may miss some in strings.
CONSOLE_HITS=$(grep -n 'console\.\(log\|warn\|error\|debug\)' "$FILE_PATH" 2>/dev/null || true)

if [ -n "$CONSOLE_HITS" ]; then
  echo "LOGGING VIOLATION in $FILE_PATH:" >&2
  echo "$CONSOLE_HITS" >&2
  echo "" >&2
  echo "Replace with structured logging (lessons.md #23):" >&2
  echo "  log(\"error\", \"phase:name\", \"message\", { error: err instanceof Error ? err.message : String(err) })" >&2
  echo "All API routes must use createRouteLogger. See docs/logging-standards.md." >&2
  exit 2
fi

exit 0
