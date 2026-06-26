# Content Review Process & Quality Architecture

## The Unifying Vision: Knowledge as Code

The ConceptBook project and the Agentic SDLC (see *Beyond Vibe Coding*, NeurIPS 2026) are two
instances of the same abstract engineering discipline applied to two different domains.

The NeurIPS paper establishes **Intent Invariance** for software:

> T⁻¹(T(I)) ≈ I
>
> where T is the forward compilation (NL → SPL → Code) and T⁻¹ is the reverse extraction
> (Code → describe → NL spec). The `.spl` script is the **intent-invariant intermediate
> representation** — the logical view that captures original design intent independent of any
> specific runtime.

ConceptBook is the same discipline applied to knowledge creation:

> K⁻¹(K(B)) ≈ B
>
> where K is the forward extraction (Textbook → concept-graph → concept-book) and K⁻¹ is the
> reverse (concept-book → describe → concept-graph description). The **concept-graph** is the
> knowledge-invariant IR — the logical view that captures the essential knowledge structure
> independent of any specific language, level, or presentation format.

This normalizes software creation and content creation to the same epistemological footing:

| Software SDLC (NeurIPS)          | Knowledge SDLC (ConceptBook)                     |
|----------------------------------|--------------------------------------------------|
| Validated, running codebase      | Human-authored, peer-reviewed textbook           |
| `spec.md` (S1 — reverse extract) | Concept-graph (`graph.yaml`) from textbook       |
| `.spl` script                    | `build_concept_book.spl`                         |
| Compiled code (S4)               | Generated concept-book HTML                      |
| Reconstructed spec (S5)          | Concept-book content description                 |
| `spl3 compare` S1 vs S5 (S6)     | `spl3 compare` textbook-section vs concept-book  |
| Intent Drift ΔS                  | Knowledge Drift ΔK                               |
| Mermaid topology (human gate)    | Concept-graph (human gate)                       |
| Coding agent constrained by SPL  | LLM constrained by concept-graph                 |

In both cases, the **human's role shifts from producer to validator**: instead of writing
artifacts directly, they approve the intermediate representation. The bounded generation
principle holds in both domains — the LLM gets a better brief when it works from a
structured graph than from unconstrained natural language.

---

## Two Ingestion Paths

### Path A — Graph-First (concept-graph as primary artifact)

The concept-graph is created directly from domain expertise, not extracted from an existing
textbook. The graph *is* the original artifact.

```
Human experts define concept-graph (graph.yaml)
    ↓
[human validates: topology, prereqs, tiers]
    ↓
build_concept_book.spl → LLM generates concept-book HTML
    ↓
Quality gate: spl3 compare graph-node-spec vs generated-content
    ↓  (compares LLM output against the graph's own defines/prereqs fields)
Auto-revision loop if ΔK < threshold
    ↓
Human review queue
```

**Reference for compare**: The `graph.yaml` node fields (`defines`, `prereqs`, `play`,
`verifier`) serve as the spec. The quality question is: *does the generated content faithfully
cover what the graph specifies?*

**Domains**: linalg, calculus, mechanics, sage_learning, python_science, chinese_characters,
english_morphology, geometry, music_theory, lean_proving, ...

**Limitation**: The graph itself may be incomplete or LLM-generated. The spec is only as
strong as the graph authoring.

---

### Path B — Textbook-First (human-authored source as ground truth)

A peer-reviewed, open-source textbook (e.g., OpenStax) is the primary artifact. The
concept-graph is *extracted* from it — analogous to running `spl3 splc describe` on an
existing codebase to produce `spec.md`.

```
Human-authored, peer-reviewed textbook (OpenStax, etc.)
    ↓  [concept-book-press pipeline]
    ├── ingest: HTML (openstax.py) or PDF (pdf.py) → chunks.yaml
    │   (chunks.yaml = authoritative textbook sections, per concept, with math)
    ├── extract: graph_extractor.py (2-pass LLM) → graph.yaml
    └── validate: checker.py (NetworkX, 5 structural invariants) → validated graph
    ↓
[human validates concept-graph: is the extracted topology correct?]
    ↓
build_concept_book.spl → LLM generates concept-book HTML
    ↓
Quality gate: spl3 compare chunks.yaml-section vs generated-content
    ↓  (much stronger: reference is expert human writing)
Auto-revision loop if ΔK < threshold
    ↓
Human review queue with full iteration history and ΔK scores
```

**Reference for compare**: `chunks.yaml` per-section text — the original textbook prose,
extracted during ingestion and stored alongside the graph. This is the **strongest possible
quality gate**: the reference was written by domain experts and peer-reviewed. A low ΔK score
means the generated content diverges from what authoritative humans wrote about that concept.

**Domains**: college_physics_ch1, college_physics_ch2 (OpenStax), and any future textbook
ingestions via concept-book-press.

**Missing link**: `concept-book-press` currently does not persist the mapping
`concept-name → chunks.yaml-section` after extraction. This mapping is implicit in
`graph_extractor.py`'s two-pass LLM extraction but is not stored. Persisting it as
`input/concept_sources.yaml` is the prerequisite for wiring up the Path-B quality gate.

