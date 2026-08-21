#!/bin/bash
# Claude Code → Zapier webhook notifier
# Usage: .claude/scripts/notify.sh "Subject" "Body message"
#
# Setup:
#   1. Create a Zap: Webhooks by Zapier (Catch Hook) → Gmail (Send Email to yourself)
#   2. Map fields: subject → Subject, message → Body, timestamp → optional
#   3. Add ZAPIER_NOTIFY_WEBHOOK=https://hooks.zapier.com/hooks/catch/... to your .env
#
# The script is a no-op if ZAPIER_NOTIFY_WEBHOOK is not set — safe to call always.

SUBJECT="${1:-Claude Code Notification}"
BODY="${2:-Claude Code has a message for you.}"
TIMESTAMP="$(date -u +"%Y-%m-%d %H:%M UTC")"

# Auto-load .env if the webhook isn't already in the environment
if [ -z "$ZAPIER_NOTIFY_WEBHOOK" ]; then
  # Walk up from script location to find .env
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ENV_FILE="$(dirname "$(dirname "$SCRIPT_DIR")")/.env"
  if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE" 2>/dev/null; set +a
  fi
fi

if [ -z "$ZAPIER_NOTIFY_WEBHOOK" ]; then
  echo "[notify] ZAPIER_NOTIFY_WEBHOOK not set — skipping"
  exit 0
fi

# Escape double quotes in body for JSON safety
BODY_ESCAPED="${BODY//\"/\\\"}"
SUBJECT_ESCAPED="${SUBJECT//\"/\\\"}"

curl -s -X POST "$ZAPIER_NOTIFY_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"subject\": \"$SUBJECT_ESCAPED\", \"message\": \"$BODY_ESCAPED\", \"timestamp\": \"$TIMESTAMP\"}" \
  > /dev/null 2>&1

echo "[notify] Sent: $SUBJECT_ESCAPED"
