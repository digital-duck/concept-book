> **Archived 2026-06-25.** Original implementation scratchpad from 2026-06-13. Design decisions and principles have been absorbed into [`docs/DEV/readme-design.md`](readme-design.md), which is now the single source of truth.

# concept-book — Web App Implementation Plan

> Started 2026-06-13.  
> Author: Wen Gong (digital-duck)  
> Status: **Phase 1 — ready to implement**

---

## 1. What Is concept-book?

**concept-book** is a web-app portal that lets any learner explore a knowledge
domain through its **concept graph** — a directed acyclic graph (DAG) where
nodes are concepts (primitive, concept, application) and edges are
prerequisite relationships.

The learner:
1. Picks a domain (linear algebra, Chinese characters, mechanics, …)
2. Clicks any concept in the interactive graph
3. Sees the exact learning path — the ordered list of concepts they must master first
4. Reads the verified concept-book section for each concept (LLM-written, math-verified)
5. Takes notes, exports their learning path, shares with others

**Content engine:** the `SPL.py` repo (`cookbook/74_concept_book/`) generates all
content. concept-book is the **web-app layer** — it hosts and presents what SPL.py
produces.

---

## 2. What Makes This Different — Design Principles

These observations emerged from the first working prototype (linalg and geometry
graphs, 2026-06-13). They are the core design principles that distinguish
concept-book from every other learning tool.

### 2.1 The graph IS the curriculum

In a conventional textbook, a visualization is bolted on as supplementary material
— a chapter map, a mind-map sidebar. Here the graph is primary. The YAML concept
graph is the authoritative source; the chapter ordering, the learning path, and the
dependency chain all derive from it. The graph is not a picture of the curriculum —
it *is* the curriculum.

**Implication for the web-app:** the graph navigator is the home screen, not a
feature buried in a sidebar.

### 2.2 Click = personalized path, not a fixed chapter sequence

When a learner clicks any node, they see the BFS shortest path from the graph's
roots to that concept — the exact minimum set of prerequisites in the right order,
personalized to that target. A learner who wants to understand `gram schmidt` (BFS
level 5 in linalg) sees an 11-step path. A learner who wants `linear combination`
(BFS level 1) sees a 3-step path. No two learners need to follow the same sequence.

This is structurally impossible in a textbook. It requires the DAG.

### 2.3 Depth is visible at a glance

A node sitting at BFS level 5 communicates "this is deep — plan accordingly"
without any annotation. No textbook chapter number, no difficulty star rating, no
prerequisite list in an appendix conveys this as directly. The vertical position in
the hierarchical layout *is* the difficulty signal, and it is derived automatically
from the graph structure, not editorially assigned.

**Analogy:** `gram schmidt` at the bottom of the linalg DAG immediately tells a
learner they will need to climb through 5 levels of concepts to get there. A
student who tries to learn it first — without the graph — is walking in without a
map.

### 2.4 Highlighted paths feel like neurons firing

When a node is selected, the ancestors highlight in yellow-orange, tracing back to
the primitives. The visual effect — a chain of nodes lighting up across the graph —
mirrors how conceptual understanding actually works: prerequisite knowledge
activating in sequence, each concept unlocking the next. The metaphor is not
decorative; it reflects the cognitive reality of building on prior knowledge.

**Design goal:** keep this highlight fast and immediate (no animation delay).
The snap of the highlight IS the feedback.

### 2.5 Three layers, visible simultaneously

| Layer | Shape | Color | Meaning |
|---|---|---|---|
| **Primitive** | rectangle | green | What we assume — axioms, definitions, undefined terms |
| **Concept** | oval | blue | What we build — derived ideas, theorems, techniques |
| **Application** | rectangle | orange | What we unlock — real-world uses, tools, domains |

Most curricula flatten these into one undifferentiated list. Separating them
visually makes the structure of a knowledge domain legible at a glance:
how many axioms does geometry assume? (4 primitives). How many applications does
linear algebra unlock from the `orthonormal basis` node? (follow the orange boxes).

### 2.6 The highlight is bidirectional in intent

The current implementation highlights **ancestors** (what I need to learn first —
upstream dependencies). The graph structure also supports **descendants** (what
this concept unlocks — downstream fan-out). Both directions are load-bearing for
the learner:

