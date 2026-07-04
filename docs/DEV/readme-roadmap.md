# ConceptBook Roadmap — One UI Framework, Many Subject Domains

*2026-07-04. Distilled from the cb_zinets build-out (the Chinese-learning
vertical), which validated the framework end-to-end: ~100 idiom domains,
~1,800 canonical concept pages, 570+ books across 3 models × 2 languages.*

## Thesis

ConceptBook is a **graph-first, AI-powered learning platform** for any subject
that can be modeled with the concept-graph schema:

```
primitives  →  concepts  →  applications        (nodes)
composed_of / needs                              (edges: u is prerequisite of v)
```

The pedagogy is an auto-regressive round trip — train the learner on a small
curated set, teach the *composition algorithm* (decompose = encode, re-compose
= decode), and the learner generalizes to unseen cases (举一反三, few-shot
learning stated 500 BC). This works for exactly the class of subjects whose
decomposition stays *meaningful at every level* — Chinese characters, molecules,
proofs, circuits — and that class is the product's addressable market.

`cb_zinets` (Chinese learning) is the **first deep vertical**. The concept-book
repo already seeds shallow graphs for chemistry_elements, calculus, biology,
physics, and CS — the framework was born general; cb_zinets proved it in depth.

## The three-page UI framework (domain-agnostic)

The interaction model that emerged from cb_zinets separates cleanly from the
subject matter. Every future vertical reuses these three pages:

