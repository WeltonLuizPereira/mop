from pathlib import Path
import unittest
from unittest.mock import Mock

from agent_abs.worker import AbsWorker, FileSnapshot, stable_file


class StabilityTests(unittest.TestCase):
    def test_waits_until_two_snapshots_match(self):
        stat = Mock(side_effect=[FileSnapshot(100, 1), FileSnapshot(120, 2), FileSnapshot(120, 2)])
        sleep = Mock()

        result = stable_file(Path("base.xlsx"), stat=stat, sleep=sleep, interval_seconds=10)

        self.assertEqual(result, FileSnapshot(120, 2))
        self.assertEqual(sleep.call_count, 2)


class WorkerTests(unittest.TestCase):
    def test_admin_request_forces_import(self):
        api = Mock()
        api.claim_refresh.return_value = {"id": "request-1"}
        run_import = Mock(return_value="imported")
        worker = AbsWorker(Path("base.xlsx"), api, run_import=run_import)

        worker.tick(now=0)

        run_import.assert_called_once_with(force=True)
        api.finish_refresh.assert_called_once_with("request-1", "imported", None)

    def test_periodic_scan_recovers_missing_file_event(self):
        api = Mock()
        api.claim_refresh.return_value = None
        run_import = Mock(return_value="imported")
        worker = AbsWorker(Path("base.xlsx"), api, run_import=run_import, scan_seconds=300)

        worker.tick(now=0)
        worker.tick(now=299)
        worker.tick(now=300)

        self.assertEqual(run_import.call_count, 2)


if __name__ == "__main__":
    unittest.main()
