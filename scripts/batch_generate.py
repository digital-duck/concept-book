#!/usr/bin/env python3
"""Batch pre-generate concept books for all domains.

Picks 1-2 application nodes per domain and runs spl3 for each,
updating catalog.json on success — same path as the FastAPI backend.

Prerequisites (spl123 conda env must be active):
    conda activate spl123
    pip install -r requirements-api.txt   # click, pyyaml, pydantic-settings

Usage examples:
    # Dry-run: show what would be generated
    python scripts/batch_generate.py --dry-run

    # Generate 1 application per domain at default level
    python scripts/batch_generate.py --n-targets 1

    # Only specific domains
    python scripts/batch_generate.py --domain mechanics --domain calculus

    # Skip already-generated targets
    python scripts/batch_generate.py --skip-existing

    # Override level and LLM
    python scripts/batch_generate.py --level college --llm claude_cli:claude-opus-4-8
"""
import json
import subprocess
import sys
from pathlib import Path

import click
import yaml

REPO_ROOT = Path(__file__).parent.parent
SPL_WORKFLOW = REPO_ROOT / "spl"
DOMAINS_DIR = REPO_ROOT / "public" / "domains"
CATALOG_PATH = DOMAINS_DIR / "catalog.json"


def _load_catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text())


def _save_catalog(catalog: list[dict]) -> None:
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")


def _get_application_ids(domain_id: str) -> list[str]:
    """Return ordered list of application node IDs from graph.yaml."""
    graph_yaml = DOMAINS_DIR / domain_id / "input" / "graph.yaml"
    if not graph_yaml.exists():
        return []
    data = yaml.safe_load(graph_yaml.read_text())
    apps = data.get("applications") or {}
    return list(apps.keys())


def _already_generated(catalog_entry: dict, target: str) -> bool:
    return any(b["target"] == target for b in catalog_entry.get("books", []))


def _mark_generated(domain_id: str, target: str, level: str, language: str) -> None:
    """Update catalog.json after a successful generation."""
    catalog = _load_catalog()
    variant = f"{level}.{language}"
    for d in catalog:
        if d["id"] != domain_id:
            continue
        books: list[dict] = d.setdefault("books", [])
        book_file = f"output/{variant}/html/book_{target}.html"
        if not any(b["target"] == target for b in books):
            books.append({"target": target, "file": book_file})
        d["has_book"] = True
        html_dir = DOMAINS_DIR / domain_id / "output" / variant / "html"
        d["generated_concepts"] = sorted(
            [
                {
                    "name": p.stem[len("concept_"):],
                    "label": p.stem[len("concept_"):].replace("_", " ").title(),
                    "file": f"output/{variant}/html/{p.name}",
                }
                for p in html_dir.glob("concept_*.html")
            ],
            key=lambda c: c["label"],
        )
        break
    _save_catalog(catalog)


def _run_spl3(
    domain_id: str,
    target: str,
    level: str,
    language: str,
    spl_dir: Path,
    llm: str,
    skip_cache: bool,
) -> bool:
    """Run spl3 synchronously, streaming output. Returns True on success."""
    output_dir = DOMAINS_DIR / domain_id / "output" / f"{level}.{language}" / "html"
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
    "--n-targets", default=2, show_default=True, type=click.IntRange(1, 5),
    help="Number of application nodes to generate per domain.",
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
    help="Skip targets already present in catalog.json books list.",
)
@click.option("--dry-run", is_flag=True, help="Print planned jobs without running them.")
@click.option(
    "--stop-on-error", is_flag=True, default=False,
    help="Abort the batch if any single generation fails.",
)
def main(
    domains: tuple,
    n_targets: int,
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
        selected = app_ids[:n_targets]
        for target in selected:
            if skip_existing and _already_generated(entry, target):
                click.echo(f"[skip] {did}/{target}: already in catalog")
                continue
            jobs.append((did, target, eff_level))

    if not jobs:
        click.echo("No jobs to run.")
        return

    click.echo(f"\n{'DRY RUN — ' if dry_run else ''}Planned {len(jobs)} generation job(s):\n")
    for did, target, eff_level in jobs:
        click.echo(f"  {did:30s}  target={target:35s}  level={eff_level}")
    click.echo()

    if dry_run:
        return

    succeeded, failed = 0, 0
    for did, target, eff_level in jobs:
        click.echo(f"{'='*70}")
        click.echo(f"GENERATING  domain={did}  target={target}  level={eff_level}  lang={language}")
        click.echo(f"{'='*70}")

        ok = _run_spl3(did, target, eff_level, language, spl_dir, llm, skip_cache)

        if ok:
            _mark_generated(did, target, eff_level, language)
            click.echo(f"[ok] {did}/{target} — catalog updated")
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