| Page | Role | Interaction |
|---|---|---|
| **Home** | Discover | Browse/search both **composites** (phrases / molecules / theorems) and **primitives-in-context** (characters / functional groups / lemmas), with domain-appropriate fuzzy matching (pinyin today; formula or IUPAC substring tomorrow). Submit a new composite to decompose. |
| **Graph** | Understand & produce | View the concept graph (learning path, BFS levels, node-type legend); **generate concept-book content for the whole graph**; inspect per-node detail (the node's own concept page, scoped to the current domain + variant); take notes (auto-saved per node). |
| **Book** | Study & review | Read the thin book (TOC → canonical concept pages; only capstone + payoff inline); **compare any two variants side-by-side** (PANE A/B) with AI-assisted evaluation (PANE C); export a static aggregated PDF. |

The reviewer workflow (Graph to produce, Book/Compare to evaluate, notes to
annotate) is itself domain-neutral: it is content QA for LLM-generated
curriculum, whatever the subject.

## The variant dimensions

Every content unit is keyed on **(model, level, language)** — today:
`{gemma3, gemma4, sonnet, …} × {intro, core, college, research} × {en, zh, …}`.

The *mechanism* (canonical page per key, symlinks per domain, Compare across
any axis) is domain-agnostic. The *values* are domain-specific — a chemistry
vertical might use `level = {highschool, undergrad, grad}` and care less about
`language`; a materials vertical might add an axis like `representation =
{atomistic, continuum}`. Design rule: **keep the keying open — axes are
configuration, not schema.**

## What generalizes vs. what each vertical supplies

Domain-neutral core (already true in the code):

- Concept-graph schema, validation, learning-path/BFS logic (`concept_graph.py`, `graph_lib`)
- SPL generation pipeline: per-concept sections with caching, capstone, payoff
  (`build_concept_book.spl` — its default target is still `spectral_theorem`,
  a fossil that proves the pipeline predates the hanzi vertical)
- Thin-book architecture: canonical concept pages + symlinks per
  (level, language, model); books reference, never copy
- Catalog + three-page UI + Compare mode + notes + PDF aggregation

Each vertical supplies (all cleanly gated in cb_zinets today):

1. **Decomposition data source** — cb_zinets: ZiNets SQLite (`zn_zi_part`).
   Chemistry: SMILES/InChI parsing or PubChem — composition is machine-readable
   for free. Materials: crystal structure DBs. This is an *adapter*, one module.
2. **Node-type gate + widgets** — cb_zinets: `_is_single_cjk()` gates the
   stroke-order animation (HanziWriter) + pronunciation (🔊 speech). Chemistry:
   a formula gate + 3D structure viewer (e.g. 3Dmol.js) + IUPAC name audio.
   The widget slot in the page template is the same; the widget is per-domain.
3. **References row** — driven by `config.yaml resources:` already; per-domain
   link sets (汉典/字源 today; PubChem/Materials Project tomorrow).
4. **Search semantics** — pinyin/initials today; molecular formula, CAS number,
   theorem name aliases tomorrow. One `matchesQuery()` seam.
5. **The curated training set** — phrases-utube.txt's role: ~100 composites
   chosen so the primitives recur and the taxonomy reflects the field's own
   ontology (五行/seasons for hanzi; periodic groups/reaction classes for
   chemistry). This curation is the pedagogical heart of each vertical and
   cannot be automated away.

## Honest hard parts per new domain

- **Ground truth.** Hanzi etymology tolerates narrative license; chemistry and
  materials content is falsifiable. Scientific verticals need the `verifier`
  node field (already in the schema, unused) to become real: unit checks,
  formula validation, citation to authoritative DBs.
- **Decomposition ambiguity.** 汉字 decomposition is conventionalized;
  molecular "decomposition" depends on purpose (retrosynthesis vs. functional
  groups vs. bonding). Each vertical must pick one decomposition *convention*
  and state it — the graph is a teaching artifact, not the unique truth.
- **Data hygiene.** The zn_zi_part whitespace incident (2026-07-04) is the
  template: trim/validate at the adapter boundary, defensively in queries, and
  audit generated artifacts — every new data source will have its own version
  of stray spaces.

## The armature principle — deterministic bone, probabilistic flesh

A sculptor builds the armature first — the steel skeleton engineered before
any clay goes on — then fills it with flesh and finishes with the creative
surface. LLM app and workflow orchestration should follow the same
methodology, and ConceptBook already does.

*The word itself carries the layers (from Latin* armatura*, armor — to arm):
read it as "arm it with structure" (the literal etymology), "make it mature"
(structure is what lets content mature safely), or the electrical armature —
the load-bearing coil a motor's field acts on to do work. Sculpture, machines,
LLM apps: the same deterministic core that surrounding forces need in order to
produce anything.*

| | Bone (deterministic) | Flesh (probabilistic) |
|---|---|---|
| **What** | Graph schema, decomposition data, teaching order (BFS), page templates, symlink/canonical layout, TOC assembly, catalog, PDF aggregation, SPL orchestration (CALL/cache/verify steps) | Concept-section prose, capstone narrative, payoff — the words a learner reads |
| **Who makes it** | Code + curated data | LLM (per model × level × language) |
| **How it fails** | Bugs — reproducibly | Quality variance — statistically |
| **How it's QA'd** | Scripts, audits, assertions (pass/fail) | Compare mode, reviewer notes, human judgment (better/worse) |
| **How it's fixed** | Deterministically, and provably done | Regenerate, re-review, or pick a different model |

Design rules that follow:

1. **The LLM never touches the bone.** It fills named slots (a section per
   concept node) and nothing else — it does not decide graph structure,
   ordering, file layout, or navigation. Orchestration is code; generation is
   the model.
2. **Bone must be regenerable without the LLM.** Books, TOCs, symlinks,
   catalogs, PDFs can all be rebuilt from cached flesh (`cb_concepts`) at zero
   model cost. Flesh is the only expensive, irreplaceable artifact — cache it
   keyed by (concept, model, level, language) and never let a structural
   rebuild discard it.
3. **Match the QA to the layer.** Deterministic audits for bone (a book either
   has a valid TOC or it doesn't); comparative human+AI review for flesh
   (PANE A/B/C). Never review bone by eyeballing; never assert flesh with a
   regex.

The 2026-07-04 book-repair incident is the principle's proof: a bone bug
(offset arithmetic) damaged 405 books, and *because* the damage was
deterministic it had a deterministic shape — every file was reconstructed
without touching or regenerating one word of flesh. Structure breaks loudly
and repairs provably; content survives inside it.

## UI/UX templating discipline

From here on, every UI/UX decision gets classified at the moment it's made —
the template then emerges as a byproduct of building, not as a rewrite:

1. **Framework or vertical?** Ask it for every new control, page element, or
   interaction. If the answer is "framework," it must be expressible without
   any hanzi vocabulary ("composite," "primitive," "variant" — never "phrase,"
   "character," "pinyin").
2. **If vertical, name the slot it fills.** Current slot inventory:
   - *widget slot* — inline per-primitive tool in the concept-page title
     (stroke animation + 🔊 today; 3D molecule viewer tomorrow)
   - *detail-pane slot* — what Graph shows for a selected node
   - *search matcher* — `matchesQuery()` semantics (hanzi/pinyin/initials)
   - *references row* — `config.yaml resources:` link set
   - *taxonomy* — the curated-set categories (Animals/五行/Seasons …)
   - *node legend* — kind names, emoji (🌱🍃🌸), colors
   - *variant axes* — the (model, level, language) values offered in pickers
   A vertical-specific decision that fits no existing slot means we just
   discovered a new slot — add it to this list, that IS the templating work.
3. **Shared components stay shared.** One `matchesQuery`, one Compare pane,
   one thin-book TOC pattern — a change for one vertical's convenience must
   not fork a component the framework owns.
4. **Record the decision** — a line in this file (or the design doc) saying
   which side of the line it fell on. The accumulated log is the template
   spec for vertical #2.

## Sequencing

1. **Now** — ship the Chinese vertical: finish the 6-combo batch runs
   (3 models × en/zh over phrases-utube.txt), YouTube series (Hanzi Bricks /
   五湖四海学汉字), Compare-driven review.
2. **While shipping** — keep the seams honest: anything hanzi-specific stays
   behind its gate/adapter/config; resist letting it leak into the core.
   (No premature extraction — the second vertical, not the first, tells us
   where the real interface is.)
3. **Second vertical** — chemistry is the strongest candidate: finite primitive
   set (118 elements, ~dozens of functional groups), massive reuse, existing
   machine-readable decomposition (SMILES), a natural widget (3D viewer), and
   the same "semantic all the way down" property that makes the round-trip
   pedagogy work. `chemistry_elements/` in this repo is the seed.
4. **Then** — extract the true domain-neutral core into a reusable package
   with a vertical-adapter interface (decomposition, gate+widget, resources,
   search, taxonomy), informed by two real verticals instead of one.

## Positioning

"ConceptBook — a STEM approach to X learning." The tagline generalizes with
the platform: STEM as method (decompose → re-compose → generalize), *stem* as
generative core (radicals are the stem cells of hanzi; functional groups are
the stem cells of organic chemistry), STEM as audience.
