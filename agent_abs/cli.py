import argparse
from dataclasses import asdict
import logging
import os
from pathlib import Path
import time

from .api import SupabaseAbsApi
from .config import Config, load_config
from .importer import file_signature, import_rows
from .reader import read_abs_workbook
from .worker import AbsWorker, stable_file


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
LOGGER = logging.getLogger("mop.abs")


def _payload(row) -> dict:
    value = asdict(row)
    value["work_date"] = row.work_date.isoformat()
    value["punches"] = list(row.punches)
    return value


def make_import(config: Config, api: SupabaseAbsApi, dry_run: bool = False):
    def run(*, force: bool = False) -> str:
        snapshot = stable_file(config.file_path)
        signature = file_signature(config.file_path)
        rows = read_abs_workbook(config.file_path)
        LOGGER.info("Base estável %s: %d linhas, assinatura %s", snapshot, len(rows), signature[:19])
        if dry_run:
            return "dry-run"
        info = {"path": str(config.file_path), "signature": signature,
                "size": snapshot.size, "modified_ns": snapshot.modified_ns}
        return import_rows(api, [_payload(row) for row in rows], info, force=force,
                           batch_size=config.batch_size).value
    return run


def main() -> int:
    parser = argparse.ArgumentParser(description="Importador automático da BASE_ABS.xlsx")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--file")
    args = parser.parse_args()
    
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
    
    environment = dict(os.environ)
    if args.file:
        environment["ABS_FILE_PATH"] = args.file
    try:
        config = load_config(environment, require_api=not args.dry_run)
    except Exception as e:
        LOGGER.error(str(e))
        return 10

    api = SupabaseAbsApi(config.supabase_url, config.service_key) if not args.dry_run else None
    run_import = make_import(config, api, args.dry_run)

    if args.once:
        try:
            run_import(force=False)
            return 0
        except Exception as e:
            LOGGER.exception("Falha na execução única.")
            return 20

    worker = AbsWorker(config.file_path, api, run_import=run_import,
                       scan_seconds=config.fallback_scan_seconds)
    while True:
        try:
            worker.tick(time.monotonic())
        except Exception:
            LOGGER.exception("Falha no ciclo do agente ABS; a última carga válida foi preservada.")
        time.sleep(config.request_poll_seconds)


if __name__ == "__main__":
    raise SystemExit(main())
