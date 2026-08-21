#!/bin/bash
# UserPromptSubmit hook: Inject context reminders based on what the user typed.
# Two detection modes:
#   1. Security surface keywords → inject security checklist reminder
#   2. Completion/shipping keywords → inject verification checklist reminder
# Outputs a JSON systemMessage that Claude sees before responding.

INPUT=$(cat)
USER_PROMPT=$(echo "$INPUT" | jq -r '.user_prompt // ""' 2>/dev/null || echo "")

# Lowercase for case-insensitive matching
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

# --- Security surface detection ---
# Triggers on phrases that signal new auth/DB/endpoint/crypto work
if echo "$PROMPT_LOWER" | grep -qE '(oauth|new table|create table|public endpoint|encrypt|hmac|user.supplied|fetch.*url|url.*fetch|service role|new.*route.*auth|unauthenticated)'; then
  jq -n '{
    "systemMessage": "SECURITY SURFACE DETECTED. Per CLAUDE.md Rule 6 + lessons #89: Before writing code for this, embed a security checklist in the plan: (1) SSRF guard for user-supplied URLs via isPrivateOrLocalhost(), (2) OAuth state HMAC-signed with dedicated env var — no fallbacks, (3) AES-256-GCM for tokens at rest, (4) 5-operation RLS audit for new tables (SELECT/INSERT WITH CHECK/UPDATE USING+WITH CHECK/DELETE/admin bypass), (5) Content-Length cap on public endpoints. Run /security-audit triage:<feature> during plan review."
  }'
  exit 0
fi

# --- Completion/shipping detection ---
# Triggers on phrases that signal the user thinks the work is done
if echo "$PROMPT_LOWER" | grep -qE '\b(done|ship it|that works|commit that|push that|mark.?complete|all done|looks good|wrap up|finish(ed)?|deploy)\b'; then
  PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
  LESSON_COUNT=$(grep -c '^[0-9]\+\.' "$PROJECT_DIR/tasks/lessons.md" 2>/dev/null || echo "106")
  jq -n --arg lc "$LESSON_COUNT" '{
    "systemMessage": ("VERIFICATION REQUIRED before calling this done. All 14 items in .claude/rules/verification.md must pass: (1) npx vitest run — all tests pass, (2) npx tsc --noEmit — no type errors, (3) no TODO/FIXME/console.log in deliverable files, (4) new components imported and rendered, (5) new API routes called from UI, (6) no .env staged, (7) build succeeds. " + $lc + " lessons in tasks/lessons.md — check for violations.")
  }'
  exit 0
fi

# No keywords matched — pass through silently
exit 0
