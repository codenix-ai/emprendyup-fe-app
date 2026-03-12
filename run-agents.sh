#!/bin/bash
# emprendy.ai — Local Agent Runner
# Usage: ./run-agents.sh [--dry-run] [--fix-only] [--inspect-only]

set -e
export $(grep -v '^#' .env | grep -v '^$' | xargs)

DRY_RUN=""
FIX_ONLY=false
INSPECT_ONLY=false

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN="--dry-run" ;;
    --fix-only) FIX_ONLY=true ;;
    --inspect-only) INSPECT_ONLY=true ;;
  esac
done

RUN="npx ts-node --project tsconfig.agents.json"

if [ "$FIX_ONLY" = false ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Step 1/3 — Inspector"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  $RUN agents/inspector/index.ts $DRY_RUN

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Step 2/3 — Task Manager"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  $RUN agents/task-manager/index.ts
fi

if [ "$INSPECT_ONLY" = false ] && [ -z "$DRY_RUN" ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Step 3/3 — Fixers"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  $RUN agents/fe-fixer/index.ts
fi

echo ""
echo "✅ Pipeline complete."
