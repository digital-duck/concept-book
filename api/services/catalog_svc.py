import json
from api.config import settings

_CATALOG = settings.public_domains / "catalog.json"


def get_catalog() -> list[dict]:
    return json.loads(_CATALOG.read_text())


def mark_book_generated(domain_id: str) -> None:
    catalog = get_catalog()
    for d in catalog:
        if d["id"] == domain_id:
            d["has_book"] = True
            break
    _CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
