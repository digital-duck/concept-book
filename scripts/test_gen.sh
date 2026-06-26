#!/usr/bin/env bash
# Batch-generate concept books for selected or all domains.
# Runs spl3 fresh (--skip-cache); does NOT skip already-generated targets.
# Console output is tee'd to logs/batch_gen_YYYYMMDD_HHMMSS.log
#
# Must be run inside the spl123 conda env:
#   conda activate spl123
#   bash scripts/test_gen.sh                    # run all domains
#   bash scripts/test_gen.sh linalg             # run one domain
#   bash scripts/test_gen.sh sql linalg         # run two domains
#
# To skip already-generated targets, add --skip-existing to the python call.
# To reuse LLM cache, remove --skip-cache from the python call.
#
# Optional env overrides:
#   CB_LLM=claude_cli:claude-opus-4-8 bash scripts/test_gen.sh
#   CB_SPL_DIR=/path/to/SPL.py        bash scripts/test_gen.sh
set -euo pipefail

export SPL_WHILE_MAX_ITER=30

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/batch_gen_$(date +%Y%m%d_%H%M%S).log"

ALL_DOMAINS=(
  geometry
  college_physics_ch1
  college_physics_ch2
  chinese_characters
  english_morphology
  chemistry_elements
  cs_algorithms
  cs_data_structures
  sql
  sage_learning
  python_science
  linalg
  calculus
  mechanics
  quantum_physics
  music_theory
  biology
  molecular_biology
  medicine
  lean_proving
)

# If a domain argument is given, run only that domain; otherwise run all.
if [[ $# -gt 0 ]]; then
  DOMAINS=("$@")
else
  DOMAINS=("${ALL_DOMAINS[@]}")
fi

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
       --skip-cache \
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
