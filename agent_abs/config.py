from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


class ConfigError(ValueError):
    pass


@dataclass(frozen=True)
class Config:
    file_path: Path
    supabase_url: str
    service_key: str
    batch_size: int = 500
    request_poll_seconds: int = 30
    fallback_scan_seconds: int = 300


def load_config(env: Mapping[str, str], require_api: bool = True) -> Config:
    required = ["ABS_FILE_PATH"]
    if require_api:
        required.extend(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"])
    missing = [key for key in required if not env.get(key)]
    if missing:
        raise ConfigError(f"Configuração ausente: {', '.join(missing)}")
    return Config(
        file_path=Path(env["ABS_FILE_PATH"]),
        supabase_url=env.get("SUPABASE_URL", "").rstrip("/"),
        service_key=env.get("SUPABASE_SERVICE_ROLE_KEY", ""),
        batch_size=int(env.get("ABS_BATCH_SIZE", 500)),
        request_poll_seconds=int(env.get("ABS_POLL_SECONDS", 30)),
        fallback_scan_seconds=int(env.get("ABS_SCAN_SECONDS", 300))
    )
