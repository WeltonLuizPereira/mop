from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Iterable, Protocol


class ImportResult(Enum):
    SKIPPED = "skipped"
    IMPORTED = "imported"


class AbsApi(Protocol):
    def begin_import(self, file_info: dict[str, Any], force: bool = False) -> dict[str, Any]: ...
    def import_batch(self, run_id: str, rows: list[dict[str, Any]]) -> None: ...
    def finish_import(self, run_id: str, success: bool, error: str | None) -> None: ...


def file_signature(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(chunk_size), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def _chunks(rows: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    for start in range(0, len(rows), size):
        yield rows[start:start + size]


def import_rows(api: AbsApi, rows: list[dict[str, Any]], file_info: dict[str, Any],
                force: bool = False, batch_size: int = 500) -> ImportResult:
    run = api.begin_import(file_info, force=force)
    if run.get("status") == "already_completed":
        return ImportResult.SKIPPED
    run_id = str(run["run_id"])
    try:
        for batch in _chunks(rows, batch_size):
            api.import_batch(run_id, batch)
    except Exception as error:
        api.finish_import(run_id, success=False, error=str(error))
        raise
    api.finish_import(run_id, success=True, error=None)
    return ImportResult.IMPORTED
