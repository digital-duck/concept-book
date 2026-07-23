# concept-book

ConceptBook demo app: https://digital-duck.github.io/concept-book/

A web portal for exploring knowledge domains through interactive concept graphs — powered by the [SPL.py](https://github.com/digital-duck/SPL.py) content engine.

Pick a domain, click any concept node, see the exact learning path, and generate LLM-verified explanations for every prerequisite.

> **Paper**: Wen G. Gong, *ConceptBook: A Graph-First Framework for AI-Generated Curricula*, preprint, July 2026 — [PDF](https://github.com/digital-duck/dd-work/blob/main/docs/spl4ed-paper-arxiv.pdf). This repo is the reference implementation of the framework described there: a single concept-graph drives both Path A (author a graph, generate a concept-book) and Path B (ingest an existing textbook into a graph, generate a companion concept-book).

---

> **Design details** — level profiles, language input, output directory layout, API events: [`docs/DEV/readme-design.md`](docs/DEV/readme-design.md)

---

## Architecture

```
SPL.py (content engine)
  cookbook/74_concept_book/
    *_graph.yaml              ← domain graph source
    build_concept_book.spl    ← LLM + verifier → section text
    output/html/
      *_graph.html            ← standalone vis.js navigator
      *_concept_book.html     ← full concept-book with MathJax
          ↓
concept-book (this repo)
  public/domains/{id}/
    graph.html                ← copied by sync script
    graph.yaml
    concept_book.html         ← generated on demand via API
  src/                        ← Vite + Vanilla JS frontend
  api/                        ← FastAPI backend (wraps spl3 run)
```

**Domains (10):** Linear Algebra, Geometry, Classical Mechanics, Chemistry Elements, Chinese Characters, English Morphology, Python for Science, SageMath, Lean Theorem Proving, Music Theory.

---

## Quick start

### 1. Frontend only (read-only — no book generation)

```bash
npm install
npm run dev
# open http://localhost:5174/concept-book/
```

### 2. Full stack (frontend + book generation)

**Terminal 1 — backend** (requires the `spl123` conda env from SPL.py):

```bash
conda activate spl123
pip install -r requirements-api.txt
bash scripts/start-api.sh
# API running at http://localhost:8200
```

**Terminal 2 — frontend:**

```bash
npm install
npm run dev
# open http://localhost:5174/concept-book/
```

Vite proxies `/api` → `localhost:8200` automatically in dev mode.

---

## Syncing domain content from SPL.py

After generating new graphs or updated HTML in SPL.py, copy them into this repo with:

```bash
bash scripts/sync_from_spl.sh
```

This copies `*_graph.html` and `*_graph.yaml` from `~/projects/digital-duck/SPL.py/cookbook/74_concept_book/output/html/` into `public/domains/`.

To override the SPL.py path:

```bash
SPL_DIR=/path/to/SPL.py bash scripts/sync_from_spl.sh
```

---

## Generating a concept book

1. Start the backend (see above)
2. Open a domain in the browser
3. In the **Generate Book** section at the top of the left sidebar, select a target concept
4. Click **Generate** — spl3 output streams live into the log
5. The page reloads automatically when the book is ready; the **Read in book →** link appears on each concept node

The generated `concept_book.html` is written to `public/domains/{id}/concept_book.html` and served as a static file.

---

## Deployment (GitHub Pages)

Live at **[digital-duck.github.io/concept-book](https://digital-duck.github.io/concept-book/)** — read-only, static, no backend required. Every concept graph and every already-generated concept book is baked into the build, so anyone with the link can browse without running the API.

```bash
npm run deploy      # vite build && gh-pages -d dist --no-history --dotfiles

# URL = https://digital-duck.github.io/concept-book/
```

`--no-history` squashes each deploy to a single commit on `gh-pages` instead of accumulating history — worth keeping as `public/domains` grows, since an unbounded history is what causes `gh-pages`' cleanup step to blow past the OS argument-length limit on a later deploy. `--dotfiles` makes sure `public/.nojekyll` (present so GitHub Pages doesn't run content through Jekyll) actually gets published.

**Current static content** (53 domains as of 2026-07-21):
- 22 domains have at least one fully generated concept book (multiple language/model variants where noted)
- 31 domains — including the 32 newly-ingested OpenStax College Physics chapters (ch3–ch34) — are graph-only for now: the concept graph is browsable, but book generation is still pending (see [`scripts/README-test_gen.md`](scripts/README-test_gen.md))
- Languages generated so far: English, Chinese — more (`--language`) planned per `scripts/batch_gen_domains.py`
- Models generated so far: Claude Sonnet, Gemma3, Gemma4 — for side-by-side quality comparison

> The backend API is a local tool and is not deployed to GitHub Pages. The static graph navigators and any pre-generated concept books are included in the build.

---

## Project structure

```
concept-book/
├── api/                        ← FastAPI backend
│   ├── app.py                  ← FastAPI entry point
│   ├── config.py               ← CB_SPL_DIR, CB_PUBLIC_DOMAINS env vars
│   ├── routers/
│   │   ├── generate.py         ← GET /api/generate (SSE stream)
│   │   └── domains.py          ← GET /api/domains, /api/domains/{id}/status
│   └── services/
│       ├── executor.py         ← spl3 subprocess + SSE yield
│       └── catalog_svc.py      ← catalog.json read/write
├── src/
│   ├── main.js                 ← Vite entry, route registration
│   ├── router.js               ← hash-based router (#/, #/domain/:id, #/about)
│   ├── i18n.js                 ← thin i18n wrapper (en only; zh ready for Phase 2)
│   ├── style.css               ← CSS custom properties, dark-mode
│   ├── data/catalog.js         ← fetch + cache catalog.json
│   ├── pages/
│   │   ├── Home.js             ← domain grid with tag filter
│   │   ├── Domain.js           ← split layout: graph + concept panel
│   │   └── About.js
│   └── components/
│       ├── Header.js
│       ├── DomainCard.js
│       ├── GraphViewer.js      ← iframe embed + sidebar injection + postMessage bridge
│       ├── ConceptPanel.js     ← node details panel (right side)
│       ├── BookViewer.js       ← (Phase 2) concept_book.html embed
│       └── LanguagePicker.js   ← (Phase 2) language toggle
├── public/domains/
│   ├── catalog.json            ← domain registry (source of truth)
│   └── {id}/
│       ├── graph.html          ← vis.js navigator (from SPL.py)
│       ├── graph.yaml          ← domain graph source
│       └── concept_book.html   ← generated concept book (optional)
├── scripts/
│   ├── sync_from_spl.sh        ← copy artifacts from SPL.py
│   └── start-api.sh            ← start uvicorn (run inside spl123)
├── docs/DEV/readme-plan.md     ← full implementation plan and phase roadmap
├── requirements-api.txt        ← fastapi, uvicorn, sse-starlette, pydantic-settings
├── vite.config.js              ← base: /concept-book/, proxy: /api → :8200
└── package.json
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `CB_SPL_DIR` | `~/projects/digital-duck/SPL.py` | Path to the SPL.py repo |
| `CB_PUBLIC_DOMAINS` | `./public/domains` | Path to the domains directory |

Set in a `.env` file at the repo root or export before starting the API.

---

## Related repos

| Repo | Role |
|---|---|
| [digital-duck/SPL.py](https://github.com/digital-duck/SPL.py) | Content engine — generates YAML graphs, HTML navigators, concept-book HTML |
| [digital-duck/concept-book](https://github.com/digital-duck/concept-book) | This repo — web portal |
| [Proj-ZiNets/zinets_vis](https://github.com/Proj-ZiNets/zinets_vis) | Precedent — Chinese character learning web-app |
| digital-duck/concept-net | Future — multi-domain network, Momagrid-backed |
