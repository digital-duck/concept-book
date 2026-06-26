# ZiNets → ConceptBook: Chinese Characters Domain

## Goal

Prototype the `chinese_characters` concept-book domain by reading the ZiNets decomposition
database directly, replacing the hand-authored 33-node pilot with a full graph driven by
6,000+ characters and 422 elemental primitives.

**Prototype repo**: `~/projects/digital-duck/cb_zinets`

Once validated, the generated concept books are integrated into the `zinets_vis` web app
(`~/projects/Proj-ZiNets/zinets_vis`) so that any character the user taps produces an
on-demand lesson from its ancestor slice.

---

## Current State

`public/domains/chinese_characters/input/graph.yaml` is a **33-node pilot** — manually
authored to prove the concept-book schema maps naturally onto Chinese character structure:

- `composed_of` = character decomposition (部件)
- `primitives` = elemental pieces that don't decompose further
- `symbol` field holds pinyin
- The phono-semantic principle (形声字): learn ~200 pieces + 1 rule, decode thousands

This pilot must be replaced by a database-generated graph covering all 6,000+ characters.

---

## Data Source: ZiNets Database

**Database**: `~/projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite`

Two tables drive the graph:

### `zn_zi` — character metadata

| Field | Role in graph.yaml |
|---|---|
| `zi` | node key (the character itself) |
| `pinyin` | `symbol:` field |
| `zi_en` | `label:` field |
| `desc_en` | `defines:` field (falls back to `zn_character_cache.meaning`) |
| `is_picto` | `'Y'` → candidate primitive |
| `set_id` | grouping / HSK level (useful for tier assignment) |
| `is_active` | filter: `'Y'` only |

### `zn_zi_part` — character decomposition

| Field | Meaning |
|---|---|
| `zi` | the character being decomposed |
| `zi_left`, `zi_right` | left/right components |
| `zi_up`, `zi_down` | top/bottom components |
| `zi_left_up`, `zi_left_down`, `zi_right_up`, `zi_right_down` | corner components |
| `zi_mid`, `zi_mid_out`, `zi_mid_in` | middle/enclosure components |

Non-null/non-empty part fields → `composed_of:` edges in graph.yaml.

### `zn_character_cache` — LLM-generated definitions (fallback)

| Field | Role |
|---|---|
| `character` | matches `zn_zi.zi` |
| `meaning` | fallback `defines:` when `zn_zi.desc_en` is empty |
| `composition` | can supplement `defines:` with structural explanation |

---

## Primitive Identification (422 elemental characters)

The 422 elemental characters are those with **no decomposition** in `zn_zi_part` —
all part fields (`zi_left`, `zi_right`, `zi_up`, `zi_down`, etc.) are NULL or empty.
They map to `primitives:` (tier 0) in graph.yaml.

The remaining characters compose from this brick set and map to `concepts:`.
`graph_lib.reducible()` machine-verifies the LEGO claim: every character traces back
to the 422 primitives.

---

## Implementation Plan

### Step 1 — Write `scripts/zinets_to_graph.py`

A standalone script that reads the database and writes `graph.yaml`:

```
Input:  ~/projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite
Output: ~/projects/digital-duck/cb_zinets/input/graph.yaml
```

**Algorithm:**

```
1. Load all active zi with their parts
2. Identify primitives: zi where all part fields are null/empty  →  tier 0
3. For each non-primitive zi, collect non-empty part fields     →  composed_of list
4. Compute tiers: BFS from primitives; tier = 1 + max(tier of parts)
5. Build graph dict in ConceptBook format
6. Write graph.yaml
```

**graph.yaml node shape** (matches existing pilot):

```yaml
domain: chinese_characters
primitives:
  人:
    symbol: rén
    defines: person — a walking figure
    tier: 0
concepts:
  休:
    symbol: xiū
    defines: rest — a person leaning against a tree
    composed_of: [人, 木]
    tier: 1
```

**Fallback chain for `defines:`**:
1. `zn_zi.desc_en` (preferred — hand-curated)
2. `zn_character_cache.meaning` (LLM-generated, joined on `character = zi`)
3. `zn_zi.desc_cn` (Chinese description, last resort)
4. Empty string (validator will warn; fill in later)

### Step 2 — Validate

```bash
cd ~/projects/digital-duck/concept-book-press
python -B -m pipeline.cli validate \
  -i ~/projects/digital-duck/cb_zinets/input/graph.yaml
```

Expected checks: acyclic, reducible (every character traces to the 422 primitives),
valid references (no `composed_of` edge points to a character not in the graph).

### Step 3 — Generate graph.html navigator

```bash
cd ~/projects/digital-duck/concept-book
python scripts/concept_graph.py \
  --domain ~/projects/digital-duck/cb_zinets/input/graph.yaml \
  visualize --format html \
  --output ~/projects/digital-duck/cb_zinets/output/graph.html
```

### Step 4 — Generate concept books

The `cb_zinets` repo needs its own `catalog.json` and SPL pipeline config pointing at
`~/projects/digital-duck/cb_zinets/` as the domain root. This step is TBD pending
decisions on scope and integration approach (see Open Questions).

### Step 5 — Integrate into zinets_vis

The `zinets_vis` web app (`~/projects/Proj-ZiNets/zinets_vis`) serves character tree
visualizations. Integration point: when the user taps a character node, surface the
corresponding concept book from ConceptBook.

**Approach (to be designed):**
- ConceptBook hosts `concept_{zi}.html` per character at its GitHub Pages URL
- `zinets_vis` frontend opens the concept book in a sidebar panel or modal
- Link pattern: `{CB_BASE}/chinese_characters/output/intro.zh/html/concept_{zi}.html`

---

## Key Files

| File | Purpose |
|---|---|
| `~/projects/digital-duck/cb_zinets/scripts/zinets_to_graph.py` | **to write** — DB → graph.yaml exporter |
| `~/projects/digital-duck/cb_zinets/input/graph.yaml` | generated output |
| `~/projects/digital-duck/cb_zinets/output/graph.html` | vis.js navigator (generated by concept_graph.py) |
| `~/projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite` | source database (`zn_zi`, `zn_zi_part`) |
| `~/projects/digital-duck/concept-book/public/domains/chinese_characters/input/graph.yaml` | 33-node pilot (reference only) |

---

## Open Questions

1. **Scope**: all 6,000+ active characters, or start with a curated subset (e.g.,
   HSK 1–3 via `set_id IN ('300', '100', '10')`) for the first prototype run?
2. **Applications tier**: some characters are compound words or idiomatic — map to
   `applications:` rather than `concepts:`?
3. **`zn_zi_part` coverage**: characters with no decomposition row but that aren't
   truly elemental need a fallback rule (treat as primitive? skip?).
4. **zinets_vis integration**: iframe embed, sidebar panel, or deep link?
