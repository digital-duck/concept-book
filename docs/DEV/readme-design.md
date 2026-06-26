# concept-book — Design Document

> Single source of truth for how concept-book is designed, built, and maintained.
> Historical implementation scratchpad (archived): [`docs/archive/readme-plan-2026-06-13.md`](../archive/readme-plan-2026-06-13.md)

---

## What is concept-book?

**concept-book** is a web-app portal that lets any learner explore a knowledge
domain through its **concept graph** — a directed acyclic graph (DAG) where
nodes are concepts (primitive, concept, application) and edges are prerequisite
relationships.

The learner:
1. Picks a domain (linear algebra, Chinese characters, mechanics, …)
2. Clicks any concept in the interactive graph
3. Sees the exact learning path — the ordered minimum set of prerequisites
4. Reads the LLM-written, verifier-checked section for each concept
5. Chooses their level and language; the book regenerates on demand

**Content engine:** the `SPL.py` repo (`cookbook/74_concept_book/`) generates all
domain graphs. concept-book is the **web-app layer** — it hosts, presents, and
triggers generation on demand.

---

## Core design principles

These emerged from the first working prototype (linalg and geometry graphs,
2026-06-13) and govern all future decisions.

### The graph IS the curriculum

In a conventional textbook, a visualization is supplementary material — a
chapter map, a mind-map sidebar. Here the graph is primary. The YAML concept
graph is the authoritative source; chapter ordering, learning paths, and
dependency chains all derive from it. The graph is not a picture of the
curriculum — it *is* the curriculum.

**Implication:** the graph navigator is the home screen, not a feature buried
in a sidebar.

### Click = personalized path, not a fixed chapter sequence

When a learner clicks any node, they see the BFS shortest path from the graph's
roots to that concept — the exact minimum set of prerequisites in the right
order, personalized to that target. A learner who wants `gram_schmidt` (BFS
level 5 in linalg) sees an 11-step path; a learner who wants `linear_combination`
(BFS level 1) sees a 3-step path. No two learners need to follow the same
sequence. This is structurally impossible in a textbook — it requires the DAG.

### Depth is visible at a glance

A node at BFS level 5 communicates "plan accordingly" without any annotation.
No chapter number, difficulty star, or prerequisite appendix conveys this as
directly. Vertical position in the hierarchical layout *is* the difficulty
signal, derived automatically from graph structure, not editorially assigned.

### Highlighted paths feel like neurons firing

When a node is selected, ancestors highlight in yellow-orange, tracing back to
the primitives. The visual effect — a chain lighting up across the graph —
mirrors how understanding actually works: prerequisite knowledge activating in
sequence. The highlight is not decorative; it reflects the cognitive reality of
building on prior knowledge. Keep it fast and immediate — the snap IS the
feedback.

### Three layers, visible simultaneously

| Layer | Shape | Color | Meaning |
|---|---|---|---|
| **Primitive** | rectangle | green | What we assume — axioms, undefined terms |
| **Concept** | oval | blue | What we build — derived ideas, theorems |
| **Application** | rectangle | orange | What we unlock — real-world uses |

Most curricula flatten these into one undifferentiated list. Separating them
visually makes the structure of a knowledge domain legible at a glance.

### The highlight is bidirectional in intent

The current implementation highlights **ancestors** (what I need first —
upstream dependencies). The graph also supports **descendants** (what this
concept unlocks — downstream fan-out). Both directions are load-bearing:

- **Top-down (ancestors lit):** "I want to learn X — what must I learn first?"
- **Bottom-up (descendants lit):** "I know X — what can I now learn next?"

Phase 2 adds a **"What does this unlock?"** toggle that switches the highlight
from ancestor-path to descendant-fan. Especially powerful for elemental
primitives in the Chinese characters domain.

---

## Content generation pipeline

```
{domain}_graph.yaml          ← declarative domain data (YAML, no Python)
        ↓
spl/build_concept_book.spl   ← LLM orchestration: graph → verified sections
        ↓  (spl3 run, streamed via SSE)
public/domains/{id}/
  output/{level}.{language}/html/
    concept_{name}.html      ← one self-contained page per concept
    book_{target}.html       ← full book index (TOC sidebar + MathJax)
```

The `spl/` folder in this repo is a **fork** of
`SPL.py/cookbook/74_concept_book/`, trimmed to what the web app needs:

