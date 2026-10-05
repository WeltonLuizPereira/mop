from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock

from agent_abs.config import ConfigError, load_config
from agent_abs.importer import ImportResult, file_signature, import_rows


class ConfigTests(unittest.TestCase):
    def test_requires_all_secrets_without_echoing_values(self):
        with self.assertRaisesRegex(ConfigError, "SUPABASE_SERVICE_ROLE_KEY") as caught:
            load_config({"ABS_FILE_PATH": "base.xlsx", "SUPABASE_URL": "https://example.test"})
        self.assertNotIn("secret", str(caught.exception))


class ImporterTests(unittest.TestCase):
    def test_signature_changes_with_file_content(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "base.xlsx"
            path.write_bytes(b"first")
            first = file_signature(path)
            path.write_bytes(b"second")
            self.assertNotEqual(file_signature(path), first)

    def test_skips_signature_already_completed(self):
        api = Mock()
        api.begin_import.return_value = {"status": "already_completed"}

        result = import_rows(api, [{"matricula": "7"}], {"signature": "sha256:a"})

        self.assertEqual(result, ImportResult.SKIPPED)
        api.import_batch.assert_not_called()

    def test_sends_batches_of_500_and_finishes_run(self):
        api = Mock()
        api.begin_import.return_value = {"status": "processing", "run_id": "run-1"}
        rows = [{"matricula": str(index)} for index in range(501)]

        result = import_rows(api, rows, {"signature": "sha256:b"})

        self.assertEqual(result, ImportResult.IMPORTED)
        self.assertEqual([len(call.args[1]) for call in api.import_batch.call_args_list], [500, 1])
        api.finish_import.assert_called_once_with("run-1", success=True, error=None)


if __name__ == "__main__":
    unittest.main()
