#!/bin/bash
# PostToolUse hook: Scan for accidentally exposed secrets after writes
# Cannot block (PostToolUse) but warns Claude via stderr

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Skip non-code files and hook scripts
if echo "$FILE_PATH" | grep -qE '\.(md|txt|log|gitignore|gitkeep|sh)$'; then
  exit 0
fi

SECRETS_FOUND=$(grep -nE '(sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9]{40,}|api[_-]?key\s*[:=]\s*["\x27][a-zA-Z0-9]|password\s*[:=]\s*["\x27][^\s]+|-----BEGIN (RSA |EC )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9]|eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})' "$FILE_PATH" 2>/dev/null || true)

if [ -n "$SECRETS_FOUND" ]; then
  echo "WARNING: Potential secrets detected in $FILE_PATH:" >&2
  echo "$SECRETS_FOUND" >&2
  echo "Please review and remove any exposed credentials." >&2
fi

exit 0
