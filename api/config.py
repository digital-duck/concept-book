from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings

_REPO_ROOT = Path(__file__).parent.parent


class Settings(BaseSettings):
    spl_dir: Path = Path.home() / "projects/digital-duck/SPL.py"
    public_domains: Path = _REPO_ROOT / "public" / "domains"
    llm: str = "claude_cli:claude-sonnet-4-6"
    default_model: str = "gemma4"
    compare_cache_ttl: int = 86400  # seconds; 0 = never expire
    spl_while_max_iter: int = 50
    spl_max_llm_calls: int = 50

    model_config = {"env_prefix": "CB_", "env_file": ".env", "extra": "ignore"}

    @field_validator("spl_dir", mode="before")
    @classmethod
    def _expand_spl_dir(cls, v):
        return Path(v).expanduser() if v else v

    @field_validator("public_domains", mode="before")
    @classmethod
    def _resolve_public_domains(cls, v):
        if not v:
            return v
        p = Path(v).expanduser()
        return p if p.is_absolute() else (_REPO_ROOT / p).resolve()


settings = Settings()
