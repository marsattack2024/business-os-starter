#!/bin/bash
# PostToolUse hook: Auto-format files after Write/Edit
# Runs prettier on JS/TS/JSON/CSS/MD files if available

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx|json|css|md)$'; then
  if command -v npx &> /dev/null && [ -f "${CLAUDE_PROJECT_DIR}/node_modules/.bin/prettier" ]; then
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
  fi
fi

exit 0
