#!/usr/bin/env python3
"""Batch pre-generate concept books for all domains.

Picks every application node per domain (the whole graph.yaml applications:
dict, in order) and runs spl3 for each, updating catalog.json on success —
same path as the FastAPI backend. Skipping applications beyond the first
few used to be the default; a domain like college_physics_ch24 has 12, so
capping silently left the static site incomplete for the rest.

Prerequisites (spl123 conda env must be active):
    conda activate spl123
    pip install -r requirements-api.txt   # click, pyyaml, pydantic-settings

Usage examples:
    # Dry-run: show what would be generated
    python scripts/batch_generate.py --dry-run

    # Cap cost: at most 1 application per domain
    python scripts/batch_generate.py --n-targets 1

    # Only specific domains
    python scripts/batch_generate.py --domain mechanics --domain calculus

    # Skip already-generated targets
    python scripts/batch_generate.py --skip-existing

    # Override level and LLM
    python scripts/batch_generate.py --level college --llm claude_cli:claude-opus-4-8

    # Language accepts ISO codes or friendly names (case-insensitive)
    python scripts/batch_generate.py --language chinese
    python scripts/batch_generate.py --language French
    python scripts/batch_generate.py --language zh
"""
import subprocess
import sys
from pathlib import Path

import click
import yaml

sys.path.insert(0, str(Path(__file__).parent))
from catalog_lock import read_catalog, update_catalog  # noqa: E402

REPO_ROOT = Path(__file__).parent.parent
SPL_WORKFLOW = REPO_ROOT / "spl"
DOMAINS_DIR = REPO_ROOT / "public" / "domains"
CATALOG_PATH = DOMAINS_DIR / "catalog.json"

# Maps friendly language names and aliases → ISO 639-1 codes (case-insensitive lookup).
_LANG_MAP: dict[str, str] = {
    "english":    "en",
    "chinese":    "zh",
    "mandarin":   "zh",
    "french":     "fr",
    "spanish":    "es",
    "german":     "de",
    "japanese":   "ja",
    "korean":     "ko",
    "portuguese": "pt",
    "italian":    "it",
    "russian":    "ru",
    "arabic":     "ar",
    "hindi":      "hi",
}


def _resolve_lang(raw: str) -> str:
    """Accept ISO code or friendly name, return ISO 639-1 code."""
    key = raw.strip().lower()
    if key in _LANG_MAP:
        return _LANG_MAP[key]
    # Already an ISO code (2-3 chars) or unknown — pass through as-is
    return key


# Maps spl3 llm strings → short model names used as folder segments.
# For ollama:{name}, the name is used directly if not listed here.
_LLM_TO_MODEL: dict[str, str] = {
    "ollama:gemma3":                    "gemma3",
    "ollama:gemma4":                    "gemma4",
    "claude_cli:claude-sonnet-4-6":     "sonnet",
    "claude_cli:claude-haiku-4-5-20251001": "haiku",
    "claude_cli:claude-opus-4-8":       "opus",
}


def _llm_to_model(llm: str) -> str:
    if llm in _LLM_TO_MODEL:
        return _LLM_TO_MODEL[llm]
    if llm.startswith("ollama:"):
        return llm[len("ollama:"):]
    return llm.replace(":", "_").replace("-", "_")


def _load_catalog() -> list[dict]:
    return read_catalog(CATALOG_PATH)


def _get_application_ids(domain_id: str) -> list[str]:
    """Return ordered list of application node IDs from graph.yaml."""
    graph_yaml = DOMAINS_DIR / domain_id / "input" / "graph.yaml"
    if not graph_yaml.exists():
        return []
    data = yaml.safe_load(graph_yaml.read_text())
    apps = data.get("applications") or {}
    return list(apps.keys())


def _already_generated(catalog_entry: dict, target: str, model: str) -> bool:
    return any(
        b["target"] == target and b.get("model") == model
        for b in catalog_entry.get("books", [])
    )


def _mark_generated(domain_id: str, target: str, level: str, language: str, model: str) -> None:
    """Update catalog.json after a successful generation."""
    variant = f"{level}.{language}"
    html_dir = DOMAINS_DIR / domain_id / "output" / variant / model / "html"
    new_concepts = [
        {
            "name": p.stem[len("concept_"):],
            "label": p.stem[len("concept_"):].replace("_", " ").title(),
            "file": f"output/{variant}/{model}/html/{p.name}",
            "model": model,
        }
        for p in html_dir.glob("concept_*.html")
    ]

    def mutate(catalog: list[dict]) -> None:
        for d in catalog:
            if d["id"] != domain_id:
                continue
            books: list[dict] = d.setdefault("books", [])
            book_file = f"output/{variant}/{model}/html/book_{target}.html"
            if not any(b["target"] == target and b.get("model") == model for b in books):
                books.append({"target": target, "file": book_file, "model": model})
            d["has_book"] = True
            # Preserve legacy entries (no model field) and entries from other models
            other = [c for c in d.get("generated_concepts", []) if c.get("model") != model]
            d["generated_concepts"] = sorted(other + new_concepts, key=lambda c: c["label"])
            break

    update_catalog(mutate, CATALOG_PATH)


