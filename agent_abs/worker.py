from dataclasses import dataclass
from pathlib import Path
from time import sleep as system_sleep
from typing import Callable, Protocol


@dataclass(frozen=True)
class FileSnapshot:
    size: int
    modified_ns: int


def _snapshot(path: Path) -> FileSnapshot:
    value = path.stat()
    return FileSnapshot(value.st_size, value.st_mtime_ns)


def stable_file(path: Path, *, stat: Callable[[Path], FileSnapshot] = _snapshot,
                sleep: Callable[[float], None] = system_sleep,
                interval_seconds: int = 10, max_checks: int = 12) -> FileSnapshot:
    previous = stat(path)
    for _ in range(max_checks):
        sleep(interval_seconds)
        current = stat(path)
        if current == previous:
            return current
        previous = current
    raise TimeoutError("A BASE_ABS.xlsx não estabilizou para leitura.")


class RefreshApi(Protocol):
    def claim_refresh(self) -> dict | None: ...
    def finish_refresh(self, request_id: str, result: str | None, error: str | None) -> None: ...


class AbsWorker:
    def __init__(self, file_path: Path, api: RefreshApi, *, run_import: Callable[..., str],
                 scan_seconds: int = 300):
        self.file_path = file_path
        self.api = api
        self.run_import = run_import
        self.scan_seconds = scan_seconds
        self._last_scan: float | None = None

    def tick(self, now: float) -> None:
        request = self.api.claim_refresh()
        if request:
            request_id = str(request["id"])
            try:
                result = self.run_import(force=True)
                self.api.finish_refresh(request_id, result, None)
            except Exception as error:
                self.api.finish_refresh(request_id, None, str(error))
            self._last_scan = now
            return
        if self._last_scan is None or now - self._last_scan >= self.scan_seconds:
            self.run_import(force=False)
            self._last_scan = now
