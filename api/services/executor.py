"""Stream spl3 run as a subprocess, yielding SSE-ready dicts.

Run the backend inside the spl123 conda env so that `spl3` is on PATH:
    conda activate spl123
    pip install -r requirements-api.txt
    uvicorn api.app:app --port 8000 --reload
"""
import asyncio
import json
from pathlib import Path

from api.config import settings

_COOKBOOK = "cookbook/74_concept_book"


async def stream_generate(domain_id: str, target: str, language: str = "en"):
    spl_dir: Path = settings.spl_dir
    output_path = settings.public_domains / domain_id / "concept_book.html"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "spl3", "run", f"{_COOKBOOK}/build_concept_book.spl",
        "--tools", f"{_COOKBOOK}/tools.py",
        "--llm", settings.llm,
        "--param", f"domain_yaml={domain_id}_graph.yaml",
        "--param", f"target={target}",
        "--param", f"language={language}",
        "--param", f"output_html={output_path}",
    ]

    yield {"event": "started", "data": json.dumps({"domain": domain_id, "target": target})}

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(spl_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )

    assert proc.stdout is not None
    async for raw in proc.stdout:
        line = raw.decode(errors="replace").rstrip()
        if line:
            yield {"event": "log", "data": json.dumps({"message": line})}

    await proc.wait()

    if proc.returncode == 0:
        from api.services.catalog_svc import mark_book_generated
        mark_book_generated(domain_id)
        yield {"event": "done", "data": json.dumps({"domain": domain_id})}
    else:
        yield {
            "event": "gen_error",
            "data": json.dumps({"message": f"spl3 exited {proc.returncode}"}),
        }
