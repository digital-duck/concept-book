#!/usr/bin/env bash
# Test concept-book generation outside the UI.
# Must be run inside the spl123 conda env.
#
# Usage:
#   conda activate spl123
#   bash scripts/test_generate.sh [domain_id] [target_concept] [level] [language]
#
# Examples:
#   bash scripts/test_generate.sh geometry area core en
#   bash scripts/test_generate.sh lean_proving proposition research en
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SPL_DIR="${CB_SPL_DIR:-$HOME/projects/digital-duck/SPL.py}"
LLM="${CB_LLM:-claude_cli:claude-sonnet-4-6}"
SPL_WORKFLOW="$REPO/spl"

DOMAIN="${1:-geometry}"
TARGET="${2:-area}"
LEVEL="${3:-core}"
LANG="${4:-en}"
VARIANT="$LEVEL.$LANG"
OUTPUT_DIR="$REPO/public/domains/$DOMAIN/output/$VARIANT/html"

echo "domain    : $DOMAIN"
echo "target    : $TARGET"
echo "level     : $LEVEL"
echo "language  : $LANG"
echo "output_dir: $OUTPUT_DIR"
echo "llm       : $LLM"
echo "spl_dir   : $SPL_DIR"
echo "---"

mkdir -p "$OUTPUT_DIR"
mkdir -p "$REPO/public/domains/$DOMAIN/input"

cd "$SPL_DIR"
spl3 run "$SPL_WORKFLOW/build_concept_book.spl" \
    --tools "$SPL_WORKFLOW/tools.py" \
    --llm "$LLM" \
    --param "domain_yaml=${DOMAIN}_graph.yaml" \
    --param "target=$TARGET" \
    --param "lvl=$LEVEL" \
    --param "language=$LANG" \
    --param "output_dir=$OUTPUT_DIR"

echo "---"
echo "Done. Book index: $OUTPUT_DIR/book_${TARGET}.html"
