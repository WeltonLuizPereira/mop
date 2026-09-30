export type AbsStatus = 'P'|'FJ'|'FI'|'FE'|'INSS'|'LM'|'FG'|'LAM'|'LP'|'MATRIMONIO'|'DES'|'-';

export const normalizeRegistration = (value: unknown) => String(value ?? '').trim().replace(/\.0$/, '');

export function classifyRawPunches(values: unknown[]): { status: AbsStatus; rawStatus: string | null; unknown: boolean } {
  const timePattern = /^\d{1,2}:\d{2}(?::\d{2})?$/;
  const text = values.map(value => String(value ?? '').trim()).find(value => value && !timePattern.test(value));
  if (!text) return { status: values.some(value => timePattern.test(String(value ?? '').trim())) ? 'P' : '-', rawStatus: null, unknown: false };
  const key = text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const map: Record<string, AbsStatus> = { ATES:'FJ', DECLARA:'FJ', FALTA:'FI', FERIAS:'FE', INSS:'INSS', 'L.MATE':'LM', 'L. MATE':'LM', 'L MATE':'LM', FOLGA:'FG', AMAMENT:'LAM', 'LICENCA PA':'LP', MT:'MATRIMONIO' };
  return { status: map[key] ?? '-', rawStatus: text, unknown: !map[key] };
}

export function calculateAbs(presences: number, justified: number, unjustified: number) {
  const absences = justified + unjustified;
  return presences + absences ? absences / (presences + absences) : 0;
}
