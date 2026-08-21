#!/usr/bin/env bash
# Ralph Wiggum Stop Hook
# Intercepts Claude's exit and re-feeds the prompt if the completion promise
# hasn't been output yet. Creates the autonomous iteration loop.

set -euo pipefail

STATE_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/ralph/state.json"
NOW_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/ralph/NOW.md"
UI_CHECKED="${CLAUDE_PROJECT_DIR:-.}/.claude/ralph/ui-checked"

# No active Ralph loop — let Claude exit normally
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Read state
PROMPT=$(jq -r '.prompt' "$STATE_FILE" 2>/dev/null || echo "")
PROMISE=$(jq -r '.completion_promise' "$STATE_FILE" 2>/dev/null || echo "RALPH_COMPLETE")
MAX_ITER=$(jq -r '.max_iterations' "$STATE_FILE" 2>/dev/null || echo "25")
CURRENT=$(jq -r '.current_iteration' "$STATE_FILE" 2>/dev/null || echo "0")

# No prompt means invalid state — let exit proceed
if [ -z "$PROMPT" ]; then
  exit 0
fi

# The hook receives the last tool output via stdin
LAST_OUTPUT=$(cat 2>/dev/null || echo "")

# Check if the completion promise was output
if echo "$LAST_OUTPUT" | grep -qF "<promise>${PROMISE}</promise>"; then
  echo "[Ralph] Done after $((CURRENT + 1)) iterations."
  rm -f "$STATE_FILE"
  rm -f "$NOW_FILE"
  rm -f "$UI_CHECKED"
  exit 0
fi

# Detect rate limit — pause gracefully instead of hammering the API
if echo "$LAST_OUTPUT" | grep -qiE "rate.?limit|429|too many requests"; then
  echo "[Ralph] Rate limit hit — loop paused at iteration $((CURRENT + 1))/$MAX_ITER. Type \`continue\` to resume."
  exit 0
fi

# Check iteration limit
NEXT=$((CURRENT + 1))
if [ "$NEXT" -ge "$MAX_ITER" ]; then
  echo "[Ralph] Max iterations ($MAX_ITER) reached. Stopping."
  rm -f "$STATE_FILE"
  rm -f "$NOW_FILE"
  rm -f "$UI_CHECKED"
  exit 0
fi

# Update iteration count
jq --argjson iter "$NEXT" '.current_iteration = $iter' "$STATE_FILE" > "${STATE_FILE}.tmp" \
  && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# Pause before re-injecting (reduces hammering)
sleep 12

# Every 3rd iteration re-inject the full task; otherwise just say continue
if [ $(( NEXT % 3 )) -eq 0 ]; then
cat <<EOF
[Ralph $((NEXT + 1))/$MAX_ITER] Continue the task. Check files and git log to orient yourself.

Task: $PROMPT

Output <promise>${PROMISE}</promise> only when fully done. If stuck 3+ attempts on the same issue, document it and move on.

Re-read .claude/ralph/NOW.md and verify it matches actual progress. Update any drift before continuing.
EOF
else
cat <<EOF
[Ralph $((NEXT + 1))/$MAX_ITER] Keep going. Check git log/files for where you left off. Output <promise>${PROMISE}</promise> when fully done.
EOF
fi

# Exit non-zero to block the session exit
exit 1
