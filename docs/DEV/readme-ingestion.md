# Textbook Ingestion Pipeline — digi-duck-press

## Vision

Migrate existing open-source textbooks into ConceptBook by extracting concept graphs via LLM, then regenerating leveled content. This expands ConceptBook from hand-authored domains to any textbook with a permissive license.

## Architecture: Two Repos

```
digi-duck-press (authoring)          concept-book (consumption)
┌──────────────────────────┐         ┌──────────────────────────┐
│  Ingest → Extract → Edit │ ──────► │  Serve → Navigate → Read │
│                          │  graph  │                          │
│  textbook → graph.yaml   │  .yaml  │  graph.yaml → graph.html │
│  graph.yaml → content    │  + HTML │  concept_*.html          │
│                          │         │  book_*.html             │
└──────────────────────────┘         └──────────────────────────┘
```

**digi-duck-press** owns the content creation pipeline:
- Textbook ingestion (parse, chunk, extract)
- Concept graph extraction (LLM-powered)
- Graph authoring UI (create, edit, validate)
- Content generation (leveled book generation via SPL workflow)
- Export: `graph.yaml` + generated HTML → concept-book's `public/domains/`

**concept-book** owns the reader experience:
- Graph navigator (vis.js)
- Book viewer (sidebar + inline content)
- Domain catalog, filtering, settings
- Static deployment (GitHub Pages)

## Pipeline Stages

### Stage 1: Ingest

Parse a textbook into structured chunks suitable for LLM analysis.

**Input formats** (priority order):
1. HTML (OpenStax, many OER) — cleanest structure, headings/sections map naturally
2. LaTeX (MIT OCW, arXiv) — rich structure, math preserved
3. PDF (fallback) — requires OCR or text extraction, loses structure
4. EPUB — essentially HTML in a zip

**Output:** A sequence of labeled chunks:
```yaml
chunks:
  - id: ch01_s01
    title: "1.1 What is Physics?"
    level: chapter/section/subsection
    text: "Physics is the study of..."
    math_blocks: ["F = ma", "E = mc^2"]
    references: ["ch01_s02", "ch01_s03"]
```

**Key libraries:**
- HTML: `beautifulsoup4` — parse headings, sections, figures
- LaTeX: `pylatexenc` or `plasTeX` — convert to structured text
- PDF: `pymupdf` or `pdfplumber` — text extraction with layout awareness
- EPUB: `ebooklib` — extract HTML chapters

### Stage 2: Extract Concept Graph

LLM analyzes the chunks to produce a concept graph.

**Approach:** Two-pass extraction:

**Pass 1 — Concept identification:**
```
Given this textbook section, identify the key concepts taught.
For each concept, provide:
- id: snake_case identifier
- label: human-readable name
- defines: one-sentence definition
- kind: primitive | concept | application
```

**Pass 2 — Prerequisite mapping:**
```
Given these concepts from a textbook, identify the prerequisite
relationships. For each concept, list which other concepts must
be understood first (composed_of).
```

**Output:** `graph.yaml` in the standard format:
```yaml
domain: openstax_physics
primitives:
  displacement:
    defines: Change in position of an object
    tier: 0
concepts:
  velocity:
    defines: Rate of change of displacement with respect to time
    composed_of: [displacement, time_interval]
    tier: 1
applications:
  projectile_motion:
    defines: Motion under gravity with initial velocity
    needs: [velocity, acceleration, free_fall]
    tier: 3
```

**Validation:** Run through `concept_graph.py` to verify:
- Acyclic (no circular dependencies)
- Reducible (all concepts trace back to primitives)
- Connected (no orphan clusters)

**Iteration:** If validation fails, feed errors back to LLM for repair.

### Stage 3: Human Review (Graph Authoring UI)

A web UI for reviewing and editing the extracted graph.

**MVP features:**
- Visual graph editor (add/remove nodes, edit edges)
- Node property editor (label, defines, kind, tier)
- Validation panel (shows acyclic/reducible/connected status live)
- Diff view: original textbook chunk ↔ extracted concept
- Export to `graph.yaml`

**Future:**
- Drag-and-drop graph layout
- Merge/split concepts
- Import from multiple textbooks into one graph (compose)
- Version history