| File | Role |
|---|---|
| `spl/build_concept_book.spl` | workflow — `@lvl` + `@language` inputs, generates concept pages + book index |
| `spl/graph_lib.py` | domain-agnostic graph algorithms (YAML → NetworkX DAG) |
| `spl/level_profiles.py` | 4 learner-progression level profiles |
| `spl/tools.py` | SPL tool registrations wrapping `graph_lib` |

---

## `level` replaces `style`

SPL.py recipe 74 used `@style` with 7 profiles (`textbook`, `feynman`,
`flashcard`, `instructor`, `research`, `middle_school`, `high_school`) —
designed for one-shot CLI invocation where the author picks a format.

The web app replaces this with `@lvl` and 4 **learner-progression levels** that
are domain-agnostic — the same four work for linear algebra, Chinese characters,
or English morphology:

| Level | Audience | Length | Structure |
|---|---|---|---|
| `intro` | complete beginner | 150–250 words | Example → Picture → Rule → Try it |
| `core` | ready for structured reasoning | 250–350 words | Hook → Definition → Example → Why → Practice |
| `college` | undergraduate with domain background | 300–400 words | Definition → Example → Theorem → Lab |
| `research` | graduate / researcher | 200–300 words | Definition → Theorem → Proof → Remark |

Source: `spl/level_profiles.py` → `level_instruction(level)`, called via
`CALL get_level_guide(@lvl)` in the workflow.

---

## `language` as a workflow input

`@language TEXT DEFAULT 'en'` is an explicit workflow input (ISO 639-1 code).
It threads into every `GENERATE` prompt:

```
Write the narrative in language: {language}
Mathematical notation and LaTeX remain in their standard form regardless of language.
```

The API exposes both `level` and `language` as query parameters:

```
GET /api/generate?domain=linalg&target=spectral_theorem&level=college&language=en
GET /api/generate?domain=chinese_characters&target=phono_semantic_principle&level=intro&language=zh
```

---

## Output directory layout

Generated artifacts are namespaced by `{level}.{language}` so multiple
variants coexist under one domain without overwriting each other:

```
public/domains/{id}/
  graph.html                          ← vis.js navigator (synced from SPL.py, static)
  graph.yaml                          ← domain graph source
  output/
    college.en/html/
      concept_linear_combination.html
      concept_basis.html
      ...
      book_spectral_theorem.html      ← full book (TOC sidebar + MathJax)
    intro.zh/html/
      concept_线性组合.html
      ...
      book_spectral_theorem.html
```

The catalog records which variants have been generated:

```json
{
  "id": "linalg",
  "books": [
    { "target": "spectral_theorem", "file": "output/college.en/html/book_spectral_theorem.html" }
  ],
  "generated_concepts": [
    { "name": "linear_combination", "file": "output/college.en/html/concept_linear_combination.html" }
  ]
}
```

---

## API

```
GET /api/generate?domain=&target=&level=&language=&skip_cache=
```

Streams `spl3 run` stdout as Server-Sent Events:

| Event | Payload |
|---|---|
| `started` | `{domain, target}` |
| `log` | `{message}` — each stdout line |
| `done` | `{domain, target}` — triggers catalog update + page reload |
| `gen_error` | `{message}` — non-zero exit |

On `done`, `catalog_svc.mark_book_generated()` updates `catalog.json` with the
new `{level}.{language}` variant.

```
GET /api/domains            → list of catalog entries
GET /api/domains/{id}/status → single domain entry
```

---

## Syncing domain content from SPL.py

`graph.html` (vis.js navigator) and `graph.yaml` are generated in SPL.py and
synced here:

```bash
bash scripts/sync_from_spl.sh
# or: SPL_DIR=/path/to/SPL.py bash scripts/sync_from_spl.sh
```

`book_*.html` and `concept_*.html` are **not synced** — they are generated on
demand by the API so each deployment chooses its own level + language.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `CB_SPL_DIR` | `~/projects/digital-duck/SPL.py` | Path to SPL.py repo (used by sync script) |
| `CB_PUBLIC_DOMAINS` | `./public/domains` | Path to the domains directory |
| `CB_LLM` | `ollama/gemma3` | LLM backend passed to `spl3 run --llm` |

Set in `.env` at the repo root or export before starting the API.

---

## Domain spotlight — Chinese characters (the founding use-case)

