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

**Content pipeline (external):** SPL.py generates `*_graph.yaml` and `*_graph.html` (vis.js navigators), and can generate `concept_book.html` via LLM. These are synced into `public/domains/{id}/` by `scripts/sync_from_spl.sh`.

**Frontend** (`src/`): Vite + Vanilla JS with zero frameworks.
- `router.js` — hash-based router (`#/`, `#/domain/:id`, `#/about`). No library.
- `data/catalog.js` — fetches/caches `public/domains/catalog.json`, the domain registry (source of truth for the domain list).
- `pages/Domain.js` — splits the view into `GraphViewer` (left, iframe) and `ConceptPanel` (right, node detail).
- `components/GraphViewer.js` — the key integration point. Loads `graph.html` in an iframe, then uses `contentWindow.eval()` to expose `RAW`/`nodeIndex`, patches `handleSelect` to emit `cb:nodeSelected` custom events, and injects two sidebar sections (Generate Book, Concept Books) directly into the iframe DOM via `insertAdjacentElement`. This is same-origin, not cross-origin — both `graph.html` and the shell are served from the same Vite dev server.

**Backend** (`api/`): FastAPI.
- `GET /api/generate` (SSE) — streams `spl3 run build_concept_book.spl` subprocess output as `log`/`done`/`gen_error` events. Requires the `spl123` conda env with `spl3` on PATH.
- `GET /api/domains` / `/api/domains/{id}/status` — reads `catalog.json`.
- `api/config.py` — `Settings` reads env vars prefixed `CB_`: `CB_SPL_DIR` (default `~/projects/digital-duck/SPL.py`) and `CB_PUBLIC_DOMAINS` (default `./public/domains`). `CB_LLM` defaults to `claude_cli:claude-sonnet-4-6`.

**Deployment:** GitHub Pages (static). The backend is a local-only tool; generated `concept_book.html` files are committed into `public/domains/` and included in the `dist/` build.

## Key data shapes

`catalog.json` entry:
```json
{
  "id": "linalg",
  "title": "Linear Algebra",
  "tags": ["math"],
  "capstone": "linear_algebra",
  "books": [{"target": "linear_algebra", "file": "concept_book.html"}],
  "generated_concepts": [{"label": "Vector", "file": "vector_book.html"}]
}
```

`graph.yaml` node fields used by the frontend: `id`, `label`, `kind` (`primitive` nodes are excluded from the Generate dropdown), `tier`.

## Vite base path

`vite.config.js` sets `base: '/concept-book/'`. All asset and domain URLs must use `import.meta.env.BASE_URL` as prefix (see `GraphViewer.js` iframe `src`).