### Stage 4: Generate Content

Run the existing `build_concept_book.spl` workflow against the new graph.

```bash
spl3 run spl/build_concept_book.spl \
  --tools spl/tools.py \
  --param domain_yaml=openstax_physics_graph.yaml \
  --param target=projectile_motion \
  --param lvl=core \
  --param language=en \
  --param output_dir=public/domains/openstax_physics/output/core.en/html
```

This step is already implemented. The only new work is wiring it into the press pipeline.

### Stage 5: Publish to ConceptBook

Copy the generated artifacts into concept-book's domain structure:

```
concept-book/public/domains/openstax_physics/
  input/graph.yaml
  output/graph.html
  output/core.en/html/
    concept_velocity.html
    concept_acceleration.html
    book_projectile_motion.html
```

Update `catalog.json` with the new domain entry.

## Target Textbook Sources

| Source | License | Subjects | Format | Priority |
|--------|---------|----------|--------|----------|
| OpenStax | CC BY 4.0 | 50+ textbooks (physics, bio, chem, econ, etc.) | HTML/PDF | High |
| MIT OCW | CC BY-NC-SA | 2500+ courses | PDF/HTML | High |
| Bookdown / R community | Various CC | Statistics, data science | HTML | Medium |
| Open Textbook Library | Various CC | 1000+ textbooks | PDF/HTML | Medium |
| CK-12 | CC BY-NC | K-12 STEM | HTML | Medium |
| NCERT (India) | Govt/open | K-12 all subjects | PDF | Medium |

**Recommended first target:** OpenStax — well-structured HTML, CC BY 4.0, covers intro-to-college level across many subjects. Start with OpenStax Physics (maps naturally to our `core` and `college` levels).

## Implementation Plan

### Phase 1: Extraction Prototype (Week 1-2)
- [ ] Set up `digi-duck-press` repo
- [ ] HTML parser for OpenStax textbooks
- [ ] LLM extraction prompt (two-pass: concepts, then prerequisites)
- [ ] Output validator (acyclic, reducible checks)
- [ ] End-to-end test: OpenStax Physics Chapter 1 → graph.yaml

### Phase 2: Pipeline Automation (Week 3-4)
- [ ] CLI tool: `press ingest <url_or_path>` → chunks
- [ ] CLI tool: `press extract <chunks>` → graph.yaml
- [ ] CLI tool: `press validate <graph.yaml>` → report
- [ ] CLI tool: `press generate <graph.yaml>` → concept-book HTML
- [ ] CLI tool: `press publish <graph.yaml>` → copy to concept-book

### Phase 3: Graph Authoring UI (Week 5-8)
- [ ] Web UI for graph editing (likely Vite + vanilla JS, same stack as concept-book)
- [ ] Visual node/edge editor
- [ ] Live validation
- [ ] Side-by-side: source text ↔ extracted graph

### Phase 4: Scale (Week 9+)
- [ ] Batch processing: ingest entire OpenStax catalog
- [ ] Multi-format support (LaTeX, PDF, EPUB)
- [ ] Quality scoring: compare extracted graph against textbook TOC
- [ ] Community contributions: users submit graph corrections

## Open Questions

1. **Graph granularity:** How deep should extraction go? Chapter-level concepts? Section-level? Paragraph-level? Recommendation: section-level (matches the `concept` grain in current graphs — ~20-40 nodes per domain).

2. **Attribution:** How to credit the source textbook? Add a `source` field to `graph.yaml` and display it in the book viewer.

3. **Content reuse vs. regeneration:** Should we excerpt the original textbook text (attribution-heavy) or regenerate entirely from the concept graph (our current approach)? Recommendation: regenerate — it produces leveled content in our style, avoids licensing complexity, and the graph is the real value, not the prose.

4. **Incremental updates:** When a textbook gets a new edition, how to update the graph without losing manual edits? Recommendation: version the graph.yaml, diff against new extraction, surface changes for human review.

5. **Quality bar:** What's the minimum graph quality to publish? Recommendation: must pass acyclic + reducible + manual spot-check of 5 random concepts. Flag as "auto-extracted, community-reviewed" until vetted.