The Chinese characters domain (`chinese_characters_graph.yaml`) is the reason
concept-book exists. It is the direct evolution of the ZiNets research project
(`zinets_vis`) and the clearest proof that the concept-graph model makes
language learning both more rigorous and more fun — especially for STEM-minded
learners.

### The elemental character model

Chinese characters have the same structure as chemical elements in a periodic
table:

| Chemistry | Chinese characters |
|---|---|
| Elements (H, O, C, …) | Elemental characters (木, 水, 火, 口, 日, 月, 马, …) |
| Compounds (H₂O, CO₂, …) | Compound characters (林 = 木+木, 休 = 人+木, 明 = 日+月) |
| Molecular formula = pieces multiset | `composed_of: [木, 木]` |
| Irreducibility theorem | 马 is a SOUND-lender — not reducible to pictograms |
| Periodic table | The concept graph |

**Elemental characters** are the primitives — a curated brick set of ~11
semantic pictograms (FORM) + 马 as the irreducible SOUND radical. Every
compound character decomposes into this brick set. Learning the ~12 elementals
unlocks the ability to decode hundreds of characters by structure alone.

This framing makes Chinese acquisition feel like STEM: learn a small, closed
set of building blocks, then derive everything else. The concept graph makes
the derivation visible and navigable.

### Two navigation modes

**Top-down (decompose):** *"I see 森 — what are its building blocks?"*
- Click `森` → learning path: `木` → `林` → `森`
- Rule: tripling = intensification — the simplest LEGO rule of all

**Bottom-up (compose):** *"I know 木 — what can I build with it?"*
- Click `木` → successors fan out to `林`, `休`, `森`, `朴`, `机`, …
- Each successor shows its full brick list

Both directions are in the graph data today. Phase 2 adds an explicit
**"What can I build?"** button that inverts the view to the successors fan-out.

### Two graph views — vis.js + ECharts

| View | Library | What it shows | When to use |
|---|---|---|---|
| **Prerequisite graph** | vis.js | What must I learn first? (DAG, strict order) | Before studying a character |
| **Character network** | ECharts | What does this character appear in? (web, discovery) | After studying, for vocabulary building |

These are complementary, not competing. The vis.js graph is the *learning path
navigator*; the ECharts network is the *discovery browser* showing the
character in its natural habitat. Together they give structure (graph) and
context (network). Phase 2 implementation: add a tab toggle on the Domain page
for Chinese characters; ECharts data can be extracted from `zinets_vis`.

### Why this works for STEM-minded learners

Traditional textbooks present characters in frequency or topic order — neither
respects structural dependencies. The concept graph enforces the right order
automatically: primitives first, compositions next, applications last. For a
STEM learner this is isomorphic to how they already learn: you don't learn
integration before differentiation; you don't learn 林 before 木.

`gap(graph, target, learner_state)` (already in `graph_lib.py`) makes this
personalised: it computes exactly which elementals the learner still needs
given what they already know.

---

## Textbook ingestion pipeline

> Full details: [`docs/DEV/readme-ingestion.md`](readme-ingestion.md)

Concept graphs can be authored from scratch (YAML) or **extracted from existing
open-source textbooks**. Ingestion lives in a separate repo —
`concept-book-press` — to keep authoring concerns out of the reader portal.

```
concept-book-press (authoring)          concept-book (consumption)
┌──────────────────────────┐         ┌──────────────────────────┐
│  Ingest → Extract → Edit │ ──────► │  Serve → Navigate → Read │
│  textbook → graph.yaml   │  .yaml  │  graph.yaml → graph.html │
│  graph.yaml → content    │  + HTML │  concept_*.html          │
└──────────────────────────┘         └──────────────────────────┘
```

### Pipeline stages

| Stage | Tool | Output |
|---|---|---|
| **Ingest** | `pymupdf` (PDF) / `beautifulsoup4` (HTML) | `chunks.yaml` — structured sections |
| **Extract** | Two-pass Claude CLI (identify concepts → map prerequisites) | `graph.yaml` in ConceptBook schema |
| **Validate** | NetworkX: acyclic, reducible, connected, tier consistency | Pass/fail + warnings |
| **Publish** | Copy `graph.yaml` → `public/domains/{id}/`, generate `graph.html` | Domain live in portal |

### Target textbook sources

