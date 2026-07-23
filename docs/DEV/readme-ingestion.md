# Textbook Ingestion Pipeline — concept-book-press

## Status

**Phase 1 complete.** The ingestion pipeline is implemented and tested in [concept-book-press](~/projects/digital-duck/concept-book-press). Two chapters of OpenStax College Physics 2e have been ingested, extracted, validated, and published to ConceptBook.

**Re-ingest needed (Path-B quality gate).** Pass 1 now captures `section_ids` per concept and emits `concept_sources.yaml` (the `concept-name → chunks.yaml-section` mapping required for `spl3 compare`). Chapters 1 and 2 must be re-ingested to produce this file. See [Re-ingesting existing chapters](#re-ingesting-existing-chapters) below.

## Architecture: Two Repos

```
concept-book-press (authoring)          concept-book (consumption)
┌──────────────────────────┐         ┌──────────────────────────┐
│  Ingest → Extract → Edit │ ──────► │  Serve → Navigate → Read │
│                          │  graph  │                          │
│  textbook → graph.yaml   │  .yaml  │  graph.yaml → graph.html │
│  graph.yaml → content    │  + HTML │  concept_*.html          │
│                          │         │  book_*.html             │
└──────────────────────────┘         └──────────────────────────┘
```

**concept-book-press** (`~/projects/digital-duck/concept-book-press`) owns the content creation pipeline:
- Textbook ingestion (PDF parsing via pymupdf, HTML via beautifulsoup4)
- Concept graph extraction (two-pass LLM via Claude CLI)
- Graph validation (acyclic, reducible, connected — via networkx)
- Export: `graph.yaml` → concept-book's `public/domains/`

**concept-book** owns the reader experience:
- Graph navigator (vis.js)
- Book viewer (sidebar + inline content)
- Multi-language generation (any language at the click of a button)
- Domain catalog, filtering, settings
- Static deployment (GitHub Pages)

## Pipeline (Implemented)

### Usage

```bash
cd ~/projects/digital-duck/concept-book-press
conda activate spl123

# List chapters in a PDF
python -B -m pipeline.cli list-chapters --pdf input/college-physics-2e.pdf

# Full pipeline: ingest → extract → validate
python -B -m pipeline.cli pipeline --source pdf --pdf input/college-physics-2e.pdf --chapter 1

# Output lands in output/{book-slug}/ch{N}/
#   chunks.yaml  — structured sections from PDF
#   graph.yaml   — concept graph extracted by LLM
```

See [concept-book-press/docs/openstax/readme.md](~/projects/digital-duck/concept-book-press/docs/openstax/readme.md) for the full guide.

### Stage 1: Ingest

Parses a PDF textbook chapter into structured chunks using TOC bookmarks.

- **PDF** (primary): `pymupdf` reads bookmarks, extracts text per section, cleans headers/footers
- **HTML** (secondary): `beautifulsoup4` scraper for OpenStax web pages (kept as fallback)
- **Output**: `chunks.yaml` with `{source_pdf, chapter_number, chapter_title, source_attribution, chunks: [{section_id, section_title, text, page_start, page_end}]}`

### Stage 2: Extract Concept Graph

Two-pass LLM extraction via Claude CLI (`claude --print --model sonnet`):

- **Pass 1** — Identify concepts: `{id, label, defines, kind, section_ids}` for each concept.
  Section headers in the prompt now include `[id=<section_id>]` so the LLM can attribute each concept to the section(s) where it is taught.
- **Pass 2** — Map prerequisites: assign `composed_of`/`needs` and compute tiers

Output:
- `graph.yaml` — concept graph in ConceptBook format (primitives/concepts/applications)
- `concept_sources.yaml` — `concept_id → {label, sections: [{id, title}]}` mapping (prerequisite for the Path-B quality gate)

### Stage 3: Validate

NetworkX-based structural checks:
- Acyclic (no circular dependencies)
- Reducible (all concepts trace back to primitives)
- Connected (warns about disconnected components)
- Valid references (all edges point to real nodes)
- Tier consistency (tiers respect dependency ordering)

### Stage 4: Publish to ConceptBook

```bash
DOMAIN=college_physics_ch01
DEST=~/projects/digital-duck/concept-book/public/domains/$DOMAIN

mkdir -p $DEST/input $DEST/output
cp output/college-physics-2e/ch1/graph.yaml         $DEST/input/graph.yaml
cp output/college-physics-2e/ch1/concept_sources.yaml $DEST/input/concept_sources.yaml

# Generate vis.js navigator
python ~/projects/digital-duck/concept-book/scripts/concept_graph.py \
  --domain $DEST/input/graph.yaml \
  visualize --format html --output $DEST/output/graph.html
```

Then add the domain to `catalog.json` and generate concept books via the ConceptBook UI or SPL CLI.

---

## Re-ingesting existing chapters

Chapters 1 and 2 were ingested before `concept_sources.yaml` was introduced. `chunks.yaml` was not persisted in the original run, so a full re-ingest (PDF parse + LLM extract) is required.

```bash
conda activate spl123

cd ~/projects/digital-duck/concept-book-press

python -B -m pipeline.cli pipeline \
  --source pdf --pdf input/college-physics-2e.pdf --chapter 1,2 --check-yaml

python -B -m pipeline.cli pipeline \
  --source pdf --pdf input/college-physics-2e.pdf --chapter 3-5 --check-yaml
```

Output lands in `output/college-physics-2e/ch{N}/`:
- `chunks.yaml` — structured sections (now persisted)
- `graph.yaml` — updated concept graph (may differ slightly due to LLM non-determinism)
- `concept_sources.yaml` — concept → section mapping (new)

Validation runs automatically as Step 3 of the pipeline. After it completes, publish both chapters:

```bash
cd ~/projects/digital-duck/concept-book-press

# Chapter 1
DEST=~/projects/digital-duck/concept-book/public/domains/college_physics_ch01
cp output/college-physics-2e/ch1/graph.yaml           $DEST/input/graph.yaml
cp output/college-physics-2e/ch1/concept_sources.yaml $DEST/input/concept_sources.yaml
python ~/projects/digital-duck/concept-book/scripts/concept_graph.py \
  --domain $DEST/input/graph.yaml \
  visualize --format html --output $DEST/output/graph.html

# Chapter 2
DEST=~/projects/digital-duck/concept-book/public/domains/college_physics_ch02
cp output/college-physics-2e/ch2/graph.yaml           $DEST/input/graph.yaml
cp output/college-physics-2e/ch2/concept_sources.yaml $DEST/input/concept_sources.yaml
python ~/projects/digital-duck/concept-book/scripts/concept_graph.py \
  --domain $DEST/input/graph.yaml \
  visualize --format html --output $DEST/output/graph.html
```

Generate contents:

```bash
cd ~/projects/digital-duck/concept-book

python scripts/batch_generate.py  --language en --skip-cache --llm ollama:gemma4 \
    --domain college_physics_ch01 \
    --domain college_physics_ch02

```

## Results So Far

| Chapter | Nodes | Edges | Primitives | Concepts | Applications | Max Tier |
|---------|-------|-------|------------|----------|--------------|----------|
| Ch1: Nature of Science | 22 | 21 | 4 | 17 | 1 | 3 |
| Ch2: Kinematics | 23 | 31 | 6 | 15 | 2 | 7 |

Both chapters pass validation. Concept books generated in English and Chinese.

## Attribution

OpenStax textbooks are CC BY 4.0. Each `graph.yaml` includes a `source` block:

```yaml
source:
  title: "College Physics 2e"
  authors: "OpenStax"
  license: "CC BY 4.0"
  url: "https://openstax.org/details/books/college-physics-2e"
  attribution: "Access for free at openstax.org."
```

The attribution is displayed in ConceptBook's domain page header.

## Target Textbook Sources

| Source | License | Subjects | Format | Priority |
|--------|---------|----------|--------|----------|
| [OpenStax](https://openstax.org) | CC BY 4.0 | 50+ textbooks (physics, bio, chem, econ, etc.) | PDF | High |
| [MIT OCW](https://ocw.mit.edu) | CC BY-NC-SA | 2500+ courses | PDF/HTML | High |
| [Open Textbook Library](https://open.umn.edu/opentextbooks) | Various CC | 1000+ textbooks | PDF/HTML | Medium |
| [CK-12](https://www.ck12.org) | CC BY-NC | K-12 STEM | HTML | Medium |
| [NCERT (India)](https://ncert.nic.in) | Govt/open | K-12 all subjects | PDF | Medium |

**Discovery tool** (aggregator — links to original sources, does not host content directly):

| Tool | Coverage | Use |
|------|----------|-----|
| [OER Commons](https://www.oercommons.org/hubs/open-textbooks) | K-12 + university, cross-subject, indexes OpenStax / MIT OCW / MERLOT and hundreds more | Search and filter by subject, grade level, and license before pulling from the original source; license varies per item — filter for CC BY or CC BY-SA before ingesting |

## Next Steps

### Phase 2: Scale
- Batch processing: ingest full OpenStax books (30+ chapters each)
- Per-chapter output avoids overwriting (`output/{book}/ch{N}/`)
- Multi-book graph composition (merge chapter graphs into one domain)

### Phase 3: Graph Authoring UI
- Web UI for reviewing and editing extracted graphs
- Visual node/edge editor with live validation
- Side-by-side: source text ↔ extracted concepts

### Phase 4: Quality & Community
- Quality scoring: compare extracted graph against textbook TOC
- Community contributions: users submit graph corrections
- Incremental updates: diff new editions against existing graphs
