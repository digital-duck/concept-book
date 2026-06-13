import json
from api.config import settings

_CATALOG = settings.public_domains / "catalog.json"


def get_catalog() -> list[dict]:
    return json.loads(_CATALOG.read_text())


def mark_book_generated(domain_id: str, target: str) -> None:
    catalog = get_catalog()
    for d in catalog:
        if d["id"] == domain_id:
            # Track TOC-index books
            books: list[dict] = d.setdefault("books", [])
            book_file = f"book_{target}.html"
            if not any(b["target"] == target for b in books):
                books.append({"target": target, "file": book_file})
            d["has_book"] = True
            # Scan filesystem for generated concept HTML files
            domain_dir = settings.public_domains / domain_id
            d["generated_concepts"] = sorted(
                [
                    {
                        "name": p.stem[len("concept_"):],
                        "label": p.stem[len("concept_"):].replace("_", " ").title(),
                        "file": p.name,
                    }
                    for p in domain_dir.glob("concept_*.html")
                ],
                key=lambda c: c["label"],
            )
            break
    _CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
