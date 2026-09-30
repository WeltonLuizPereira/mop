import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import { readAbsWorkbook } from './reader.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function workbookWith(row: Record<string, unknown>) {
  const directory = mkdtempSync(path.join(tmpdir(), 'mop-abs-'));
  tempDirs.push(directory);
  const file = path.join(directory, 'BASE_ABS.xlsx');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([row]), 'Sheet1');
  XLSX.writeFile(book, file);
  return file;
}

describe('readAbsWorkbook', () => {
  it('lê o layout real da BASE_ABS e normaliza a linha importada', () => {
    const file = workbookWith({
      DATA: new Date('2026-09-01T12:00:00Z'),
      NOME: ' ANA SILVA ',
      'ENTRADA 1': '09:13:00',
      'SAÍDA 1': '17:14:00',
      'ENTRADA 2': '',
      'SAÍDA 2': '',
      'ENTRADA 3': '',
      'SAÍDA 3': '',
      'ENTRADA 4': '',
      'SAÍDA 4': '',
      'ENTRADA 5': '',
      'SAÍDA 5': '',
      departamento: ' Operação 04 ',
      re: '00123.0',
    });

    expect(readAbsWorkbook(file)).toEqual([{
      workDate: '2026-09-01',
      matricula: '00123',
      sourceName: 'ANA SILVA',
      sourceDepartment: 'Operação 04',
      punches: ['09:13:00', '17:14:00'],
      rawStatus: null,
      validatedStatus: 'P',
      unknown: false,
    }]);
  });

  it('rejeita planilha sem os cabeçalhos contratuais', () => {
    const file = workbookWith({ DATA: '01/09/2026', NOME: 'ANA' });
    expect(() => readAbsWorkbook(file)).toThrow(/Cabeçalhos ausentes/);
  });
});
