#!/usr/bin/env bash
# Ralph UI Gate: When Ralph completes (promise detected), check if UI files
# were changed and whether ui-check was run.
set -euo pipefail

STATE_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/ralph/state.json"

# Only run if Ralph is active
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Check if the completion promise was output
PROMISE=$(jq -r '.completion_promise' "$STATE_FILE" 2>/dev/null || echo "")
LAST_OUTPUT=$(cat 2>/dev/null || echo "")

if ! echo "$LAST_OUTPUT" | grep -qF "<promise>${PROMISE}</promise>"; then
  # Not completing — don't gate
  exit 0
fi

# Ralph is completing. Check for changed UI files.
# Use merge-base for accuracy on long-running branches; fall back to HEAD~10.
BASE_REF=$(git merge-base main HEAD 2>/dev/null || echo "HEAD~10")
UI_FILES=$(git diff --name-only "$BASE_REF" HEAD 2>/dev/null \
  | grep -E '^src/(components|app)/.*\.(tsx|jsx)$' \
  | grep -v '^src/components/\(ui\|ad-templates\|catalyst\|p2p-landing\)/' \
  || true)

if [ -z "$UI_FILES" ]; then
  # No UI files changed — nothing to gate
  exit 0
fi

FILE_COUNT=$(echo "$UI_FILES" | wc -l | tr -d ' ')

# Check if ui-check was already run (look for the marker file)
MARKER="${CLAUDE_PROJECT_DIR:-.}/.claude/ralph/ui-checked"
if [ -f "$MARKER" ]; then
  exit 0
fi

# UI files changed but no marker — inject reminder
FILE_LIST=$(echo "$UI_FILES" | tr '\n' ',' | sed 's/,$//')

cat <<EOF
[Ralph UI Gate] $FILE_COUNT UI file(s) were changed in this feature. Before merging, run:

/ui-check post:${FILE_LIST}

If you already verified these, create the marker: touch .claude/ralph/ui-checked
EOF

# Don't block exit — just warn. The actual blocking is in build-feature Step 6.25.
exit 0