---

## The Auto-Revision Loop

The `spl3 compare` output (multi-tier: LLM semantic verdict + ROUGE + BERTScore) provides
structured feedback that can directly drive revision — no additional judge design needed.
The verdict already says things like "the draft omits X" or "contradicts the reference on Y";
this is exactly the feedback you would write by hand as a revision instruction.

```
generate_draft(concept, graph, level, lang, model)
    ↓
compare_result = spl3 compare reference.md draft.html
                   --mode llm --mode rouge --mode bert-score --format json
ΔK = compare_result.synthesis.overall_score
revision = 0

WHILE ΔK < threshold AND revision < max_revisions:
    verdict = compare_result.synthesis.verdict
    draft = llm(f"Revise to address: {verdict}\n\n{draft}")
    compare_result = spl3 compare reference.md draft.html ...
    ΔK = compare_result.synthesis.overall_score
    revision += 1

→ human review queue with:
    - final draft
    - ΔK score per iteration (shows whether revisions converge)
    - compare verdict (what was contested)
    - revision count
```

**Path A vs Path B**: The loop is identical; only the reference changes. Path B's reference
(textbook section) produces richer, more meaningful feedback than Path A's (graph node
definition). Same code, different quality ceiling.

---

## Multi-Model Quality Architecture

With model-specific output directories, `spl3 compare` enables a **quality triangle**:

```
output/{level}.{lang}/gemma3/html/concept_X.html    ← baseline (default, free, local)
output/{level}.{lang}/sonnet/html/concept_X.html    ← premium
output/{level}.{lang}/gemma4/html/concept_X.html    ← local high-quality
output/{level}.{lang}/quality/concept_X.{A}-vs-{B}.json  ← compare result
```

Three comparisons are meaningful:

| Comparison | Purpose |
|---|---|
| `gemma3 vs textbook` | How far is the baseline from the authoritative source? |
| `sonnet vs textbook` | How far is the premium model? |
| `gemma3 vs sonnet`   | What does the premium model add over baseline? |

**Default model**: `gemma3` (via Ollama). Rationale: runs locally without GPU, zero cost,
zero API dependency — the lowest common denominator that every user can run. "Default" means
baseline, not best. Users with Sonnet access can generate premium outputs alongside the
baseline; quality scores make the difference visible and actionable.

**Human review workflow**: The review queue surfaces ΔK scores for all models and both
compare directions. The reviewer sees exactly what was contested and which model's output
is closest to the authoritative source — minimizing reading burden for approval.

---

## The Bigger Vision: Open-Source Knowledge Graphs

**For software** (NeurIPS framing): The `.spl` script is a portable intermediate
representation. The same logical intent compiles to Python, Go, or TypeScript; runs on
local Ollama or cloud Claude. The code is the coordinate; the SPL is the invariant.

**For knowledge** (ConceptBook framing): The `concept-graph` is a portable knowledge
representation. The same graph generates a concept-book in English or Chinese, at intro
or college level, with gemma3 or Sonnet. The specific text is the coordinate; the graph
is the invariant.

If open-source textbooks (OpenStax, LibreTexts, MIT OCW) are systematically ingested via
`concept-book-press`, their concept-graphs become freely available knowledge IRs —
forkable, improvable, composable. Anyone can take a graph, generate their own concept-book
in their language and at their level, and verify quality against the original textbook via
`spl3 compare`.

> Just as open-source code democratized software creation — separating the *logic* from any
> specific implementation — open-source concept-graphs democratize knowledge dissemination:
> separating the *structure of knowledge* from any specific textbook, language, or
> presentation format. Knowledge becomes as free as open-source software.

This is not a content platform (there are many). It is a **knowledge structure platform**
where the concept-graph is the shareable, verifiable unit, and concept-book generation is
a derivable, quality-gated, model-agnostic artifact.

---

## Implementation Roadmap

### Phase 1 — Path-B missing link
Persist the `concept-name → chunks.yaml-section` mapping in `concept-book-press` after
extraction. Output: `input/concept_sources.yaml` per domain. This is the prerequisite
for the Path-B quality gate.

### Phase 2 — Model-specific output directories
Add `/{model}/` segment to output path. Update `build_concept_book.spl`,
`scripts/sync_from_spl.sh`, catalog schema (`model` field on book entries), and
frontend model selector. Default: `gemma3`.

### Phase 3 — Auto-revision loop in `build_concept_book.spl`
Add a `@step compare_and_revise` that runs `spl3 compare`, checks ΔK, and loops
revision up to `SPL_MAX_REVISIONS` times before emitting the draft to the human
review queue.

### Phase 4 — Human review UI
Surface ΔK scores, revision history, and compare verdicts in the Concept Books sidebar.
Allow reviewer to approve, reject, or trigger another revision pass.

### Phase 5 — Open-source knowledge graph library
Systematic ingestion of open-source textbooks via `concept-book-press`, published as a
standalone open-source dataset. The concept-graphs, not the generated text, are the
primary shareable artifact.