| Source | License | Priority |
|---|---|---|
| [OpenStax](https://openstax.org) | CC BY 4.0 | High — 50+ textbooks, proven PDF pipeline |
| [MIT OCW](https://ocw.mit.edu) | CC BY-NC-SA | High — 2500+ courses |
| [Open Textbook Library](https://open.umn.edu/opentextbooks) | Various CC | Medium |
| [CK-12](https://www.ck12.org) | CC BY-NC | Medium — K-12 STEM, HTML |
| [NCERT (India)](https://ncert.nic.in) | Govt/open | Medium — K-12 all subjects |
| [OER Commons](https://www.oercommons.org/hubs/open-textbooks) | varies | Discovery only — aggregates the above and hundreds more; filter by license before ingesting |

### Attribution

Every `graph.yaml` extracted from an existing textbook carries a `source` block:

```yaml
source:
  title: "College Physics 2e"
  authors: "OpenStax"
  license: "CC BY 4.0"
  url: "https://openstax.org/details/books/college-physics-2e"
  attribution: "Access for free at openstax.org."
```

This is displayed in the domain page header in the portal.

---

## Academic paper — ConceptBook (spl4ed)

> Paper files: `zinets/docs/conference/SPL-for-Education/`

**Title:** *ConceptBook: A Graph-First Framework for AI-Generated Curricula*
**Author:** Wen G. Gong
**Primary venue:** [AIED 2027](https://www.aied-conference.org) (AI in Education, Springer LNCS, est. deadline Feb 2027)
**Secondary:** [TMLR](https://jmlr.org/tmlr/) (rolling) · [EAAI-27](https://aaai.org/conference/aaai/aaai-27/eaai-27-call/) (derived short paper, deadline Sep 8 2026)

### Core thesis

> Teaching and learning any domain reduces to two acts: **authoring** a concept-graph
> (a YAML file of primitives, compositions, verifiers, and a capstone), and **running**
> a single SPL workflow that produces a prerequisite-ordered, LLM-generated,
> verifier-checked book — for any domain, without changing a line of code.

### Key claims

| | Claim |
|---|---|
| C1 | The YAML is the curriculum — primitives, composition edges, verifier tags, capstone |
| C2 | One workflow (`build_concept_book.spl`), any domain — adding a domain = writing a YAML file |
| C3 | Teaching order is a graph algorithm (`productivity_order`), not editorial judgment |
| C4 | "Learn bricks + principle, decode thousands" — the LEGO payoff shape holds across STEM and language |
| C5 | Language learning becomes a STEM discipline — `verify_character_lego` handles Chinese and Latin word-sums with zero code changes |

### Contributions

| # | Contribution | Evidence |
|---|---|---|
| 1 | Concept-graph schema as a complete curriculum specification | 10 domain YAMLs; 40/40 regression checks |
| 2 | Domain-agnostic SPL workflow | `spl3 run build_concept_book.spl --param domain_yaml={any}` |
| 3 | Graph-algorithm teaching order | `productivity_order` / `learning_path` across math, language, music |
| 4 | Cross-domain verifier dispatch | structural, SymPy, Sage, Lean in one `verify_content` call |
| 5 | 10 working domains | concept-book portal; live demo |
| 6 | Content cache | zero LLM calls on re-run of a cached concept |

### Venue strategy

| Venue | Paper | Deadline | Notes |
|---|---|---|---|
| **EAAI-27** | A (short, derived) | Sep 8 2026 | 7pp; double-blind; Montréal Feb 2027; pdflatex — romanize inline CJK |
| **AIED 2027** | B (full vision) | est. Feb 2027 | 12pp; Springer LNCS; xelatex ✓ — CJK renders natively |
| **TMLR** | fallback | rolling | pdflatex — romanize inline CJK; needs stronger empirical evaluation |

Paper B (`spl4ed-paper-v0.5.md`) is the full ConceptBook vision. Paper A is carved out
from it closer to the EAAI-27 deadline. No dual submission (EAAI policy).

### Status

Current draft: `spl4ed-paper-v0.5.md`. Review feedback in `review-feedback/`.
Build pipeline: `build_md2tex.sh` → `polish_tex.py` → `build_tex2pdf.sh` (xelatex + Noto Sans CJK SC for inline Chinese).

---

## Future phases

| Phase | Focus |
|---|---|
| Phase 2 | BookViewer panel, language picker UI, bidirectional highlight toggle, ECharts view for Chinese |
| Phase 3 | Learning path sidebar (postMessage from iframe), notes persistence (localStorage), progress tracking |
| Phase 3+ | **Chat interface** — `answer_on_demand.spl` migration: NL query → target concept → personalized lesson for the learning gap |
| Phase 4 | School deployment (FastAPI on Raspberry Pi, nginx for static assets), Momagrid integration |
| Phase 5 | `concept_net` repo — multi-domain learning network; cross-domain composition paths |

### Planned workflow: `answer_on_demand.spl`

Source: `SPL.py/cookbook/71_linalg_concept_book/answer_on_demand.spl`
Target: `concept-book/spl/answer_on_demand.spl`

A chat-style interface that replaces (or supplements) the current target-concept picker. The learner types a natural-language question; the workflow resolves it to the right concept node and generates only the sections they still need.

**Five-step pipeline:**

1. **Resolve** — LLM maps the NL question to a concept ID in the domain graph
   (`resolve_target(question, concept_list)`)
2. **Assert** — deterministic check that the resolved ID actually exists
   (`ASSERT in_graph(@domain_yaml, @target)`)
3. **Gap** — compute the minimal prerequisite set the learner still needs
   (`setup_answer_path(@domain_yaml, @target, @learner_state)`)
4. **Generate** — one section per gap concept in dependency order, with
   domain verifier applied per concept
5. **Capstone** — target concept section closes the lesson

This turns concept-book from a **book-generator** into a **personal tutor**:
instead of generating all N sections, it generates only the M sections the
learner still needs — potentially zero LLM calls if `@learner_state` covers
all prerequisites.

**Status — SPL layer complete; UI/API integration pending**

| Item | Status |
|---|---|
| `answer_on_demand.spl` updated to match `build_concept_book.spl` patterns | ✅ done |
| `@style` → `@lvl`, `COMMIT` → `RETURN`, `SOLVE` → `CALL` throughout | ✅ done |
| `@domain_yaml`, `@language`, `@primitive_budget` inputs added | ✅ done |
| `@learner_state LIST` → `@learner_state TEXT DEFAULT '[]'` (JSON string) | ✅ done |
| `write_section` signature extended: `(concept, label, context, style_guide, language)` | ✅ done |
| `verify_math(@section)` → `verify_section(@section, @domain_yaml)` | ✅ done |
| `resolve_target` prompt generalised (removed "linear algebra" hardcoding) | ✅ done |
| 4 new tools added to `spl/tools.py` (see table below) | ✅ done |
| Copy `.spl` to `concept-book/spl/answer_on_demand.spl` | ⬜ Phase 3+ |
| New API endpoint `GET /api/ask?domain=&question=&level=&language=&learner_state=` | ⬜ Phase 3+ |
| Chat input UI — text box above "Generate Book" sidebar, SSE stream | ⬜ Phase 3+ |
| `@learner_state` persisted in `localStorage` (Phase 3 progress tracking feeds it) | ⬜ Phase 3+ |

**New tools added to `spl/tools.py`:**

| Tool | What it does |
|---|---|
| `concept_names_list(domain_yaml)` | Loads domain if not cached; returns primitives + concepts as newline-separated list — feeds `resolve_target` prompt |
| `in_graph(domain_yaml, target)` | Returns `"yes"` or `""` (falsy) — used by `ASSERT in_graph(...) OTHERWISE ...` |
| `setup_answer_path(domain_yaml, target, learner_state_json)` | Calls `graph_lib.learning_path`, stores gap (excl. target) as `cache["answer_order"]`, returns length |
| `answer_path_item(domain_yaml, index)` | Returns concept at index in `answer_order` — mirrors `order_item` pattern from `build_concept_book.spl` |

Private helper `_ensure_domain(domain_yaml)` loads and validates a domain without computing a teaching order, so answer_on_demand tools work without `setup_domain` being called first.

---

## Related repos

| Repo | Role |
|---|---|
| `digital-duck/SPL.py` | Content engine — generates YAML graphs, HTML navigators |
| `digital-duck/concept-book` | This repo — web-app portal |
| `Proj-ZiNets/zinets_vis` | Precedent — Chinese character learning web-app (ECharts network view) |
| `digital-duck/concept-net` | Future — multi-domain network, Momagrid-backed |
