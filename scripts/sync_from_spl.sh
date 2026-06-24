#!/usr/bin/env bash
# Sync generated artifacts from SPL.py into public/domains/.
# Run from any directory inside the concept-book repo.
set -euo pipefail

SPL_DIR="${SPL_DIR:-$HOME/projects/digital-duck/SPL.py}"
SPL_HTML="$SPL_DIR/cookbook/74_concept_book/output/html"
SPL_YAML="$SPL_DIR/cookbook/74_concept_book"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$REPO_ROOT/public/domains"

declare -A LEVEL_MAP=(
  [chemistry_elements]=core
  [chinese_characters]=intro
  [english_morphology]=intro
  [geometry]=core
  [lean_proving]=research
  [linalg]=college
  [mechanics]=college
  [music_theory]=core
  [python_science]=college
  [sage_learning]=research
)

DOMAINS=("${!LEVEL_MAP[@]}")
LANG="${LANG:-en}"

echo "Source HTML : $SPL_HTML"
echo "Source YAML : $SPL_YAML"
echo "Destination : $DEST"
echo ""

for domain in "${DOMAINS[@]}"; do
  level="${LEVEL_MAP[$domain]}"
  variant="$level.$LANG"
  mkdir -p "$DEST/$domain/input" "$DEST/$domain/output/$variant/html"

  if [ -f "$SPL_HTML/${domain}_graph.html" ]; then
    cp "$SPL_HTML/${domain}_graph.html" "$DEST/$domain/output/graph.html"
    echo "  ✓  $domain/output/graph.html"
  else
    echo "  ✗  $domain/output/graph.html (not found in $SPL_HTML)"
  fi

  if [ -f "$SPL_YAML/${domain}_graph.yaml" ]; then
    cp "$SPL_YAML/${domain}_graph.yaml" "$DEST/$domain/input/graph.yaml"
    echo "  ✓  $domain/input/graph.yaml"
  else
    echo "  ✗  $domain/input/graph.yaml (not found)"
  fi

  if [ -f "$SPL_HTML/${domain}_concept_book.html" ]; then
    cp "$SPL_HTML/${domain}_concept_book.html" "$DEST/$domain/output/$variant/html/concept_book.html"
    echo "  ✓  $domain/output/$variant/html/concept_book.html"
  fi
done

echo ""
echo "Sync complete.  Run 'npm run dev' to preview."
