# ConceptBook

ConceptBook demo app: https://digital-duck.github.io/concept-book/

A web portal for exploring knowledge domains through interactive concept graphs — powered by the [SPL.py](https://github.com/digital-duck/SPL.py) content engine.

Pick a domain, click any concept node, see the exact learning path, and generate LLM-verified explanations for every prerequisite.

> **Paper**: Wen G. Gong, *ConceptBook: A Graph-First Framework for AI-Generated Curricula*, preprint, July 2026 — [PDF](https://github.com/digital-duck/dd-work/blob/main/docs/spl4ed-paper-arxiv.pdf). This repo is the reference implementation of the framework described there: a single concept-graph drives both Path A (author a graph, generate a concept-book) and Path B (ingest an existing textbook into a graph, generate a companion concept-book).

---

## Selected Concept-Books

| Title |  Category | Level | Repo | Citation | Traffic |
|---|---|---|---|---|---|
| [ConceptBook demo: multiple domains](https://digital-duck.github.io/concept-book) | Demo | Core | [digital-duck/concept-book](https://github.com/digital-duck/concept-book) | https://github.com/digital-duck/dd-work/blob/main/docs/spl4ed-paper-arxiv.pdf | [🚦](https://github.com/digital-duck/concept-book/graphs/traffic) |
|  [Linear Algenra by Robert A. Beezer](https://digital-duck.github.io/cb-linalg/) | Math | College| [digital-duck/cb-linalg](https://github.com/digital-duck/cb-linalg) | https://open.umn.edu/opentextbooks/textbooks/5 | [🚦](https://github.com/digital-duck/cb-linalg/graphs/traffic) |
|  [Introduction to Statistics by OpenStax.org](https://digital-duck.github.io/cb-statistics/) |Math | College| [digital-duck/cb-statistics](https://github.com/digital-duck/cb-statistics) | https://openstax.org/details/books/introductory-statistics-2e | [🚦](https://github.com/digital-duck/cb-statistics/graphs/traffic) |
|  [Principle of Data Science by OpenStax.org](https://digital-duck.github.io/cb-data-science/) |CS | College| [digital-duck/cb-data-science](https://github.com/digital-duck/cb-data-science) | https://openstax.org/books/principles-data-science/pages/1-introduction | [🚦](https://github.com/digital-duck/cb-data-science/graphs/traffic) |
|  [Calculus Vol.1 by OpenStax.org](https://digital-duck.github.io/cb-calculus/) | Math | College| [digital-duck/cb-calculus](https://github.com/digital-duck/cb-calculus) | https://openstax.org/details/books/calculus-volume-1 | [🚦](https://github.com/digital-duck/cb-calculus/graphs/traffic) |
| [College Physics by OpenStax.org](https://digital-duck.github.io/cb-college-physics/) | Physics |College| [digital-duck/cb-college-physics](https://github.com/digital-duck/cb-college-physics) | https://openstax.org/details/books/college-physics-2e | [🚦](https://github.com/digital-duck/cb-college-physics/graphs/traffic) |
|  [Open Data Structures by Pat Morin](https://digital-duck.github.io/cb-data-structure/) | CS | College| [digital-duck/cb-data-structure](https://github.com/digital-duck/cb-data-structure) | https://opendatastructures.org/ | [🚦](https://github.com/digital-duck/cb-data-structure/graphs/traffic) |
|  [Algorithms by Jeff Erickson](https://digital-duck.github.io/cb-algorithms/) | CS |College| [digital-duck/cb-algorithms](https://github.com/digital-duck/cb-algorithms) | https://jeffe.cs.illinois.edu/teaching/algorithms/ | [🚦](https://github.com/digital-duck/cb-algorithms/graphs/traffic) |
| [Chinese Characters by Wen Gong](https://digital-duck.github.io/cb-zinets/) | Language | N/A| [digital-duck/cb-zinets](https://github.com/digital-duck/cb-zinets) | https://arxiv.org/abs/2502.19428 | [🚦](https://github.com/digital-duck/cb-zinets/graphs/traffic) |
| Structured Prompt Language (SPL) | CS | [digital-duck/SPL.py](https://github.com/digital-duck/SPL.py) |  https://arxiv.org/abs/2607.07727 | [🚦](https://github.com/digital-duck/SPL.py/graphs/traffic) |


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

## Top Open Source Learning Resources

These are candidate source materials for ConceptBook's Path B (ingest an existing text
or course into a concept graph, then generate an AI-powered companion guide). The goal
isn't to republish these resources as-is, but to mine their structure and content for
concept graphs, then use those graphs to drive LLM-generated, prerequisite-aware
companion books — explanations sequenced by what a learner actually needs to know
first, and eventually paired with interactive material (like the PhET simulations
below) rather than text alone.

### Textbooks

| Resource | Link | Description |
|---|---|---|
| OpenStax | https://openstax.org | Peer-reviewed college and high school textbooks managed by Rice University, focusing on high-enrollment general education courses. [^1] |
| Open Textbook Library | https://open.umn.edu/opentextbooks | A curated collection of academic textbooks supported by the Open Education Network that include faculty reviews. |
| LibreTexts | https://libretexts.org | A massive, customizable multi-campus OER platform with comprehensive STEM and humanities libraries. [^2] |
| OER Commons | https://www.oercommons.org | A massive public digital library where you can search for full open textbooks, courses, and lesson plans by grade level. [^2] |
| MIT OpenCourseWare | https://ocw.mit.edu | Full course materials (not just textbooks) from MIT, including lecture notes, problem sets, and some open textbooks. [^1] |
| CK-12 Foundation | https://www.ck12.org | Free, standards-aligned K-12 STEM textbooks ("FlexBooks") that are natively modular/customizable. [^1] |
| 学堂在线 (XuetangX) | https://www.xuetangx.com | China's largest MOOC platform (Tsinghua-led), hosts full open courses from top Chinese universities. [^3] |
| 中国大学MOOC (icourse163) | https://www.icourse163.org | Joint NetEase/Ministry of Education MOOC platform aggregating open courses from Chinese universities, including many with structured syllabi. [^3] |
| 国家智慧教育公共服务平台 (National Smart Education Platform) | https://www.smartedu.cn | Ministry of Education-run platform with official K-12 textbook content aligned to the national curriculum — the closest Chinese equivalent to an "open textbook" repository. [^3] |
| CNKI 优秀教材 / 高校教材建设 | https://www.cnki.net | Not fully open, but a major aggregator of Chinese academic and textbook material; useful for sourcing terminology and structure even where full-text access is restricted. [^3] |

[^1]: Best near-term source for Concept-Book: content is already organized by topic/module, which reduces the work needed to derive a `graph.yaml` from raw text.
[^2]: Broader but more heterogeneous in structure than OpenStax/CK-12/MIT OCW, so extracting a clean concept graph may need more preprocessing.
[^3]: Weaker on "open textbook" licensing (mostly video/course-based, not full open-text). For a Chinese-language companion guide, sourcing textbook *text* from 国家智慧教育公共服务平台 or CNKI (where licensing permits) and pairing it with lecture content from XuetangX/icourse163 is likely the pragmatic path, rather than expecting a single all-in-one OER source like OpenStax has for English.

### Interactive Simulations

| Resource | Link | Description |
|---|---|---|
| PhET Interactive Simulations | https://phet.colorado.edu/en/simulations/filter?type=html | Free, research-based HTML5 science/math simulations from University of Colorado Boulder — open license and embeddable. [^4] |

[^4]: Mappable to individual concept nodes (e.g. a "circuit" node links to the PhET circuit-construction sim) — a natural extension beyond text: pairing a concept's generated explanation with a runnable lab animation rather than just prose.
