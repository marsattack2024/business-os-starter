#!/bin/bash
# PreCompact hook: Inject critical state before context window compression.
# Claude loses context during compaction — this injects a survival kit.
# Outputs a JSON systemMessage that gets preserved through the compaction.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

BRANCH=$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo "unknown")
LAST_3=$(cd "$PROJECT_DIR" && git log --oneline -3 2>/dev/null || echo "none")
LESSON_COUNT=$(grep -c '^[0-9]\+\.' "$PROJECT_DIR/tasks/lessons.md" 2>/dev/null || echo "unknown")

# Check if Ralph is active
RALPH_STATE="$PROJECT_DIR/.claude/ralph/state.json"
RALPH_NOTE=""
if [ -f "$RALPH_STATE" ]; then
  RALPH_PROMPT=$(jq -r '.prompt' "$RALPH_STATE" 2>/dev/null || echo "")
  RALPH_ITER=$(jq -r '.current_iteration' "$RALPH_STATE" 2>/dev/null || echo "0")
  RALPH_MAX=$(jq -r '.max_iterations' "$RALPH_STATE" 2>/dev/null || echo "25")
  RALPH_NOTE="RALPH AUTONOMOUS LOOP IS ACTIVE (iter $RALPH_ITER/$RALPH_MAX). Task: $RALPH_PROMPT. Keep working toward the completion promise."
fi

# Inject NOW.md task state if it exists (Ralph updates this each iteration)
NOW_CONTENT=""
NOW_FILE="$PROJECT_DIR/.claude/ralph/NOW.md"
if [ -f "$NOW_FILE" ]; then
  NOW_CONTENT=$(head -c 2000 "$NOW_FILE" 2>/dev/null || echo "")
fi

MESSAGE="CONTEXT COMPRESSED. Restore orientation before acting:
- Branch: $BRANCH
- Lessons: $LESSON_COUNT rules in tasks/lessons.md — re-read before planning
- Recent: $LAST_3
- Stack: Next.js 16 + Supabase + Anthropic SDK, Pino logging (103/103 routes)
- Rules: CLAUDE.md + .claude/rules/ (workflow, verification, coding-conventions)
- Verification: 14-point checklist in .claude/rules/verification.md
${RALPH_NOTE:+- $RALPH_NOTE}${NOW_CONTENT:+

--- Ralph Task State (NOW.md) ---
$NOW_CONTENT
---}"

jq -n --arg msg "$MESSAGE" '{"systemMessage": $msg}'

exit 0