- **Top-down (ancestors lit):** "I want to learn X — what must I learn first?"
- **Bottom-up (descendants lit):** "I know X — what can I now learn next?"

The bottom-up direction is especially powerful for elemental primitives in the
Chinese characters domain (see §8). Phase 2 of the web-app should add a toggle:
**"What does this unlock?"** that switches the highlight from ancestor-path to
descendant-fan.

---

## 3. Architecture

```
SPL.py (content engine)
    cookbook/74_concept_book/
        *_graph.yaml          ← concept graph source (YAML, first-class format)
        build_concept_book.spl ← LLM + verifier → section text
        tools.py              ← build_html_page() @spl_tool
        output/
            html/
                *_graph.html          ← 4-panel interactive navigator
                *_concept_book.html   ← full concept-book with MathJax
            notebook/                 ← executed .ipynb (re-runnable)
            pdf/                      ← webpdf render of notebook
            ↓
concept-book (this repo)
    public/domains/
        linalg/
            graph.yaml
            graph.html        ← copied from SPL.py output/html/
            concept_book.html ← copied from SPL.py output/html/
        chinese_characters/
            ...
    src/
        pages/
            Home.js           ← domain catalog
            Domain.js         ← 4-panel graph + concept-book viewer
        components/
            DomainCard.js     ← card on home page
            GraphViewer.js    ← wraps the vis.js 4-panel HTML
            BookViewer.js     ← renders concept-book HTML with MathJax
        data/
            catalog.json      ← list of available domains + metadata
            ↓
concept_net (future repo)
    generalisation to a full multi-domain learning network
    portal backed by Momagrid inference infrastructure
```

**Deployment chain:**

```
SPL.py spl3 run → output/html/*.html   (content generation, author's machine)
    ↓  (copy script or CI)
concept-book public/domains/           (web-app static assets)
    ↓  vite build
dist/                                  (GitHub Pages / school server / Raspberry Pi)
```

---

## 4. Related repos

| Repo | Role |
|---|---|
| `digital-duck/SPL.py` | Content engine — generates YAML graphs, HTML navigators, concept-book HTML |
| `digital-duck/concept-book` | **This repo** — web-app portal, static hosting |
| `Proj-ZiNets/zinets_vis` | Precedent — domain-specific Chinese learning web-app |
| `digital-duck/concept-net` | Future — generalises zinets_vis to any knowledge domain, Momagrid-backed |

---

## 5. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Build | **Vite** | Zero-config, instant HMR, outputs clean static `dist/` |
| UI | **Vanilla JS** | No framework overhead; scales to Next.js / Vue.js when needed |
| Graph | **vis.js Network** (CDN) | Already proven in SPL.py HTML navigator |
| Math | **MathJax v3** (CDN) | Already in concept-book HTML output |
| Styles | **CSS custom properties** | Theming without a preprocessor |
| Hosting | **GitHub Pages** (Phase 1) → school server / Raspberry Pi (Phase 2) | Static-first, zero server cost |
| Backend | **None yet** → FastAPI wrapping `spl3 run` (Phase 3) | On-demand generation deferred |

---

## 6. Content Pipeline (SPL.py → concept-book)

### 5.1 Generate content in SPL.py

Run from `~/projects/digital-duck/SPL.py/`:

```bash
# For each domain, generate the HTML navigator (instant, no LLM)
python scripts/concept_graph.py --domain cookbook/74_concept_book/linalg_graph.yaml \
  visualize --format html
# → cookbook/74_concept_book/output/html/linalg_graph.html

# Generate concept-book HTML (LLM + verifier, ~5–10 min per domain)
spl3 run cookbook/74_concept_book/build_concept_book.spl \
  --tools cookbook/74_concept_book/tools.py \
  --param domain_yaml=linalg_graph.yaml \
  --param target=spectral_theorem \
  --param language=en \
  --param output_html=cookbook/74_concept_book/output/html/linalg_concept_book.html
```

### 5.2 Sync to concept-book

A sync script (to be created as `scripts/sync_from_spl.sh`) copies generated
artifacts into this repo's `public/domains/`:

