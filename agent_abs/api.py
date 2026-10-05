import json
from typing import Any
from urllib.request import Request, urlopen


class SupabaseAbsApi:
    def __init__(self, url: str, service_key: str):
        self.base = f"{url.rstrip('/')}/rest/v1"
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        }

    def _rpc(self, name: str, payload: dict[str, Any]) -> Any:
        request = Request(f"{self.base}/rpc/{name}", data=json.dumps(payload).encode("utf-8"),
                          headers=self.headers, method="POST")
        with urlopen(request, timeout=60) as response:
            body = response.read()
        return json.loads(body) if body else None

    def begin_import(self, file_info: dict[str, Any], force: bool = False) -> dict[str, Any]:
        return self._rpc("mop_abs_begin_import", {"p_file_info": file_info, "p_force": force})

    def import_batch(self, run_id: str, rows: list[dict[str, Any]]) -> None:
        self._rpc("mop_abs_import_batch", {"p_run_id": run_id, "p_rows": rows})

    def finish_import(self, run_id: str, success: bool, error: str | None) -> None:
        self._rpc("mop_abs_finish_import", {"p_run_id": run_id, "p_success": success, "p_error": error})

    def claim_refresh(self) -> dict[str, Any] | None:
        return self._rpc("mop_abs_claim_refresh", {})

    def finish_refresh(self, request_id: str, result: str | None, error: str | None) -> None:
        self._rpc("mop_abs_finish_refresh", {"p_request_id": request_id, "p_result": result, "p_error": error})
