#!/bin/bash
# PreToolUse hook: Prevent modification/deletion of sensitive files
# Blocks Write/Edit to .env files, blocks git add .env, blocks rm .env
# .env.example is explicitly allowed (it's a template, not a secrets file)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  # Allow .env.example — it's a template file, not a secrets file
  if echo "$FILE_PATH" | grep -qE '\.env\.example$'; then
    : # explicitly allowed
  elif echo "$FILE_PATH" | grep -qE '\.env($|\.)'; then
    echo "BLOCKED: Cannot modify .env files. Use .env.example for templates." >&2
    exit 2
  fi

  if echo "$FILE_PATH" | grep -qE '(secrets/|\.pem$|\.key$|credentials)'; then
    echo "BLOCKED: Cannot modify files in secrets/ or key/credential files." >&2
    exit 2
  fi
fi

if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

  # Check for rm on .env files (but not .env.example)
  # Two-step check avoids PCRE negative lookahead (not portable across systems)
  if echo "$COMMAND" | grep -qE 'rm\s+.*\.env'; then
    if ! echo "$COMMAND" | grep -qE '\.env\.example'; then
      echo "BLOCKED: Cannot delete .env files." >&2
      exit 2
    fi
  fi

  # Check for git add on .env files (but not .env.example)
  if echo "$COMMAND" | grep -qE 'git\s+add\s+.*\.env'; then
    if ! echo "$COMMAND" | grep -qE '\.env\.example'; then
      echo "BLOCKED: Cannot stage .env files for commit." >&2
      exit 2
    fi
  fi
fi

exit 0