def _run_spl3(
    domain_id: str,
    target: str,
    level: str,
    language: str,
    model: str,
    spl_dir: Path,
    llm: str,
    skip_cache: bool,
) -> bool:
    """Run spl3 synchronously, streaming output. Returns True on success."""
    output_dir = DOMAINS_DIR / domain_id / "output" / f"{level}.{language}" / model / "html"
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "spl3", "run", str(SPL_WORKFLOW / "build_concept_book.spl"),
        "--tools", str(SPL_WORKFLOW / "tools.py"),
        "--llm", llm,
        "--param", f"domain_yaml={domain_id}_graph.yaml",
        "--param", f"target={target}",
        "--param", f"lvl={level}",
        "--param", f"language={language}",
        "--param", f"output_dir={output_dir}",
        "--param", f"skip_cache={'yes' if skip_cache else 'no'}",
        "--param", f"llm={llm}",
    ]

    result = subprocess.run(cmd, cwd=str(spl_dir))
    return result.returncode == 0


@click.command()
@click.option(
    "--domain", "domains", multiple=True,
    help="Domain ID to generate (repeatable). Default: all domains in catalog.",
)
@click.option(
    "--n-targets", default=None, type=int,
    help="Cap the number of applications generated per domain (default: all of them).",
)
@click.option(
    "--level", default=None,
    help="Override content level (intro/core/college/research). Default: each domain's default_level.",
)
@click.option("--language", default="en", show_default=True, help="Output language code.")
@click.option(
    "--llm", default="claude_cli:claude-sonnet-4-6", show_default=True,
    envvar="CB_LLM", help="LLM backend string passed to spl3.",
)
@click.option(
    "--spl-dir", default=None, type=click.Path(path_type=Path),
    envvar="CB_SPL_DIR",
    help="Path to SPL.py project root. Default: ~/projects/digital-duck/SPL.py",
)
@click.option("--skip-cache", is_flag=True, help="Pass skip_cache=yes to spl3.")
@click.option(
    "--skip-existing", is_flag=True,
    help="Skip targets already present in catalog.json books list for this model.",
)
@click.option("--dry-run", is_flag=True, help="Print planned jobs without running them.")
@click.option(
    "--stop-on-error", is_flag=True, default=False,
    help="Abort the batch if any single generation fails.",
)
def main(
    domains: tuple,
    n_targets: int | None,
    level,
    language: str,
    llm: str,
    spl_dir,
    skip_cache: bool,
    skip_existing: bool,
    dry_run: bool,
    stop_on_error: bool,
) -> None:
    """Batch pre-generate concept books for multiple domains."""
    if spl_dir is None:
        spl_dir = Path.home() / "projects" / "digital-duck" / "SPL.py"

    model = _llm_to_model(llm)
    language = _resolve_lang(language)

    catalog = _load_catalog()
    domain_map = {d["id"]: d for d in catalog}

    targets_domains = [d for d in catalog if not domains or d["id"] in domains]
    if domains:
        missing = set(domains) - set(domain_map)
        if missing:
            click.echo(f"[warn] Unknown domain(s): {', '.join(sorted(missing))}", err=True)

    jobs = []  # list of (domain_id, target, eff_level)
    for entry in targets_domains:
        did = entry["id"]
        eff_level = level or entry.get("default_level", "intro")
        app_ids = _get_application_ids(did)
        if not app_ids:
            click.echo(f"[skip] {did}: no application nodes in graph.yaml")
            continue
        selected = app_ids[:n_targets] if n_targets else app_ids
        for target in selected:
            if skip_existing and _already_generated(entry, target, model):
                click.echo(f"[skip] {did}/{target} ({model}): already in catalog")
                continue
            jobs.append((did, target, eff_level))

    if not jobs:
        click.echo("No jobs to run.")
        return

    click.echo(f"\n{'DRY RUN — ' if dry_run else ''}Planned {len(jobs)} generation job(s)  [model={model}]:\n")
    for did, target, eff_level in jobs:
        click.echo(f"  {did:30s}  target={target:35s}  level={eff_level}")
    click.echo()

    if dry_run:
        return

    succeeded, failed = 0, 0
    for did, target, eff_level in jobs:
        click.echo(f"{'='*70}")
        click.echo(f"GENERATING  domain={did}  target={target}  level={eff_level}  lang={language}  model={model}")
        click.echo(f"{'='*70}")

        ok = _run_spl3(did, target, eff_level, language, model, spl_dir, llm, skip_cache)

        if ok:
            _mark_generated(did, target, eff_level, language, model)
            click.echo(f"[ok] {did}/{target} ({model}) — catalog updated")
            succeeded += 1
        else:
            click.echo(f"[FAIL] {did}/{target}", err=True)
            failed += 1
            if stop_on_error:
                click.echo("Aborting batch (--stop-on-error).", err=True)
                sys.exit(1)

    click.echo(f"\nBatch complete: {succeeded} succeeded, {failed} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
