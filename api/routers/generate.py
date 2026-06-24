from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from api.services.executor import stream_generate

router = APIRouter()


@router.get("/api/generate")
async def generate(domain: str, target: str, level: str = "intro", language: str = "en"):
    return EventSourceResponse(stream_generate(domain, target, level, language))
