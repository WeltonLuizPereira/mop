export type AbsStatus = 'P'|'FJ'|'FI'|'FE'|'INSS'|'LM'|'FG'|'LAM'|'LP'|'MATRIMONIO'|'DES'|'-';

export const normalizeRegistration = (value: unknown) => String(value ?? '').trim().replace(/\.0$/, '');

export function classifyRawPunches(values: unknown[]): { status: AbsStatus; rawStatus: string | null; unknown: boolean } {
  const timePattern = /^\d{1,2}:\d{2}(?::\d{2})?$/;
  const text = values.map(value => String(value ?? '').trim()).find(value => value && !timePattern.test(value));
  if (!text) return { status: values.some(value => timePattern.test(String(value ?? '').trim())) ? 'P' : 'FI', rawStatus: null, unknown: false };
  const key = text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const map: Record<string, AbsStatus> = { ATES:'FJ', DECLARA:'FJ', FALTA:'FI', FERIAS:'FE', INSS:'INSS', 'L.MATE':'LM', 'L. MATE':'LM', 'L MATE':'LM', FOLGA:'FG', AMAMENT:'LAM', 'LICENCA PA':'LP', MT:'MATRIMONIO' };
  return { status: map[key] ?? '-', rawStatus: text, unknown: !map[key] };
}

export function calculateAbs(presences: number, justified: number, unjustified: number) {
  const absences = justified + unjustified;
  return presences + absences ? absences / (presences + absences) : 0;
}

export function calculateAbsMetrics(statuses: AbsStatus[]) {
  const justified = statuses.filter(status => status === 'FJ').length;
  const unjustified = statuses.filter(status => status === 'FI').length;
  const presences = statuses.filter(status => status === 'P').length;
  const absences = justified + unjustified;
  return { justified, unjustified, absences, presences, rate: calculateAbs(presences, justified, unjustified) };
}

function previousMonth(month: string) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

export function chooseDefaultAbsMonth(today: string, maxWorkDate: string | null) {
  const currentMonth = today.slice(0, 7);
  const reference = new Date(`${today}T12:00:00Z`);
  reference.setUTCDate(reference.getUTCDate() - 1);
  const dMinusOne = reference.toISOString().slice(0, 10);
  const dMinusOneMonth = dMinusOne.slice(0, 7);

  if (dMinusOneMonth !== currentMonth) return dMinusOneMonth;
  if (maxWorkDate?.slice(0, 7) === currentMonth && maxWorkDate <= dMinusOne) return currentMonth;
  return previousMonth(currentMonth);
}

export function todayInSaoPaulo(now = new Date()) {
  return now.toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  });
}