```bash
SPL_OUTPUT=~/projects/digital-duck/SPL.py/cookbook/74_concept_book/output/html
DEST=./public/domains

mkdir -p $DEST/linalg
cp $SPL_OUTPUT/linalg_graph.html    $DEST/linalg/graph.html
cp $SPL_OUTPUT/linalg_graph.yaml    $DEST/linalg/graph.yaml
cp $SPL_OUTPUT/linalg_concept_book.html $DEST/linalg/concept_book.html
# … repeat for each domain
```

`catalog.json` is the single source of truth for what domains are available:

```json
[
  {
    "id": "linalg",
    "name": "Linear Algebra",
    "description": "From vector addition to the spectral theorem.",
    "capstone": "spectral_theorem",
    "nodes": 37,
    "edges": 51,
    "primitives": 5,
    "concepts": 25,
    "applications": 7,
    "tags": ["math", "university"],
    "has_navigator": true,
    "has_book": false
  }
]
```

---

## 7. Folder Structure (target)

```
concept-book/
├── docs/
│   └── DEV/
│       └── readme-plan.md         ← this file
├── public/
│   ├── favicon.ico
│   └── domains/
│       ├── catalog.json           ← domain registry
│       ├── linalg/
│       │   ├── graph.yaml
│       │   ├── graph.html
│       │   └── concept_book.html
│       ├── chinese_characters/
│       │   └── …
│       └── …
├── src/
│   ├── main.js                    ← Vite entry point
│   ├── router.js                  ← client-side routing (hash-based)
│   ├── style.css                  ← global styles + CSS custom properties
│   ├── data/
│   │   └── catalog.js             ← fetch + cache catalog.json
│   ├── pages/
│   │   ├── Home.js                ← domain catalog grid
│   │   ├── Domain.js              ← 4-panel navigator + book viewer
│   │   └── About.js               ← project vision, how to contribute
│   └── components/
│       ├── DomainCard.js          ← card (name, stats, tags, open button)
│       ├── GraphViewer.js         ← iframe or direct embed of graph.html
│       ├── BookViewer.js          ← iframe or direct embed of concept_book.html
│       ├── Header.js              ← nav bar (logo, domain search, language picker)
│       └── LanguagePicker.js      ← ISO 639-1 selector, stored in localStorage
├── scripts/
│   └── sync_from_spl.sh           ← copy artifacts from SPL.py output/
├── index.html                     ← Vite root template
├── vite.config.js
├── package.json
└── README.md
```

---

## 8. Domain Spotlight — Chinese Characters (the founding use-case)

The Chinese characters domain (`chinese_characters_graph.yaml`) is the reason
concept-book exists. It is the direct evolution of the ZiNets research project
(`zinets_vis`) and the clearest proof that the concept-graph model makes language
learning both more rigorous and more fun — especially for STEM-minded learners.

### 7.1 The Elemental Character Model

Chinese characters have the same structure as chemical elements in a periodic table:

| Chemistry | Chinese characters |
|---|---|
| Elements (H, O, C, …) | Elemental characters (木, 水, 火, 口, 日, 月, 马, …) |
| Compounds (H₂O, CO₂, …) | Compound characters (林 = 木+木, 休 = 人+木, 明 = 日+月, …) |
| Molecular formula = pieces multiset | `composed_of: [木, 木]` |
| Irreducibility theorem | 马 is a SOUND-lender — not reducible to pictograms |
| Periodic table | The concept graph |

**Elemental characters** are the primitives in the concept graph — a curated brick set
of ~11 semantic pictograms (FORM) + 马 as the irreducible SOUND radical. Every
compound character decomposes into this brick set. Learning the ~12 elementals
unlocks the ability to decode hundreds of characters by structure alone.

This framing makes Chinese acquisition feel like STEM — you learn a small,
closed set of building blocks, then derive everything else. The concept graph
makes the derivation visible and navigable.

### 7.2 Two Navigation Modes

The graph supports two complementary mental models:

**Top-down (decompose):** *"I see the character 森 — what are its building blocks?"*
- Click `森` in the graph
- Learning path shows: `木` (tree) → `林` (two trees) → `森` (three trees, forest)
- Rule: tripling = intensification — the simplest LEGO rule of all

**Bottom-up (compose):** *"I know 木 — what can I build with it?"*
- Click `木` in the graph
- `dependsOn` edges fan out to `林`, `休`, `森`, `朴`, `机`, …
- Each successor shows its full `composed_of` brick list
- The learner sees their elemental character as a productive building block

