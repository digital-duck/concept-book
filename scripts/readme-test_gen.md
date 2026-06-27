# ConceptBook Generation Guide

## Prerequisites

```bash
conda activate spl123
cd ~/projects/digital-duck/concept-book/
```

The backend API must be running for the UI Generate/PDF buttons:
```bash
bash scripts/start-api.sh   # uvicorn on :8000
npm run dev                 # Vite on :5174 (separate terminal)
```

---

## Scripts

### `scripts/test_gen.sh` — interactive / per-domain runs

```bash
bash scripts/test_gen.sh                    # all domains
bash scripts/test_gen.sh linalg             # one domain
bash scripts/test_gen.sh sql linalg         # two domains
```

Key flags inside the script (edit before running):
| Line | Flag | Effect |
|------|------|--------|
| `--skip-cache` | force fresh LLM calls | use when re-generating with new prompts or a new model |
| `--skip-existing` | skip targets already in catalog | use for incremental runs |

Logs are written to `logs/batch_gen_YYYYMMDD_HHMMSS.log`.

### `scripts/batch_generate.py` — CLI with full options

```bash
python scripts/batch_generate.py [OPTIONS]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--domain` | all | Domain ID (repeatable: `--domain sql --domain linalg`) |
| `--n-targets` | 2 | Number of application nodes per domain |
| `--level` | domain default | Override level: `intro / core / college / research` |
| `--language` | `en` | Output language ISO code (`en`, `zh`, `fr`, …) |
| `--llm` | `claude_cli:claude-sonnet-4-6` | LLM backend (env: `CB_LLM`) |
| `--spl-dir` | `~/projects/digital-duck/SPL.py` | SPL.py root (env: `CB_SPL_DIR`) |
| `--skip-cache` | off | Bypass spl3 LLM cache — force fresh generation |
| `--skip-existing` | off | Skip targets already listed in `catalog.json` books |
| `--dry-run` | off | Print planned jobs without running |
| `--stop-on-error` | off | Abort batch on first failure |

---

## Cache behaviour

The spl3 content cache key is `(concept, language, llm)`.

- Same concept in **different languages** → separate cache entries (independent)
- Same concept with **different LLM** → separate cache entries (good for quality comparison)
- Re-running without `--skip-cache` reuses the cached version → fast (0 LLM calls)
- Re-running with `--skip-cache` regenerates everything fresh → slow but picks up prompt changes

**Rule of thumb:**
- First run for a new domain/language/model → always add `--skip-cache`
- Subsequent runs to fill missing concepts → omit `--skip-cache` (reuse hits, generate misses)

---

## Generating in multiple languages

```bash
# English (default)
python scripts/batch_generate.py --domain chinese_characters --skip-cache

# Chinese
python scripts/batch_generate.py --domain chinese_characters --language zh --skip-cache

# Both via test_gen.sh: edit the python call to add --language zh, then run
bash scripts/test_gen.sh chinese_characters
```

Output lands in separate directories:
```
public/domains/chinese_characters/output/intro.en/html/
public/domains/chinese_characters/output/intro.zh/html/
```

---

## Comparing LLM quality

```bash
# Generate with Sonnet (default)
python scripts/batch_generate.py --domain linalg --skip-cache

# Generate same domain with Haiku for comparison
python scripts/batch_generate.py --domain linalg --skip-cache \
    --llm claude_cli:claude-haiku-4-5-20251001
```

Both outputs are cached independently. Compare the HTML files in:
```
public/domains/linalg/output/college.en/html/
```

---

## Output locations

| Artifact | Path |
|----------|------|
| Concept book HTML (TOC index) | `public/domains/{id}/output/{level}.{lang}/html/book_{target}.html` |
| Individual concept HTML | `public/domains/{id}/output/{level}.{lang}/html/concept_{name}.html` |
| PDF | `public/domains/{id}/output/{level}.{lang}/pdf/book_{target}.pdf` |
| Concept graph | `public/domains/{id}/output/graph.html` |
| Generation logs | `logs/batch_gen_YYYYMMDD_HHMMSS.log` |
| SPL run logs | `~/.spl/logs/build_concept_book-*.md` |

---

## Regenerating graph.html (after color/structure changes)

```bash
bash scripts/sync_from_spl.sh
```

This copies `*_graph.yaml` from SPL.py and regenerates all `graph.html` files.
Then hard-refresh the browser (`Ctrl+Shift+R`).

---

## Completed runs

### Path A: sql (2026-06-26)
```bash
./scripts/test_gen.sh sql
```
```
LLM calls: 5  Latency: 89103ms
[ok] sql/web_application_backend — catalog updated
Batch complete: 2 succeeded, 0 failed.
```

### Path B: college_physics_ch1 (2026-06-26)
```bash
cd ~/projects/digital-duck/concept-book-press
python -B -m pipeline.cli pipeline --source pdf --pdf input/college-physics-2e.pdf --chapter 6-10 --check-yaml
```
```
LLM calls: 8  Latency: 146406ms
[ok] college_physics_ch1/approximation — catalog updated
Batch complete: 1 succeeded, 0 failed.
```

### chinese_characters EN + ZH (2026-06-26)
```bash
python scripts/batch_generate.py --domain chinese_characters --language en --skip-cache
python scripts/batch_generate.py --domain chinese_characters --language zh --skip-cache

```

### --llm ollama:gemma3 geometry

```bash
SPL_WHILE_MAX_ITER=30 python scripts/batch_generate.py --domain geometry --llm ollama:gemma3
```


### --llm ollama:gemma4 english_morphology
see `~/projects/digital-duck/SPL.py/example.env` for global env variable settings

```bash
SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain english_morphology --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain english_morphology --llm claude_cli:claude-sonnet-4-6


SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain calculus --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain mechanics --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain linalg --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain sage_learning --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain cs_data_structures --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain cs_algorithms --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain quantum_physics --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain chemistry_elements --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain biology --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain molecular_biology --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain medicine --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain lean_proving --llm ollama:gemma4

SPL_WHILE_MAX_ITER=50 SPL_MAX_LLM_CALLS=50 \
python scripts/batch_generate.py --domain music_theory --llm ollama:gemma4


```