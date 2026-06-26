#!/usr/bin/env bash
# Batch-generate concept books for all domains, one domain at a time.
# Console output is tee'd to scripts/logs/batch_YYYYMMDD_HHMMSS.log
#
# Must be run inside the spl123 conda env:
#   conda activate spl123
#   bash scripts/test_gen.sh
#
# Optional env overrides (same as batch_generate.py):
#   CB_LLM=claude_cli:claude-opus-4-8 bash scripts/test_gen.sh
#   CB_SPL_DIR=/path/to/SPL.py        bash scripts/test_gen.sh
set -euo pipefail

export SPL_WHILE_MAX_ITER=30

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/batch_$(date +%Y%m%d_%H%M%S).log"

DOMAINS=(
  linalg
  geometry
  calculus
  mechanics
  chemistry_elements
  chinese_characters
  english_morphology
  python_science
  sage_learning
  lean_proving
  music_theory
  biology
  cs_algorithms
  cs_data_structures
  medicine
  sql
  college_physics_ch1
  college_physics_ch2
  quantum_physics
  molecular_biology
)

echo "Log: $LOG"
echo "Domains: ${#DOMAINS[@]}"
echo "---" | tee -a "$LOG"

SUCCEEDED=0
FAILED=0
FAILED_DOMAINS=()

for DOMAIN in "${DOMAINS[@]}"; do
  echo "" | tee -a "$LOG"
  echo ">>> $DOMAIN" | tee -a "$LOG"
  if python "$REPO/scripts/batch_generate.py" \
       --domain "$DOMAIN" \
       --skip-existing \
       2>&1 | tee -a "$LOG"; then
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    FAILED=$((FAILED + 1))
    FAILED_DOMAINS+=("$DOMAIN")
    echo "[WARN] $DOMAIN failed — continuing" | tee -a "$LOG"
  fi
done

echo "" | tee -a "$LOG"
echo "===================================" | tee -a "$LOG"
echo "Done: $SUCCEEDED succeeded, $FAILED failed." | tee -a "$LOG"
if [ ${#FAILED_DOMAINS[@]} -gt 0 ]; then
  echo "Failed: ${FAILED_DOMAINS[*]}" | tee -a "$LOG"
fi
echo "Full log: $LOG"
