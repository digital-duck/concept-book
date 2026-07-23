import sys
from pathlib import Path

from api.config import settings

# scripts/ on sys.path so catalog_lock.py (the single locked read/write path,
# shared with scripts/batch_generate.py) is importable without duplicating it.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))
from catalog_lock import read_catalog, update_catalog  # noqa: E402

_CATALOG = settings.public_domains / "catalog.json"


def get_catalog() -> list[dict]:
    return read_catalog(_CATALOG)


def mark_book_generated(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
) -> None:
    variant = f"{level}.{language}"
    html_dir = settings.public_domains / domain_id / "output" / variant / model / "html"
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
            # Deduplicate by (target, model) pair
            if not any(b["target"] == target and b.get("model") == model for b in books):
                books.append({"target": target, "file": book_file, "model": model})
            d["has_book"] = True

            # Preserve legacy entries (no model field) and entries from other models
            other = [c for c in d.get("generated_concepts", []) if c.get("model") != model]
            d["generated_concepts"] = sorted(
                other + new_concepts,
                key=lambda c: c["label"],
            )
            break

    update_catalog(mutate, _CATALOG)
