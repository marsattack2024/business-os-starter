#!/bin/bash
# PostToolUse hook: Run tsc --noEmit after writing TypeScript files.
# Feeds errors back to Claude immediately via stderr (exit 2).
# Skips test files, config files, and non-TS files.
# Timeout is set in settings.json — if tsc takes too long, hook times out silently.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")

# Only run on TypeScript source files
if ! echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

# Skip test files, spec files, and config files
if echo "$FILE_PATH" | grep -qE '(__tests__|\.test\.|\.spec\.|next\.config|tailwind\.config|vitest\.config|postcss\.config)'; then
  exit 0
fi

# Skip hook scripts and non-src paths
if ! echo "$FILE_PATH" | grep -q '/src/'; then
  exit 0
fi

# Skip if file doesn't exist (e.g. deleted)
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Run tsc --noEmit with skipLibCheck for speed; capture errors
TSC_OUTPUT=$(cd "$PROJECT_DIR" && npx tsc --noEmit --skipLibCheck 2>&1 | head -40 || true)

if [ -n "$TSC_OUTPUT" ]; then
  echo "TypeScript errors after editing $(basename "$FILE_PATH"):" >&2
  echo "$TSC_OUTPUT" >&2
  echo "" >&2
  echo "Fix these before proceeding (npx tsc --noEmit --skipLibCheck to verify)." >&2
  exit 2
fi

exit 0
