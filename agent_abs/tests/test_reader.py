from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from openpyxl import Workbook

from agent_abs.reader import InvalidWorkbook, read_abs_workbook


HEADERS = [
    "DATA", "NOME", "ENTRADA 1", "SAÍDA 1", "ENTRADA 2", "SAÍDA 2",
    "ENTRADA 3", "SAÍDA 3", "ENTRADA 4", "SAÍDA 4", "ENTRADA 5",
    "SAÍDA 5", "departamento", "re",
]


def workbook_at(path: Path, headers=HEADERS) -> Path:
    book = Workbook()
    sheet = book.active
    sheet.title = "Sheet1"
    sheet.append(headers)
    sheet.append([date(2026, 10, 1), "Ana", "09:13", "17:14", None, None,
                  None, None, None, None, None, None, "Operação 01", "0007"])
    book.save(path)
    return path


class ReaderTests(unittest.TestCase):
    def test_reads_date_and_preserves_leading_zero(self):
        with TemporaryDirectory() as directory:
            rows = read_abs_workbook(workbook_at(Path(directory) / "base.xlsx"))
        self.assertEqual(rows[0].work_date.isoformat(), "2026-10-01")
        self.assertEqual(rows[0].matricula, "0007")
        self.assertEqual(rows[0].validated_status, "P")

    def test_rejects_missing_required_header(self):
        invalid_headers = [header for header in HEADERS if header != "re"]
        with TemporaryDirectory() as directory:
            with self.assertRaisesRegex(InvalidWorkbook, "re"):
                read_abs_workbook(workbook_at(Path(directory) / "invalid.xlsx", invalid_headers))

    def test_rejects_missing_sheet1(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "nosheet.xlsx"
            book = Workbook()
            book.active.title = "Outra Aba"
            book.save(path)
            with self.assertRaisesRegex(InvalidWorkbook, "Sheet1 não encontrada"):
                read_abs_workbook(path)
                
    def test_handles_multiple_date_formats(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "dates.xlsx"
            book = Workbook()
            sheet = book.active
            sheet.title = "Sheet1"
            sheet.append(HEADERS)
            # Excel float date (46661 = 1-Oct-2026)
            sheet.append([46661, "Ana", None, None, None, None, None, None, None, None, None, None, "Op", "0007"])
            # String date
            sheet.append(["02/10/2026", "Ana", None, None, None, None, None, None, None, None, None, None, "Op", "0007"])
            # ISO date string
            sheet.append(["2026-10-03", "Ana", None, None, None, None, None, None, None, None, None, None, "Op", "0007"])
            book.save(path)
            
            rows = read_abs_workbook(path)
            self.assertEqual(rows[0].work_date.isoformat(), "2026-10-01")
            self.assertEqual(rows[1].work_date.isoformat(), "2026-10-02")
            self.assertEqual(rows[2].work_date.isoformat(), "2026-10-03")

if __name__ == "__main__":
    unittest.main()
