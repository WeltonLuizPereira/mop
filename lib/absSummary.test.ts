import { describe, expect, it } from 'vitest';
import type { AbsMonthRow } from '../services/abs';
import { summarizeAbsRows } from './absSummary';

const row = (overrides: Partial<AbsMonthRow>): AbsMonthRow => ({
  matricula: '1',
  collaboratorName: 'Ana',
  supervisorName: 'Supervisora',
  ilhaName: 'Ilha',
  employmentStatus: 'ATIVO',
  justifiedAbsences: 0,
  unjustifiedAbsences: 0,
  totalAbsences: 0,
  presences: 0,
  absRate: 0,
  dailyStatuses: {},
  ...overrides,
});

describe('summarizeAbsRows', () => {
  it('consolida os indicadores visíveis usando as linhas filtradas', () => {
    expect(summarizeAbsRows([
      row({ justifiedAbsences: 2, unjustifiedAbsences: 1, totalAbsences: 3, presences: 7 }),
      row({ justifiedAbsences: 1, unjustifiedAbsences: 1, totalAbsences: 2, presences: 8 }),
    ])).toEqual({ people: 2, justified: 3, unjustified: 2, absences: 5, presences: 15, rate: 0.25 });
  });

  it('não produz NaN quando não há apontamentos', () => {
    expect(summarizeAbsRows([]).rate).toBe(0);
  });
});