Both directions are already in the graph data. The vis.js network shows them
simultaneously — ancestors highlighted yellow, the target node orange. Phase 2
should add an explicit **"What can I build?"** button that inverts the view and
shows the `successors` fan-out instead of the ancestor path.

### 7.3 Two Graph Views — vis.js + ECharts

The current `graph.html` navigator uses **vis.js** for the prerequisite DAG
(learning path, top-down structure). The existing `zinets_vis` app uses **ECharts**
for a different view — a character network showing co-occurrence, visual similarity,
and contextual groupings.

These two views are complementary, not competing:

| View | Library | What it shows | When to use |
|---|---|---|---|
| **Prerequisite graph** | vis.js | What must I learn first? (DAG, strict order) | Before studying a character |
| **Character network** | ECharts | What does this character appear in? (web, discovery) | After studying, for vocabulary building |

In the `concept-book` web-app, the **Domain page for Chinese characters** should
eventually offer both views as tabs or a toggle:
```
[ Prerequisite graph ]  [ Character network ]
```

The vis.js graph is the *learning path navigator* — it tells you what to study next.
The ECharts network is the *discovery browser* — it shows the character in its natural
habitat (words, compounds, usage frequency). Together they give the learner both
structure (graph) and context (network).

**Implementation note for Phase 2:** the ECharts character network data can be
extracted from `zinets_vis` (`Proj-ZiNets/zinets_vis`) and served as a separate
JSON file per domain. The toggle is a single `data-view` attribute on the graph
container div.

### 7.4 Why This Works for STEM-Minded Learners

Traditional Chinese textbooks present characters in frequency order or by topic
(greetings, food, numbers). Neither respects the structural dependencies. A learner
who studies 明 (bright) before understanding 日 (sun) and 月 (moon) is memorising
an arbitrary symbol instead of understanding a composition.

The concept graph enforces the right order automatically:
- Primitives first — learn the ~12 elementals as atomic shapes with meanings
- Compositions next — each new character is a derivation, not a memorisation
- Applications last — vocabulary, idioms, cultural contexts that require the above

For a STEM learner, this is isomorphic to how they already learn:
- You don't learn integration before differentiation
- You don't learn 林 before 木

The `gap(graph, target, learner_state)` function (already in `concept_graph.py`)
makes this personalised: it computes exactly which elementals the learner still
needs, given what they already know. The concept-book for Chinese is a personalised
curriculum, not a fixed sequence.

---

## 9. Implementation Phases

### Phase 1 — MVP (Vite + Vanilla JS, static)  ← **implement this now**

**Goal:** a working web-app you can open in a browser, showing all available domains
and letting you explore any domain's concept graph.

Deliverables:
- [ ] `npm create vite@latest . -- --template vanilla` scaffold
- [ ] `public/domains/catalog.json` with all 10 current domains
- [ ] Copy 10 generated `*_graph.html` navigators into `public/domains/`
- [ ] **Home page** — responsive grid of `DomainCard` components, loaded from `catalog.json`
- [ ] **Domain page** — full-screen embed of the 4-panel `graph.html` navigator
- [ ] **Header** — logo, back-navigation, domain name
- [ ] **Client-side router** — hash-based (`#/`, `#/domain/linalg`), no server config needed
- [ ] **GitHub Pages deploy** — `vite build` → `dist/` → Pages branch
- [ ] `scripts/sync_from_spl.sh` — one-command sync from SPL.py

**Home page card design:**

```
┌──────────────────────────────────┐
│  Linear Algebra          [math]  │
│  37 nodes · 51 edges             │
│  From vector addition to the     │
│  spectral theorem                │
│                                  │
│  [Explore graph]  [Read book]    │
└──────────────────────────────────┘
```

### Phase 2 — Book Viewer + Language

- [ ] Embed `concept_book.html` in a **BookViewer** panel (right of or below graph)
- [ ] **Language picker** — re-run `spl3 run … --param language=zh` for Chinese,
      serve different book HTML per language; selector stored in localStorage
- [ ] **Search** — filter domains by tag (`math`, `language`, `science`, …)
- [ ] `share` integration — call `concept_graph.py share` → download the `.zip`

