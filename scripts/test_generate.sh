#!/usr/bin/env bash
# Test concept-book generation outside the UI.
# Must be run inside the spl123 conda env.
#
# Usage:
#   conda activate spl123
#   bash scripts/test_generate.sh [domain_id] [target_concept]
#
# Examples:
#   bash scripts/test_generate.sh geometry area
#   bash scripts/test_generate.sh lean_theorem_proving proposition
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SPL_DIR="${CB_SPL_DIR:-$HOME/projects/digital-duck/SPL.py}"
LLM="${CB_LLM:-claude_cli:claude-sonnet-4-6}"
COOKBOOK="cookbook/74_concept_book"

DOMAIN="${1:-geometry}"
TARGET="${2:-area}"
OUTPUT_DIR="$REPO/public/domains/$DOMAIN"

echo "domain    : $DOMAIN"
echo "target    : $TARGET"
echo "output_dir: $OUTPUT_DIR"
echo "llm       : $LLM"
echo "spl_dir   : $SPL_DIR"
echo "---"

mkdir -p "$OUTPUT_DIR"

cd "$SPL_DIR"
spl3 run "$COOKBOOK/build_concept_book.spl" \
    --tools "$COOKBOOK/tools.py" \
    --llm "$LLM" \
    --param "domain_yaml=${DOMAIN}_graph.yaml" \
    --param "target=$TARGET" \
    --param "language=en" \
    --param "output_dir=$OUTPUT_DIR"

echo "---"
echo "Done. Book index: $OUTPUT_DIR/book_${TARGET}.html"
