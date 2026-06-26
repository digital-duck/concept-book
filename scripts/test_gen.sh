#!/usr/bin/env bash
# Batch-generate concept books for selected or all domains in both EN and ZH.
# Runs spl3 fresh (--skip-cache); does NOT skip already-generated targets.
# Console output is tee'd to logs/batch_gen_YYYYMMDD_HHMMSS.log
#
# Must be run inside the spl123 conda env:
#   conda activate spl123
#   bash scripts/test_gen.sh                    # run all domains in EN and ZH
#   bash scripts/test_gen.sh linalg             # run one domain in EN and ZH
#   bash scripts/test_gen.sh sql linalg         # run two domains in EN and ZH
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
  cs_data_structures
  cs_algorithms
  sql
  calculus
  sage_learning
  python_science
  linalg
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

LANGUAGES=(en zh)
SUCCEEDED=0
FAILED=0
FAILED_JOBS=()

for DOMAIN in "${DOMAINS[@]}"; do
  for LANG in "${LANGUAGES[@]}"; do

    echo "" | tee -a "$LOG"
    echo ">>> $DOMAIN ($LANG)" | tee -a "$LOG"
    if python "$REPO/scripts/batch_generate.py" \
         --domain "$DOMAIN" \
         --language "$LANG" \
         --llm ollama:gemma3 \
         2>&1 | tee -a "$LOG"; then
      SUCCEEDED=$((SUCCEEDED + 1))
    else
      FAILED=$((FAILED + 1))
      FAILED_JOBS+=("$DOMAIN/$LANG")
      echo "[WARN] $DOMAIN ($LANG) failed — continuing" | tee -a "$LOG"
    fi

  done
done

echo "" | tee -a "$LOG"
echo "===================================" | tee -a "$LOG"
echo "Done: $SUCCEEDED succeeded, $FAILED failed." | tee -a "$LOG"
if [ ${#FAILED_JOBS[@]} -gt 0 ]; then
  echo "Failed jobs: ${FAILED_JOBS[*]}" | tee -a "$LOG"
fi
echo "Full log: $LOG"
