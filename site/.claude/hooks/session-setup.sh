#!/bin/bash
# SessionStart hook: Print project context banner at session start.
# Gives Claude immediate orientation: branch, lesson count, recent history.
# Replaces legacy YOLO task-tracking system (now uses Claude Code Task tool).

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

BRANCH=$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(cd "$PROJECT_DIR" && git log --oneline -1 2>/dev/null || echo "no commits")
RECENT=$(cd "$PROJECT_DIR" && git log --oneline -5 2>/dev/null || echo "none")
LESSON_COUNT=$(grep -c '^[0-9]\+\.' "$PROJECT_DIR/tasks/lessons.md" 2>/dev/null || echo "0")

# Check if Ralph autonomous loop is active
RALPH_STATE="$PROJECT_DIR/.claude/ralph/state.json"
RALPH_STATUS=""
if [ -f "$RALPH_STATE" ]; then
  RALPH_PROMPT=$(jq -r '.prompt' "$RALPH_STATE" 2>/dev/null || echo "unknown task")
  RALPH_ITER=$(jq -r '.current_iteration' "$RALPH_STATE" 2>/dev/null || echo "0")
  RALPH_MAX=$(jq -r '.max_iterations' "$RALPH_STATE" 2>/dev/null || echo "25")
  RALPH_STATUS="
  RALPH LOOP ACTIVE: iter $RALPH_ITER/$RALPH_MAX
  Task: $RALPH_PROMPT"
fi

cat <<EOF
=== Session Start ===
Branch:  $BRANCH
Lessons: $LESSON_COUNT rules in tasks/lessons.md — read before planning
Last:    $LAST_COMMIT
Recent commits:
$(echo "$RECENT" | sed 's/^/  /')$RALPH_STATUS
====================
EOF

exit 0
