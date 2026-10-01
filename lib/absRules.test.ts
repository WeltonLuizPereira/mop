import { describe, expect, it } from 'vitest';
import { calculateAbs, calculateAbsMetrics, chooseDefaultAbsMonth, classifyRawPunches, normalizeRegistration } from './absRules';

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

describe('regra de faltas FI + FJ', () => {
  it('classifica a ausencia de marcacao como falta injustificada', () => {
    expect(classifyRawPunches([])).toEqual({
      status: 'FI',
      rawStatus: null,
      unknown: false,
    });
  });

  it('nao contabiliza ferias, licencas e demais marcacoes como faltas', () => {
    expect(calculateAbsMetrics(['P', 'FI', 'FJ', 'FE', 'LM', 'LP', 'INSS', 'LAM', 'MATRIMONIO', 'FG', 'DES', '-']))
      .toEqual({ justified: 1, unjustified: 1, absences: 2, presences: 1, rate: 2 / 3 });
  });
});

describe('competencia inicial do ABS em D-1', () => {
  it('mantem o mes anterior no primeiro dia, mesmo que a base ja tenha o dia atual', () => {
    expect(chooseDefaultAbsMonth('2026-10-01', '2026-10-01')).toBe('2026-09');
  });

  it('muda para o mes vigente quando existe dado valido de D-1', () => {
    expect(chooseDefaultAbsMonth('2026-10-02', '2026-10-01')).toBe('2026-10');
  });

  it('mantem o mes anterior enquanto o vigente ainda nao tem dado valido', () => {
    expect(chooseDefaultAbsMonth('2026-10-02', null)).toBe('2026-09');
    expect(chooseDefaultAbsMonth('2026-10-03', '2026-10-01')).toBe('2026-10');
  });
});
