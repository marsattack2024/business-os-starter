#!/usr/bin/env bash
# Parallel Conflict Check: After parallel agents complete, detect semantic conflicts
# that TypeScript can't catch (duplicate exports, route collisions, files touched
# by multiple agents).
#
# Usage: bash .claude/hooks/parallel-conflict-check.sh <base-ref>
#   base-ref: git ref to diff against (default: HEAD~5, i.e. before parallel tasks)
#
# Exit 0: no conflicts detected
# Exit 1: conflicts found — resolve before integration task
set -euo pipefail

BASE_REF="${1:-HEAD~5}"

CHANGED_FILES=$(git diff --name-only "$BASE_REF" HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' || true)

if [ -z "$CHANGED_FILES" ]; then
  echo "No TypeScript files changed since $BASE_REF."
  exit 0
fi

CONFLICTS=""

# ── 1. Duplicate named exports across changed files ───────────────────────────
# Extract all top-level exports from changed files, tag each with its filename
EXPORTS=""
while IFS= read -r f; do
  [ -f "$f" ] || continue
  FILE_EXPORTS=$(grep -nE '^export (const|function|class|type|interface) ' "$f" 2>/dev/null | sed "s|^|$f:|" || true)
  [ -n "$FILE_EXPORTS" ] && EXPORTS="${EXPORTS}${FILE_EXPORTS}"$'\n'
done <<< "$CHANGED_FILES"

if [ -n "$EXPORTS" ]; then
  # Find names exported from more than one file
  DUPES=$(echo "$EXPORTS" \
    | grep -oE '(const|function|class|type|interface) [A-Za-z0-9_]+' \
    | awk '{print $2}' | sort | uniq -d || true)

  if [ -n "$DUPES" ]; then
    while IFS= read -r dupe; do
      [ -z "$dupe" ] && continue
      SOURCES=$(echo "$EXPORTS" \
        | grep -E "(const|function|class|type|interface) ${dupe}[^A-Za-z0-9_]" \
        | cut -d: -f1 | sort -u || true)
      SOURCE_COUNT=$(echo "$SOURCES" | grep -c . || true)
      if [ "$SOURCE_COUNT" -gt 1 ]; then
        CONFLICTS="${CONFLICTS}
⚠️  DUPLICATE EXPORT '${dupe}' found in:
${SOURCES}
"
      fi
    done <<< "$DUPES"
  fi
fi

# ── 2. Duplicate route paths in src/app/api/ ─────────────────────────────────
ROUTE_FILES=$(echo "$CHANGED_FILES" | grep -E '^src/app/api/' || true)
if [ -n "$ROUTE_FILES" ]; then
  ROUTE_PATHS=$(echo "$ROUTE_FILES" \
    | sed 's|src/app/api/||;s|/route\.\(ts\|tsx\)$||' \
    | sort | uniq -d || true)
  if [ -n "$ROUTE_PATHS" ]; then
    CONFLICTS="${CONFLICTS}
⚠️  DUPLICATE API ROUTES:
${ROUTE_PATHS}
"
  fi
fi

# ── 3. Files touched by multiple parallel agents ──────────────────────────────
MULTI_TOUCH=$(git log --name-only --pretty=format: "${BASE_REF}..HEAD" 2>/dev/null \
  | grep -E '\.(ts|tsx)$' \
  | sort | uniq -d || true)
if [ -n "$MULTI_TOUCH" ]; then
  CONFLICTS="${CONFLICTS}
⚠️  FILES TOUCHED BY MULTIPLE PARALLEL AGENTS (need manual merge review):
${MULTI_TOUCH}
"
fi

# ── Report ────────────────────────────────────────────────────────────────────
if [ -n "$CONFLICTS" ]; then
  echo ""
  echo "=== PARALLEL CONFLICT DETECTION ==="
  echo "$CONFLICTS"
  echo "=== END ==="
  echo ""
  echo "Resolve these before the integration task. Run 'npx tsc --noEmit' after fixes."
  exit 1
else
  echo "✅ No semantic conflicts detected across parallel tasks (base: $BASE_REF)."
  exit 0
fi
