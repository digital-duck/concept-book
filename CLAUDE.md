# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev (read-only, no book generation)
npm run dev          # http://localhost:5174/concept-book/

# Full stack (book generation requires spl123 conda env)
conda activate spl123
pip install -r requirements-api.txt
bash scripts/start-api.sh          # uvicorn on :8000, in a separate terminal
npm run dev                         # Vite proxies /api → localhost:8000

# Sync domain content from SPL.py after regenerating graphs
bash scripts/sync_from_spl.sh

# Deploy to GitHub Pages
npm run deploy       # builds dist/ and pushes to gh-pages branch
```

No test runner is wired up; `playwright` is in devDependencies but has no npm test script.

## Architecture

**Content pipeline:** `spl/build_concept_book.spl` is the concept-book generation workflow (forked from SPL.py recipe 74). It uses `@level` (intro/core/college/research) instead of `@style`. Supporting files: `spl/level_profiles.py` (level definitions), `spl/tools.py` (SPL tool functions), `spl/graph_lib.py` (graph algorithms). The `*_graph.yaml` inputs and `*_graph.html` navigators are synced from SPL.py by `scripts/sync_from_spl.sh`.

**Domain directory layout:**
```
public/domains/{id}/
  input/graph.yaml                        # concept graph definition (from SPL.py)
  output/graph.html                       # vis.js navigator (level/lang invariant)
  output/{level}.{lang}/html/             # e.g. core.en/, intro.zh/
    book_{target}.html                    # TOC-index concept books
    concept_{name}.html                   # individual concept component books
  output/{level}.{lang}/pdf/              # (future) PDF output
```

**Content levels** (learner progression, not tied to school systems):
- `intro` — basic concepts (elementary)
- `core` — expanded coverage (intermediate)
- `college` — extensive coverage (undergraduate)
- `research` — advanced coverage (graduate+)

A domain can have books at multiple levels — level is a content property, not a domain property. Current defaults: chinese_characters/english_morphology→intro, geometry/chemistry_elements/music_theory→core, mechanics/linalg/python_science→college, sage_learning/lean_proving→research.

**Frontend** (`src/`): Vite + Vanilla JS with zero frameworks.
- `router.js` — hash-based router (`#/`, `#/domain/:id`, `#/about`). No library.
- `data/catalog.js` — fetches/caches `public/domains/catalog.json`, the domain registry (source of truth for the domain list).
- `pages/Domain.js` — splits the view into `GraphViewer` (left, iframe) and `ConceptPanel` (right, node detail).
- `components/GraphViewer.js` — the key integration point. Loads `graph.html` in an iframe, then uses `contentWindow.eval()` to expose `RAW`/`nodeIndex`, patches `handleSelect` to emit `cb:nodeSelected` custom events, and injects two sidebar sections (Generate Book, Concept Books) directly into the iframe DOM via `insertAdjacentElement`. This is same-origin, not cross-origin — both `graph.html` and the shell are served from the same Vite dev server.

**Backend** (`api/`): FastAPI.
- `GET /api/generate` (SSE) — params: `domain`, `target`, `level` (default `intro`), `language` (default `en`). Streams `spl3 run build_concept_book.spl` subprocess output as `log`/`done`/`gen_error` events. Requires the `spl123` conda env with `spl3` on PATH.
- `GET /api/domains` / `/api/domains/{id}/status` — reads `catalog.json`.
- `api/config.py` — `Settings` reads env vars prefixed `CB_`: `CB_SPL_DIR` (default `~/projects/digital-duck/SPL.py`), `CB_PUBLIC_DOMAINS` (default `./public/domains`), and `CB_LLM` (default `claude_cli:claude-sonnet-4-6`).

**Deployment:** GitHub Pages (static). The backend is a local-only tool; generated `concept_book.html` files are committed into `public/domains/` and included in the `dist/` build.

## Iframe ↔ parent event protocol

`GraphViewer.js` bridges the iframe (`graph.html`) and the parent app via custom events on `window`:
- `cb:graphLoaded` — dispatched after iframe loads. `detail.concepts` is an array of `{id, label, kind, tier}`.
- `cb:nodeSelected` — dispatched when a user clicks a node. `detail.nodeId` and `detail.node` (full node object from `nodeIndex`).

The iframe's `graph.html` exposes script-scoped `RAW` (full graph data), `nodeIndex` (id→node map), `handleSelect(nodeId)`, and `selectNode(nodeId)` functions. `GraphViewer` promotes `RAW`/`nodeIndex` to `window.__cb_RAW`/`window.__cb_nodeIndex` via `eval()`.

## Key data shapes

`catalog.json` entry:
```json
{
  "id": "linalg",
  "title": "Linear Algebra",
  "tags": ["math"],
  "capstone": "linear_algebra",
  "books": [{"target": "linear_algebra", "file": "output/college.en/html/book_linear_algebra.html"}],
  "generated_concepts": [{"label": "Vector", "file": "output/college.en/html/concept_vector.html"}]
}
```

`books` = full concept books (TOC index). `generated_concepts` = individual concept component books. Both are shown in the "Concept Books" sidebar dropdown.

`graph.yaml` node fields used by the frontend: `id`, `label`, `kind` (`primitive` nodes are excluded from the Generate dropdown), `tier`.

## Vite base path

`vite.config.js` sets `base: '/concept-book/'`. All asset and domain URLs must use `import.meta.env.BASE_URL` as prefix (see `GraphViewer.js` iframe `src`).

## Adding a new domain

1. Add the domain ID and its default level to the `LEVEL_MAP` in `scripts/sync_from_spl.sh`.
2. Add an entry to `public/domains/catalog.json`.
3. Run `bash scripts/sync_from_spl.sh` to copy files into `input/` and `output/{level}.{lang}/html/`.

## i18n

`src/i18n.js` provides a `t(key)` translation function. Currently English-only; the `zh` locale is planned for Phase 2. Translation keys are defined inline in `i18n.js`, not in external JSON files.
