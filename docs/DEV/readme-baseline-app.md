# Baseline ConceptBook App: Refactoring Plan

## Goal

Extract a shared, framework-agnostic **`concept-book-base`** template from the two
existing apps so future concept-book web apps (a third domain, a fourth, ...) start
from a proven skeleton instead of forking `concept-book` wholesale (which is how
`cb-zinets` came to exist).

**Two codebases compared:**
- `concept-book` — general multi-domain STEM/CS/humanities concept-graph portal (53 domains: linalg, mechanics, chemistry_elements, college_physics_ch1-34, etc.)
- `cb-zinets` — fork of `concept-book`, specialized for Chinese character/idiom decomposition (138 idiom domains + shared canonical single-character concept store), with a hosted multi-user deployment layer (OAuth, BYOK API keys, task queue) added on top.

`cb-zinets`'s own `CLAUDE.md` already says "Mirrors `~/projects/digital-duck/concept-book`" — this plan formalizes that relationship into an explicit base + extensions structure instead of an implicit fork-and-diverge one.

---

## Guiding principle

Both apps share the same core contract:

```
public/domains/{id}/
  input/graph.yaml                 # concept graph: primitives → concepts → applications
  output/graph.html                # vis.js navigator (generated)
  output/{level}.{lang}/[{model}/]html/
    book_{target}.html             # TOC-index concept book
    concept_{name}.html            # individual concept page
```

and the same shell: Vite + vanilla JS, hash router, iframe-embedded graph navigator,
FastAPI backend that shells out to an SPL pipeline. Everything that follows from that
contract — router, catalog schema, graph viewer, book reader, SPL executor — belongs
in the base. Everything that follows from *what the domain is* (Chinese characters vs.
physics chapters) or *how the app is hosted* (local dev tool vs. multi-user SaaS)
belongs in an extension layer.

---

## Target structure

```
concept-book-base/            # new template repo (or a `template/` dir promoted later to its own repo)
  src/
    router.js                 # generalized query-string version (from cb-zinets)
    main.js                   # route table with optional auth-guard hook (no-op by default)
    i18n.js
    style.css                 # shared design tokens; logo/brand as CSS vars, not hardcoded
    data/
      catalog.js              # revalidating fetch + loadDomainDetail + pluggable matchesQuery
    lib/
      paths.js                # variant-path builder (from cb-zinets)
      contentExists.js        # existence-cache (from cb-zinets)
    pages/
      Home.js Domain.js BookPage.js Settings.js About.js
    components/
      Header.js DomainCard.js GraphViewer.js LanguagePicker.js
      book/
        content.js controls.js NavSidebar.js TocSidebar.js   # modular BookPage, from cb-zinets's split
  api/
    app.py                    # lifespan + router registration list is data, not code
    config.py                 # Settings base class; deployment layer subclasses to add fields
    routers/
      generate.py domains.py settings.py pdf.py compare.py
    services/
      catalog_svc.py          # locked read/write (from cb-zinets's catalog_lib.py)
      executor.py             # generalized command-builder, shared_concepts_dir optional/off by default
      compare_svc.py pdf_svc.py
  scripts/
    concept_graph.py sync_from_spl.sh html2pdf.js start-api.sh
  public/
    domains/catalog.json      # schema doc + example
  docs/
    CLAUDE.md.template         # doc skeleton: Commands / Architecture / domain layout / env vars / related repos
  package.json vite.config.js requirements-api.txt

extensions/                   # optional, opt-in layers — NOT part of the minimal base
  hosted-multiuser/           # auth.py, auth_svc.py, db.py, task_worker.py, tasks.py, api_keys.py, api_keys_svc.py, Login.js, services/auth.js, SessionMiddleware
  compare-ui/                 # ComparePane.js (backend compare.py/compare_svc.py stays in base since it's already shared+generic)
  chat-widget/                # chat.py, ChatWidget.js
  shared-concept-store/       # cross-domain concept dedup: shared_concepts_dir, canonical_concept_rel, "thin book" PDF aggregation
```

`concept-book` becomes `concept-book-base` + zero extensions.
`cb-zinets` becomes `concept-book-base` + `hosted-multiuser` + `compare-ui` + `chat-widget`
+ `shared-concept-store` + its own `zinets/` domain-specific package (see below).

---

## What moves into the base, verbatim or near-verbatim

Source of truth is noted since the two versions aren't always identical.

| File | Take from | Why |
|---|---|---|
| `src/router.js` | cb-zinets | Strict superset — generalizes query-string parsing, stays backward-compatible with concept-book's routes |
| `src/components/DomainCard.js` | either | Byte-identical |
| `api/routers/generate.py`, `api/services/compare_svc.py`, `api/routers/compare.py` | either | Byte-identical |
| `api/routers/settings.py`, `api/routers/pdf.py` | cb-zinets | Strict superset; extra fields become optional/default-off |
| `package.json` scripts, vite config pattern | either | `base` and proxy port become template variables |
| `graph.yaml` / `catalog.json` schema | either | Same contract in both; core fields only — domain-specific fields (pinyin, description, stats) layer on top |
| `scripts/concept_graph.py`, `scripts/html2pdf.js` | cb-zinets | UI-only polish on top of identical logic |
| `api/services/catalog_svc.py` | rebuilt from cb-zinets's `scripts/catalog_lib.py` | Adds file-locking that concept-book's naive read-modify-write lacks — a real bug fix, not just a preference |
| `src/lib/paths.js`, `src/lib/contentExists.js` | cb-zinets | Clean abstraction with no counterpart in concept-book; decouple from the model/level/lang picker sync logic that assumes 3-axis catalog shape |
| `src/pages/BookPage.js` → `book/{content,controls,TocSidebar,NavSidebar}.js` | cb-zinets's decomposition | Same logic as concept-book's monolithic 439-line file, just split — pure refactor win |
| `api/services/executor.py` | generalized from cb-zinets | Extract the `--param` command-builder pattern; `shared_concepts_dir` defaults to `None`/off |
| `api/services/pdf_svc.py` | concept-book's simple path as default | "Thin book" aggregation becomes a hook triggered by detecting thin-vs-fat books generically, not hardcoded to ZiNets |

