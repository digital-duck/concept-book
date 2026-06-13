#!/usr/bin/env bash
# Sync generated artifacts from SPL.py into public/domains/.
# Run from any directory inside the concept-book repo.
set -euo pipefail

SPL_DIR="${SPL_DIR:-$HOME/projects/digital-duck/SPL.py}"
SPL_HTML="$SPL_DIR/cookbook/74_concept_book/output/html"
SPL_YAML="$SPL_DIR/cookbook/74_concept_book"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$REPO_ROOT/public/domains"

DOMAINS=(
  chemistry_elements
  chinese_characters
  english_morphology
  geometry
  lean_proving
  linalg
  mechanics
  music_theory
  python_science
  sage_learning
)

echo "Source HTML : $SPL_HTML"
echo "Source YAML : $SPL_YAML"
echo "Destination : $DEST"
echo ""

for domain in "${DOMAINS[@]}"; do
  mkdir -p "$DEST/$domain"

  if [ -f "$SPL_HTML/${domain}_graph.html" ]; then
    cp "$SPL_HTML/${domain}_graph.html" "$DEST/$domain/graph.html"
    echo "  ✓  $domain/graph.html"
  else
    echo "  ✗  $domain/graph.html (not found in $SPL_HTML)"
  fi

  if [ -f "$SPL_YAML/${domain}_graph.yaml" ]; then
    cp "$SPL_YAML/${domain}_graph.yaml" "$DEST/$domain/graph.yaml"
    echo "  ✓  $domain/graph.yaml"
  else
    echo "  ✗  $domain/graph.yaml (not found)"
  fi

  if [ -f "$SPL_HTML/${domain}_concept_book.html" ]; then
    cp "$SPL_HTML/${domain}_concept_book.html" "$DEST/$domain/concept_book.html"
    echo "  ✓  $domain/concept_book.html"
  fi
done

echo ""
echo "Sync complete.  Run 'npm run dev' to preview."
