import json
from api.config import settings

_CATALOG = settings.public_domains / "catalog.json"


def get_catalog() -> list[dict]:
    return json.loads(_CATALOG.read_text())


def mark_book_generated(domain_id: str, target: str, level: str = "intro", language: str = "en") -> None:
    catalog = get_catalog()
    variant = f"{level}.{language}"
    for d in catalog:
        if d["id"] == domain_id:
            books: list[dict] = d.setdefault("books", [])
            book_file = f"output/{variant}/html/book_{target}.html"
            if not any(b["target"] == target for b in books):
                books.append({"target": target, "file": book_file})
            d["has_book"] = True
            html_dir = settings.public_domains / domain_id / "output" / variant / "html"
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
    _CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