## What becomes a config/extension point, not a hardcoded value

- **Header branding**: `logoImage: null | url`, `appTitle`, `showAuthControls: boolean` — currently cb-zinets hardcodes the seal-zi logo and login/logout UI inline in `Header.js`.
- **Settings page layout**: base ships the simple untabbed SPL-adapter+model form (concept-book's); tabs + BYOK API-key panel become an opt-in extension.
- **`matchesQuery` search**: base ships plain substring match; pinyin-fuzzy matching becomes a domain-supplied plugin function.
- **`main.js` route guard**: base ships routes unguarded; `guarded()` wrapper is a one-line opt-in for apps that add the `hosted-multiuser` extension.
- **CLAUDE.md/README skeleton**: both repos already follow the same doc structure (Commands / Architecture / domain layout / env vars / related repos) — worth codifying as a template with placeholders, since content is inherently domain-specific but the shape isn't.

## What stays out of the base entirely (zinets domain package)

Everything specific to *Chinese character decomposition as a domain*, not to hosting
concept-book generically:

- `scripts/zinets_to_graph.py`, `phrase_decomposer.py`, `pinyin_lib.py` (+ its backfill scripts) — DB-to-graph.yaml exporter and pinyin enrichment, tied to the ZiNets SQLite schema (`zn_zi`, `zn_zi_part`, `zn_character_cache`) documented in [[readme-zinets]].
- `public/resources.json`, `Resources.js`, `data/resources.js`, the char-tools stroke-order/TTS widget stripped in `pdf_svc.py`.
- ZiNets branding assets, idiom-named domain corpus, `scripts/maintenance/*` migration scripts, `zip_db_files.sh` DB packaging.

## What's genuinely a separate concern, not "base" and not "zinets" either

The **hosted multi-user layer** (`auth.py`, `auth_svc.py`, `db.py`, `task_worker.py`,
`tasks.py`, `api_keys.py`, `api_keys_svc.py`, `Login.js`, `services/auth.js`,
`SessionMiddleware`) is the largest subsystem cb-zinets added beyond ZiNets content
itself. It exists because cb-zinets is deployed as a hosted, multi-user, bring-your-
own-key service, while `concept-book` is a local dev tool + static GitHub Pages site.
Any future concept-book app that needs hosted multi-user deployment (not just Chinese
content) would want this layer too — so it's modeled as its own optional extension
package, not folded into either the base or a domain package.

Same logic applies to `ChatWidget.js`/`chat.py` (LLM chat sidebar) and `ComparePane.js`
(the backend `compare.py`/`compare_svc.py` is already shared and generic; only the UI
consumer is cb-zinets-only today) — both are proven in exactly one app so far, so they
ship as opt-in extensions rather than base features, promotable to the base once a
second app wants them.

---

## Migration steps

1. **Create `concept-book-base`** as a new repo, seeded from `concept-book` (it's
   closer to "base" already — no auth/task-queue/chat baggage to strip).
2. **Pull in the cb-zinets improvements** listed above (router.js, catalog_svc locking,
   lib/paths.js, BookPage decomposition, executor.py generalization) via targeted
   patches, not a merge — these are the pieces where cb-zinets's version is strictly
   better engineering, independent of Chinese-specific content.
3. **Add the config/extension points** (Header branding vars, Settings layout switch,
   `matchesQuery` plugin hook, route-guard hook) so the base can flex without forking.
4. **Re-point `concept-book`** at `concept-book-base` (should require near-zero changes,
   since it's the seed) to prove the base works standalone.
5. **Re-point `cb-zinets`** at `concept-book-base` + the four extension packages
   (`hosted-multiuser`, `compare-ui`, `chat-widget`, `shared-concept-store`) + a new
   `zinets/` domain package for the DB exporter, pinyin lib, and resources. This is the
   real test: if cb-zinets can be expressed as base + extensions + domain package with
   no leftover forked files, the refactor is complete.
6. **Document the extension contract** (what hooks/config points an app can override,
   what an extension package is allowed to touch) in `concept-book-base`'s own
   `CLAUDE.md`, so a third app (e.g., a future non-Chinese language-learning domain, or
   a math-notation-heavy domain) can be built as base + a thin domain package without
   re-deriving these decisions.

## Open questions for the user

- Should `concept-book-base` live as a standalone repo from day one, or start as a
  `template/` subdirectory inside `concept-book` and get promoted later once proven?
- Is the `shared-concept-store` (cross-domain concept dedup) worth generalizing now,
  or should it stay zinets-specific until a second app actually needs cross-domain
  dedup? (Recommendation: leave it zinets-specific for now — it's overengineering for
  concept-book's largely-disjoint STEM domains.)
- Should `hosted-multiuser` be built out as a real reusable package now, or just
  *identified* as a boundary (files kept together, not entangled with domain logic)
  until a second app actually needs hosted auth?
