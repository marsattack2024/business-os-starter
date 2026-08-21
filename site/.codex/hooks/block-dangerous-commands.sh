#!/bin/bash
# PreToolUse hook: Block destructive commands
# Reads JSON from stdin, checks Bash commands against blocklist
# Exit 0 = allow, outputs JSON with permissionDecision "deny" to block

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

BLOCKED_PATTERNS=(
  'rm\s+-rf\s+/'
  'rm\s+-rf\s+\.'
  'rm\s+-rf\s+\*'
  'rm\s+-rf\s+~'
  'git\s+push\s+.*--force'
  'git\s+push\s+.*-f\b'
  'git\s+reset\s+--hard'
  'git\s+clean\s+-fd'
  'git\s+checkout\s+\.\s*$'
  'chmod\s+777'
  'curl.*\|\s*sh'
  'curl.*\|\s*bash'
  'wget.*\|\s*sh'
  'wget.*\|\s*bash'
  ':\(\)\s*\{.*\}\s*;'
  '>\s*/dev/sd'
  '\bmkfs\b'
  '\bdd\s+if='
  '\bsudo\b'
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -iEq "$pattern"; then
    echo "BLOCKED: Command matches dangerous pattern: $pattern" >&2
    exit 2
  fi
done

exit 0
