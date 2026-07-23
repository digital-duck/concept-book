"""Single write-path for public/domains/catalog.json.

catalog.json is read by the frontend as static data but can be written by
several producers (the /api/generate FastAPI endpoint, batch scripts, CLI
repairs). A naive read-modify-write lets concurrent writers silently drop
each other's updates -- this happened for real: the API server (running
with --reload since before a batch_gen_domains.py run) and the batch script
each read-modified-wrote catalog.json independently, and one write clobbered
college_physics_ch05's just-generated book entry even though the book itself
generated successfully on disk.

All mutations should go through update_catalog(), which serializes writers
with an fcntl lock and publishes atomically (temp file + os.replace), so
readers never see a torn file. Both api/services/catalog_svc.py and
scripts/batch_generate.py import this module rather than duplicating the
read/write logic.
"""
from __future__ import annotations

import fcntl
import json
import os
import tempfile
from pathlib import Path
from typing import Callable


def read_catalog(path: Path) -> list[dict]:
    """Plain read; safe against torn writes because writes are atomic."""
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def update_catalog(mutate: Callable[[list[dict]], object], path: Path) -> None:
    """Apply `mutate(catalog)` under an exclusive lock and publish atomically.

    `mutate` edits the list in place (its return value is ignored). The lock
    covers read → mutate → replace, so concurrent writers queue instead of
    clobbering; os.replace keeps every reader's view complete.
    """
    lock_path = path.with_suffix(".json.lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with open(lock_path, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            catalog = read_catalog(path)
            mutate(catalog)
            fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    json.dump(catalog, f, ensure_ascii=False, indent=2)
                    f.write("\n")
                os.replace(tmp, path)
            except BaseException:
                if os.path.exists(tmp):
                    os.unlink(tmp)
                raise
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)
