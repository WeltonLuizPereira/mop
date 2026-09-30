import type { AbsMonthRow } from '../services/abs';

export interface AbsSummary {
  people: number;
  justified: number;
  unjustified: number;
  absences: number;
  presences: number;
  rate: number;
}

export function summarizeAbsRows(rows: AbsMonthRow[]): AbsSummary {
  const summary = rows.reduce((total, row) => ({
    people: total.people + 1,
    justified: total.justified + row.justifiedAbsences,
    unjustified: total.unjustified + row.unjustifiedAbsences,
    absences: total.absences + row.totalAbsences,
    presences: total.presences + row.presences,
    rate: 0,
  }), { people: 0, justified: 0, unjustified: 0, absences: 0, presences: 0, rate: 0 });

  const denominator = summary.presences + summary.absences;
  summary.rate = denominator > 0 ? summary.absences / denominator : 0;
  return summary;
}
