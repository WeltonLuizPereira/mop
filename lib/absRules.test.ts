import { describe, expect, it } from 'vitest';
import { calculateAbs, classifyRawPunches, normalizeRegistration } from './absRules';

describe('normalizeRegistration', () => {
  it('preserva zeros significativos e remove o sufixo decimal criado pelo Excel', () => {
    expect(normalizeRegistration(' 00123.0 ')).toBe('00123');
  });
});

describe('classifyRawPunches', () => {
  it.each([
    ['Ates', 'FJ'],
    ['Declara', 'FJ'],
    ['Falta', 'FI'],
    ['Férias', 'FE'],
    ['L. Mate', 'LM'],
    ['Licença Pa', 'LP'],
  ] as const)('classifica %s como %s', (raw, expected) => {
    expect(classifyRawPunches([raw])).toEqual({
      status: expected,
      rawStatus: raw,
      unknown: false,
    });
  });

  it('considera batidas com segundos como presença', () => {
    expect(classifyRawPunches(['09:13:00', '17:14:00'])).toEqual({
      status: 'P',
      rawStatus: null,
      unknown: false,
    });
  });

  it('sinaliza um texto desconhecido sem inventar uma classificação', () => {
    expect(classifyRawPunches(['TREINAMENTO'])).toEqual({
      status: '-',
      rawStatus: 'TREINAMENTO',
      unknown: true,
    });
  });
});

describe('calculateAbs', () => {
  it('calcula faltas sobre presenças mais faltas', () => {
    expect(calculateAbs(90, 5, 5)).toBe(0.1);
  });

  it('retorna zero quando não há apontamentos', () => {
    expect(calculateAbs(0, 0, 0)).toBe(0);
  });
});
