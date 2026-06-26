#!/usr/bin/env bash
# Sync generated artifacts from SPL.py into public/domains/.
# Run from any directory inside the concept-book repo.
set -euo pipefail

SPL_DIR="${SPL_DIR:-$HOME/projects/digital-duck/SPL.py}"
SPL_YAML="$SPL_DIR/cookbook/74_concept_book"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$REPO_ROOT/public/domains"
GRAPH_TOOL="$REPO_ROOT/scripts/concept_graph.py"

declare -A LEVEL_MAP=(
  [biology]=college
  [calculus]=college
  [chemistry_elements]=core
  [chinese_characters]=intro
  [college_physics_ch1]=core
  [college_physics_ch2]=core
  [cs_algorithms]=college
  [cs_data_structures]=college
  [english_morphology]=intro
  [geometry]=core
  [lean_proving]=research
  [linalg]=college
  [mechanics]=college
  [medicine]=research
  [molecular_biology]=college
  [music_theory]=core
  [python_science]=college
  [quantum_physics]=college
  [sage_learning]=research
  [sql]=core
)

DOMAINS=("${!LEVEL_MAP[@]}")
LANG="${LANG:-en}"

echo "Source YAML : $SPL_YAML"
echo "Destination : $DEST"
echo ""

for domain in "${DOMAINS[@]}"; do
  level="${LEVEL_MAP[$domain]}"
  variant="$level.$LANG"
  mkdir -p "$DEST/$domain/input" "$DEST/$domain/output/$variant/html"

  # Sync graph.yaml from SPL.py
  if [ -f "$SPL_YAML/${domain}_graph.yaml" ]; then
    cp "$SPL_YAML/${domain}_graph.yaml" "$DEST/$domain/input/graph.yaml"
    echo "  ✓  $domain/input/graph.yaml"
  else
    echo "  ✗  $domain/input/graph.yaml (not found)"
  fi

  # Generate graph.html locally from graph.yaml
  if [ -f "$DEST/$domain/input/graph.yaml" ]; then
    python3 "$GRAPH_TOOL" --domain "$DEST/$domain/input/graph.yaml" \
      visualize --format html --output "$DEST/$domain/output/graph.html"
    echo "  ✓  $domain/output/graph.html (generated)"
  fi
done

echo ""
echo "Sync complete.  Run 'npm run dev' to preview."