### Phase 3 — Learning Path & Notes

- [ ] **Learning path sidebar** — pull the `orderedPath` from the embedded graph's
      JS into the web-app shell (postMessage from iframe)
- [ ] **Notes persistence** — localStorage keys scoped to `concept-book/<domain>/<nodeId>`
- [ ] **Export notes** — download as JSON (same format as the navigator's Export JSON button)
- [ ] **Progress tracking** — completed nodes stored in localStorage; shown as green dots

### Phase 4 — FastAPI Backend (on-demand generation)

- [ ] `api/` directory: FastAPI app wrapping `spl3 run build_concept_book.spl`
- [ ] `POST /generate` — `{domain, target, language, style}` → streams HTML sections
- [ ] `GET /domains` — serves `catalog.json`
- [ ] School deployment: FastAPI on Raspberry Pi, Vite `dist/` served by nginx
- [ ] Momagrid integration: route generation requests to student grid workers

### Phase 5 — Publish & concept_net

- [ ] `publish` command in `concept_graph.py` (formal, vetted → GitHub Pages)
- [ ] `concept_net` repo — multi-domain learning network; concept-book is one node
- [ ] Cross-domain concept composition (linalg + mechanics → classical field theory path)

---

## 10. Getting Started (for implementing Claude session)

```bash
# 1. Clone and enter repo
cd ~/projects/digital-duck/concept-book

# 2. Scaffold Vite + vanilla JS
npm create vite@latest . -- --template vanilla
npm install

# 3. Sync domain content from SPL.py
bash scripts/sync_from_spl.sh   # (create this script first — see §5.2)

# 4. Dev server
npm run dev
# open http://localhost:5173

# 5. Build + preview
npm run build
npm run preview

# 6. Deploy to GitHub Pages
# vite.config.js: base: '/concept-book/'
npm run build
# push dist/ to gh-pages branch, or use gh-pages npm package
```

### Key design constraints

- **Static-first** — every page must work as a static file; no SSR required in Phase 1–2
- **Self-contained domains** — each `*_graph.html` is a fully standalone file; the web-app
  is a shell that organises and links them, not a re-implementation
- **Zero framework lock-in** — Vanilla JS in Phase 1; the page/component structure is
  designed so pages can be lifted into Vue SFC or Next.js pages later with minimal rewrite
- **Offline-capable** — must work on a school Raspberry Pi with no internet (CDN links
  can be swapped for local copies of vis.js and MathJax at deploy time)
- **Multi-language ready** — all user-visible strings go through a thin `i18n.js` module
  from day one (even if only `en` is shipped in Phase 1)

---

## 11. Open Questions

1. **Domain card image / icon** — should each domain have a visual thumbnail, or is the
   graph preview sufficient? (Option: render a tiny SVG of the graph at sync time)

2. **iframe vs direct embed** — the graph HTML files are self-contained pages; embedding
   via `<iframe>` is simplest but limits communication. Direct DOM injection (fetch +
   innerHTML) gives tighter integration but requires CSP awareness. Recommend iframe with
   `postMessage` bridge for Phase 1, revisit in Phase 3.

3. **Catalog maintenance** — should `catalog.json` be hand-authored or auto-generated
   from the YAML graphs at sync time? Auto-generation is more robust (node/edge counts
   always accurate). The sync script can run `concept_graph.py stats` per domain and
   write the JSON.

4. **Domain URL slugs** — use the YAML filename stem (`linalg`, `chinese_characters`) or
   human-readable slugs (`linear-algebra`, `chinese-characters`)? Recommend: keep stems
   as internal IDs, use `name` field for display.

---

## 12. Related Files in SPL.py

| Path | Role |
|---|---|
| `cookbook/74_concept_book/*_graph.yaml` | Domain graph sources (YAML) |
| `cookbook/74_concept_book/output/html/` | Generated HTML navigators + concept-books |
| `scripts/concept_graph.py` | CLI: `visualize`, `share`, `convert`, `stats` |
| `cookbook/74_concept_book/build_concept_book.spl` | Content generator workflow |
| `cookbook/74_concept_book/tools.py` | `build_html_page()` tool |
| `docs/DEV/README-concept-book.md` | Full vision + architecture decisions |
