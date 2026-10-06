import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, BookOpen, CheckCircle2, Loader2, RefreshCw, BarChart2, Table as TableIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { EntityStatus, type User } from '../types';
import { getAbsImportStatus, getAbsMonth, type AbsFilters, type AbsImportStatus, type AbsMonthRow } from '../services/abs';
import { useResource } from '../contexts/DataContext';
import { Card, Chip, Modal, Table } from '../components/ui';
import { linhaAtivavel } from '../components/ui/linhaAtivavel';
import { summarizeAbsRows } from '../lib/absSummary';
import { chooseDefaultAbsMonth, todayInSaoPaulo } from '../lib/absRules';

const COLORS: Record<string, string> = {
  P: 'bg-emerald-100 text-emerald-800',
  FI: 'bg-red-200 text-red-900',
  FJ: 'bg-rose-100 text-rose-800',
  FE: 'bg-sky-100 text-sky-800',
  FG: 'bg-slate-100 text-slate-600',
  DES: 'bg-zinc-200 text-zinc-700',
  LM: 'bg-violet-100 text-violet-800',
  INSS: 'bg-indigo-100 text-indigo-800',
  LAM: 'bg-fuchsia-100 text-fuchsia-800',
  LP: 'bg-purple-100 text-purple-800',
  MATRIMONIO: 'bg-pink-100 text-pink-800',
  '-': 'text-ink-faint',
};

const STICKY_REGISTRATION = 'sticky left-0 z-20 w-24 min-w-24 max-w-24';
const STICKY_NAME = 'sticky left-24 z-20 w-60 min-w-60 max-w-60 abs-sticky-edge';

type SortKey = 'matricula' | 'collaboratorName' | 'supervisorName' | 'ilhaName' | 'employmentStatus' | 'justifiedAbsences' | 'unjustifiedAbsences' | 'totalAbsences' | 'presences' | 'absRate';
type SortDirection = 'asc' | 'desc';

const SORT_COLUMNS: Array<{ key: SortKey; label: string; sticky?: string }> = [
  { key: 'matricula', label: 'Matrícula', sticky: STICKY_REGISTRATION },
  { key: 'collaboratorName', label: 'Colaborador', sticky: STICKY_NAME },
  { key: 'supervisorName', label: 'Supervisor' },
  { key: 'ilhaName', label: 'Ilha' },
  { key: 'employmentStatus', label: 'Status' },
  { key: 'justifiedAbsences', label: 'FJ' },
  { key: 'unjustifiedAbsences', label: 'FI' },
  { key: 'totalAbsences', label: 'Faltas' },
  { key: 'presences', label: 'P' },
  { key: 'absRate', label: 'ABS' },
];

function SortableHeader({ column, activeKey, direction, onSort }: { column: typeof SORT_COLUMNS[number]; activeKey: SortKey | null; direction: SortDirection | null; onSort: (key: SortKey) => void }) {
  const active = activeKey === column.key;
  const ariaLabel = active ? `Ordenar por ${column.label}, ${direction === 'asc' ? 'crescente' : 'decrescente'}` : `Ordenar por ${column.label}`;
  const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`${column.sticky ?? 'sticky'} top-0 ${column.sticky ? 'z-40 border-r' : 'z-30 min-w-20'} whitespace-nowrap border-b border-hairline bg-canvas-sunk p-0 text-left`}>
    <button type="button" aria-label={ariaLabel} onClick={() => onSort(column.key)} className={`flex w-full items-center gap-1.5 px-2 py-3 text-left font-semibold transition-colors hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand ${active ? 'text-brand-text' : 'text-ink-2'}`}>
      <span>{column.label}</span><Icon size={13} className={active ? 'text-brand' : 'text-ink-faint'} aria-hidden="true" />
    </button>
  </th>;
}

const currentMonth = () => todayInSaoPaulo().slice(0, 7);

const monthDays = (month: string) => {
  const [year, value] = month.split('-').map(Number);
  return Array.from({ length: new Date(year, value, 0).getDate() }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })
      .format(new Date(`${date}T12:00:00Z`)).replace('.', '');
    return { day, date, weekday };
  });
};

const LEGEND = [
  ['P', 'Presença'], ['FJ', 'Falta justificada'], ['FI', 'Falta injustificada'],
  ['FE', 'Férias'], ['INSS', 'Afastamento INSS'], ['LM', 'Licença-maternidade'],
  ['LAM', 'Licença-amamentação'], ['LP', 'Licença-paternidade'],
  ['MATRIMONIO', 'Licença-matrimônio'], ['FG', 'Folga'], ['DES', 'Desligado'], ['-', 'Sem apontamento'],
] as const;

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
  : '-';

function Metric({ label, value, tone = 'text-ink', subtext, subtextTone = 'text-ink-mute', testId }: { label: string; value: React.ReactNode; tone?: string; subtext?: React.ReactNode; subtextTone?: string; testId?: string }) {
  return <Card className="relative overflow-hidden p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-ink-mute">{label}</div>
    <div data-testid={testId} className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
    {subtext && <div className={`mt-2 text-xs font-medium ${subtextTone}`}>{subtext}</div>}
  </Card>;
}

export function AbsPage({ currentUser: _currentUser, initialMonth }: { currentUser: User; initialMonth?: string }) {
  const clients = useResource('clients').data ?? [];
  const operations = useResource('operations').data ?? [];
  const coordinators = useResource('coordinators').data ?? [];
  const ilhas = useResource('ilhas').data ?? [];
  const supervisors = useResource('supervisors').data ?? [];
  const collaborators = useResource('collaborators').data ?? [];
  const today = todayInSaoPaulo();
  const provisionalMonth = initialMonth ?? chooseDefaultAbsMonth(today, null);
  const [filters, setFilters] = useState<AbsFilters>({ month: provisionalMonth, clientId: '', operationId: '', coordinatorId: '', supervisorId: '', ilhaId: '' });
  const [defaultMonth, setDefaultMonth] = useState(initialMonth ?? '');
  const [monthReady, setMonthReady] = useState(Boolean(initialMonth));
  const [rows, setRows] = useState<AbsMonthRow[]>([]);
  const [status, setStatus] = useState<AbsImportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<AbsMonthRow | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [activeTab, setActiveTab] = useState<'apontamento' | 'dashboard'>('apontamento');
  const topScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMonth) return;
    let cancelled = false;
    void getAbsImportStatus(currentMonth()).then(currentStatus => {
      if (cancelled) return;
      const selectedMonth = chooseDefaultAbsMonth(today, currentStatus?.maxWorkDate ?? null);
      setDefaultMonth(selectedMonth);
      setFilters(old => ({ ...old, month: selectedMonth }));
    }).catch(() => {
      if (!cancelled) setDefaultMonth(provisionalMonth);
    }).finally(() => {
      if (!cancelled) setMonthReady(true);
    });
    return () => { cancelled = true; };
  }, [initialMonth, provisionalMonth, today]);

  const [prevRows, setPrevRows] = useState<AbsMonthRow[]>([]);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  
  const getPrevMonthStr = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const prevMonthStr = getPrevMonthStr(filters.month);
      const [monthRows, importStatus, pRows] = await Promise.all([
        getAbsMonth(filters), 
        getAbsImportStatus(filters.month),
        getAbsMonth({ ...filters, month: prevMonthStr })
      ]);
      setRows(monthRows);
      setStatus(importStatus);
      setPrevRows(pRows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o ABS.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate) return;
    try {
      const { supabase } = await import('../services/supabase');
      const { error: err } = await supabase.rpc('mop_add_holiday', { p_date: holidayDate });
      if (err) throw err;
      setAddingHoliday(false);
      setHolidayDate('');
      void load();
    } catch (err) {
      alert('Erro ao adicionar feriado: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  useEffect(() => { if (monthReady) void load(); }, [monthReady, filters.month, filters.clientId, filters.operationId, filters.coordinatorId, filters.supervisorId, filters.ilhaId]);

  const days = useMemo(() => monthDays(filters.month), [filters.month]);
  const summary = useMemo(() => summarizeAbsRows(rows), [rows]);
  const prevSummary = useMemo(() => summarizeAbsRows(prevRows), [prevRows]);
  const momRate = prevSummary.rate > 0 ? (summary.rate - prevSummary.rate) * 100 : 0;
  const momTone = momRate > 0 ? 'text-danger' : momRate < 0 ? 'text-success' : 'text-ink-mute';
  const momIcon = momRate > 0 ? '▲' : momRate < 0 ? '▼' : '';
  const momText = `${momIcon} ${Math.abs(momRate).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p. vs. mês anterior`;
  const visibleRows = useMemo(() => {
    const term = normalizeSearch(search);
    if (!term) return rows;
    return rows.filter(row => normalizeSearch(`${row.collaboratorName} ${row.matricula}`).includes(term));
  }, [rows, search]);
  const sortedRows = useMemo(() => {
    if (!sort) return visibleRows;
    return [...visibleRows].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), 'pt-BR', { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [visibleRows, sort]);
  const tableWidth = 1_100 + days.length * 48;
  const update = (key: keyof AbsFilters, value: string) => setFilters(old => ({ ...old, [key]: value }));
  type DimensionKey = Exclude<keyof AbsFilters, 'month'>;
  const dimensionKeys: DimensionKey[] = ['clientId', 'operationId', 'coordinatorId', 'supervisorId', 'ilhaId'];
  const availableIds = (dimension: DimensionKey) => new Set(collaborators
    .filter(collaborator => dimensionKeys.every(key => key === dimension || !filters[key] || collaborator[key] === filters[key]))
    .map(collaborator => collaborator[dimension]));
  const byName = <T extends { nome: string }>(left: T, right: T) => left.nome.localeCompare(right.nome, 'pt-BR');
  const activeOptions = <T extends { id: string; nome: string; status: EntityStatus }>(items: T[], dimension: DimensionKey) => {
    const ids = availableIds(dimension);
    return items.filter(item => item.status === EntityStatus.ACTIVE && ids.has(item.id)).sort(byName);
  };
  const filterClients = activeOptions(clients, 'clientId');
  const filterOps = activeOptions(operations, 'operationId');
  const filterCoordinators = activeOptions(coordinators, 'coordinatorId');
  const filterSupervisors = activeOptions(supervisors, 'supervisorId');
  const filterIlhas = activeOptions(ilhas, 'ilhaId');
  const activeFilters = [defaultMonth && filters.month !== defaultMonth, filters.clientId, filters.operationId, filters.coordinatorId, filters.supervisorId, filters.ilhaId].filter(Boolean).length;
  const clearFilters = () => setFilters({ month: defaultMonth || provisionalMonth, clientId: '', operationId: '', coordinatorId: '', supervisorId: '', ilhaId: '' });
  const cycleSort = (key: SortKey) => setSort(current => {
    if (!current || current.key !== key) return { key, direction: 'asc' };
    if (current.direction === 'asc') return { key, direction: 'desc' };
    return null;
  });

  const syncFromTop = (event: React.UIEvent<HTMLDivElement>) => {
    if (gridScrollRef.current) gridScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };
  const syncFromGrid = (event: React.UIEvent<HTMLDivElement>) => {
    if (topScrollRef.current) topScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return <div className="space-y-4">
    <Table.Card>
      <Table.Toolbar
        busca={{ valor: search, aoMudar: setSearch, placeholder: 'Buscar nome ou matrícula', rotulo: 'Buscar nome ou matrícula' }}
        contagem={{ n: visibleRows.length, um: 'colaborador', varios: 'colaboradores' }}
        filtrosAtivos={activeFilters}
        aoLimparFiltros={clearFilters}
        chips={<Chip onClick={() => setLegendOpen(true)}><span className="inline-flex items-center gap-1.5"><BookOpen size={12} />Legenda</span></Chip>}
        acoes={<>
          <div className="text-xs text-ink-mute">{status?.status?.startsWith('COMPLETED') && status.maxWorkDate
            ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 size={14} />Atualizado até {formatDate(status.maxWorkDate)}</span>
            : 'Aguardando importação'}{!!status?.unmatchedCount && <div className="mt-1 text-warning">{status.unmatchedCount} REs não encontrados</div>}</div>
          {_currentUser?.role === 'ADMIN' && (
            <button onClick={() => setAddingHoliday(true)} className="inline-flex items-center gap-1.5 rounded-sm border border-hairline-2 bg-canvas px-2.5 py-[5px] text-xs font-medium text-ink-2 transition-colors hover:border-ink-faint hover:text-brand">
              + Feriado/Folga
            </button>
          )}
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-sm border border-hairline-2 bg-canvas px-2.5 py-[5px] text-xs font-medium text-ink-2 transition-colors hover:border-ink-faint disabled:opacity-60">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Atualizar
          </button>
        </>}
        filtros={<>
          <label className="text-xs text-ink-mute">Mês<input aria-label="Mês" type="month" value={filters.month} onChange={event => update('month', event.target.value)} className="mt-1 block w-full rounded-sm border border-hairline bg-canvas px-2 py-2 text-sm" /></label>
          {([
            ['Cliente', 'clientId', filterClients],
            ['Operação', 'operationId', filterOps],
            ['Coordenador', 'coordinatorId', filterCoordinators],
            ['Supervisor', 'supervisorId', filterSupervisors],
            ['Ilha', 'ilhaId', filterIlhas],
          ] as const).map(([label, key, options]) =>
            <label key={key} className="text-xs text-ink-mute">{label}<select aria-label={label} value={filters[key]} onChange={event => update(key, event.target.value)} className="mt-1 block w-full rounded-sm border border-hairline bg-canvas px-2 py-2 text-sm"><option value="">Todos</option>{options.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>)}
        </>}
      />
    </Table.Card>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Metric label="Faltas justificadas" value={summary.justified.toLocaleString('pt-BR')} tone="text-warning" />
      <Metric label="Faltas injustificadas" value={summary.unjustified.toLocaleString('pt-BR')} tone="text-danger" />
      <Metric label="Total de faltas" value={summary.absences.toLocaleString('pt-BR')} />
      <Metric label="Presenças" value={summary.presences.toLocaleString('pt-BR')} testId="abs-metric-presences" />
      <Metric 
        label="Absenteísmo" 
        value={summary.rate.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 })} 
        tone="text-brand" 
        testId="abs-metric-rate" 
        subtext={prevSummary.rate > 0 ? momText : undefined}
        subtextTone={momTone}
      />
    </div>

    <div className="flex gap-4 border-b border-hairline px-2">
      <button onClick={() => setActiveTab('apontamento')} className={`flex items-center gap-2 py-3 px-2 border-b-2 transition-colors ${activeTab === 'apontamento' ? 'border-brand font-semibold text-brand-text' : 'border-transparent text-ink-mute hover:text-ink-2'}`}>
        <TableIcon size={16} />
        Apontamento
      </button>
      <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 py-3 px-2 border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-brand font-semibold text-brand-text' : 'border-transparent text-ink-mute hover:text-ink-2'}`}>
        <BarChart2 size={16} />
        Dashboard
      </button>
    </div>

    {activeTab === 'dashboard' && !loading && !error && (
      <AbsDashboard days={days} rows={visibleRows} filters={filters} />
    )}

    {addingHoliday && (
      <Modal open={true} title="Adicionar Feriado / Folga Geral" onClose={() => setAddingHoliday(false)}>
        <div className="p-4 space-y-4">
          <p className="text-sm text-ink-mute">Selecione uma data para registrar como feriado (Folga Geral - FG) para todos os colaboradores.</p>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Data do Feriado</label>
            <input 
              type="date" 
              value={holidayDate} 
              onChange={e => setHolidayDate(e.target.value)}
              className="w-full rounded-sm border border-hairline bg-canvas p-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" 
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setAddingHoliday(false)} className="rounded-sm border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink hover:bg-canvas-soft">Cancelar</button>
            <button onClick={handleAddHoliday} disabled={!holidayDate} className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-focus disabled:opacity-50">Confirmar</button>
          </div>
        </div>
      </Modal>
    )}

    <div className={activeTab === 'apontamento' ? 'block space-y-4' : 'hidden'}>
      {loading && <div className="grid place-items-center gap-2 py-16 text-sm text-ink-mute"><Loader2 className="animate-spin" />Carregando ABS…</div>}
      {error && <div role="alert" className="flex gap-2 rounded-sm bg-danger/10 p-4 text-danger"><AlertTriangle size={18} />{error}</div>}
      {!loading && !error && rows.length === 0 && <Card className="p-10 text-center text-sm text-ink-mute">Nenhum apontamento encontrado para os filtros selecionados.</Card>}
      {!loading && !error && rows.length > 0 && visibleRows.length === 0 && <Card className="p-10 text-center text-sm text-ink-mute">Nenhum colaborador corresponde à busca.</Card>}

      {!loading && !error && visibleRows.length > 0 && <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-hairline bg-canvas-sunk px-3 py-2 text-[11px] text-ink-mute">
        <span>Arraste a barra para consultar os dias sem perder os nomes</span>
        <span className="font-medium">{days.length} dias</span>
      </div>
      <div ref={topScrollRef} data-testid="abs-scroll-top" onScroll={syncFromTop} className="overflow-x-auto overflow-y-hidden border-b border-hairline bg-canvas" aria-label="Rolagem horizontal superior da tabela">
        <div style={{ width: tableWidth, height: 10 }} />
      </div>
      <div ref={gridScrollRef} data-testid="abs-grid-scroll" onScroll={syncFromGrid} className="isolate max-h-[58vh] overflow-auto overscroll-contain">
        <table data-testid="abs-attendance-table" className="border-separate border-spacing-0 text-xs" style={{ minWidth: tableWidth, overflow: 'visible' }}>
          <thead>
            <tr>
              {SORT_COLUMNS.map(column => <SortableHeader key={column.key} column={column} activeKey={sort?.key ?? null} direction={sort?.direction ?? null} onSort={cycleSort} />)}
              {days.map(day => <th key={day.date} aria-label={`${String(day.day).padStart(2, '0')} ${day.weekday}`} className="sticky top-0 z-30 min-w-12 border-b border-hairline bg-canvas-sunk p-2 text-center"><span className="block font-bold">{String(day.day).padStart(2, '0')}</span><span className="font-normal text-ink-faint">{day.weekday}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => {
              const interactiveRow = linhaAtivavel(() => setSelectedRow(row));
              return <tr key={row.matricula} {...interactiveRow} className={`${interactiveRow.className} group`} aria-label={`Ver ABS de ${row.collaboratorName}`}>
              <td className={`${STICKY_REGISTRATION} border-b border-r border-hairline/70 p-2 font-medium tabular-nums ${rowIndex % 2 ? 'bg-canvas-soft' : 'bg-canvas'} group-hover:bg-brand/5`}>{row.matricula}</td>
              <td className={`${STICKY_NAME} border-b border-r border-hairline/70 p-2 font-medium ${rowIndex % 2 ? 'bg-canvas-soft' : 'bg-canvas'} group-hover:bg-brand/5`}><span className="block w-full truncate font-semibold text-brand-text" title={row.collaboratorName}>{row.collaboratorName}</span></td>
              {[row.supervisorName, row.ilhaName, row.employmentStatus, row.justifiedAbsences, row.unjustifiedAbsences, row.totalAbsences, row.presences, row.absRate.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 })].map((value, index) => <td key={index} className={`whitespace-nowrap border-b border-hairline/70 p-2 ${rowIndex % 2 ? 'bg-canvas-soft/60' : 'bg-canvas'} group-hover:bg-brand/5`}>{value}</td>)}
              {days.map(day => {
                const value = row.dailyStatuses[day.date] ?? '-';
                return <td key={day.date} className={`border-b border-hairline/70 p-1 text-center ${rowIndex % 2 ? 'bg-canvas-soft/60' : 'bg-canvas'} group-hover:bg-brand/5`}><span className={`inline-grid h-7 min-w-8 place-items-center rounded-sm font-semibold ${COLORS[value] ?? 'bg-warning/20'}`}>{value}</span></td>;
              })}
            </tr>})}
          </tbody>
        </table>
      </div>
    </Card>}
    </div>

    <Modal open={legendOpen} onClose={() => setLegendOpen(false)} title="Legenda do ABS" tamanho="sm">
      <div className="grid gap-2">{LEGEND.map(([code, label]) => <div key={code} className="flex items-center gap-3 rounded-sm border border-hairline px-3 py-2"><span className={`inline-grid h-7 min-w-12 place-items-center rounded-sm px-2 text-xs font-bold ${COLORS[code]}`}>{code}</span><span className="text-sm text-ink-2">{label}</span></div>)}</div>
    </Modal>

    <Modal open={!!selectedRow} onClose={() => setSelectedRow(null)} title={selectedRow?.collaboratorName ?? 'Detalhes do ABS'}>
      {selectedRow && <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-mute">
          <span className="font-semibold text-ink-2">Matrícula {selectedRow.matricula}</span>
          <span aria-hidden="true">·</span><span>{selectedRow.supervisorName}</span>
          <span aria-hidden="true">·</span><span>{selectedRow.ilhaName}</span>
        </div>

        <section aria-label="Resumo de absenteísmo do mês" className="rounded-lg border border-brand/20 bg-brand/5 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-brand-text">Absenteísmo do mês</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div data-testid="abs-detail-rate" className="text-[40px] font-bold leading-none tracking-tight text-brand tabular-nums">
              {selectedRow.absRate.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-ink-mute">
              {selectedRow.totalAbsences} {selectedRow.totalAbsences === 1 ? 'falta' : 'faltas'} em {selectedRow.presences + selectedRow.totalAbsences} apontamentos
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas-sunk" aria-hidden="true">
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${Math.min(100, Math.max(0, selectedRow.absRate * 100))}%` }} />
          </div>
        </section>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-hairline md:grid-cols-4">
          {[
            ['Presenças', selectedRow.presences, 'text-emerald-700'],
            ['Faltas justificadas', selectedRow.justifiedAbsences, 'text-rose-700'],
            ['Faltas injustificadas', selectedRow.unjustifiedAbsences, 'text-red-800'],
            ['Total de faltas', selectedRow.totalAbsences, 'text-ink'],
          ].map(([label, value, tone], index) => <div key={label} className={`min-w-0 p-4 ${index % 2 ? 'border-l border-hairline' : ''} ${index > 1 ? 'border-t border-hairline md:border-t-0' : ''} ${index > 0 ? 'md:border-l md:border-hairline' : ''}`}>
            <div className="text-[10px] font-semibold uppercase leading-4 tracking-[.08em] text-ink-mute">{label}</div>
            <div className={`mt-2 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
          </div>)}
        </div>
      </div>}
    </Modal>
  </div>;
}

const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function getPreviousMonths(currentMonth: string, count: number) {
  const result = [];
  let [year, month] = currentMonth.split('-').map(Number);
  for (let i = 0; i < count; i++) {
    const formattedMonth = `${year}-${String(month).padStart(2, '0')}`;
    result.unshift(formattedMonth);
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
  }
  return result;
}

function AbsDashboard({ days, rows, filters }: { days: ReturnType<typeof monthDays>; rows: AbsMonthRow[]; filters: AbsFilters }) {
  const [matrixRows, setMatrixRows] = useState<any[]>([]);
  const [matrixMonths, setMatrixMonths] = useState<string[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [chartView, setChartView] = useState<'dia' | 'mes'>('dia');
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    
    const loadMatrix = async () => {
      setLoadingMatrix(true);
      try {
        const months = getPreviousMonths(filters.month, 4);
        setMatrixMonths(months);
        
        const graphMonths = getPreviousMonths(filters.month, 6);

        const promises = graphMonths.map(m => {
          if (m === filters.month) return rows;
          return getAbsMonth({ ...filters, month: m });
        });
        
        const results = await Promise.all(promises);
        if (cancelled) return;

        // Build Matrix only for current active operators (from rows) and only last 4 months
        const map = new Map<string, any>();
        rows.forEach(r => {
          map.set(r.matricula, { matricula: r.matricula, name: r.collaboratorName, totalAbs: 0, totalPres: 0 });
        });

        const matrixResults = results.slice(results.length - 4); // last 4 months
        matrixResults.forEach((monthData, index) => {
          const m = months[index];
          monthData.forEach((row: AbsMonthRow) => {
            if (map.has(row.matricula)) {
              const data = map.get(row.matricula);
              data[m] = row.absRate;
              data.totalAbs += row.totalAbsences;
              data.totalPres += row.presences;
            }
          });
        });

        const finalRows = Array.from(map.values()).map(r => {
          const total = r.totalAbs + r.totalPres;
          r.accumulated = total > 0 ? r.totalAbs / total : 0;
          return r;
        });
        setMatrixRows(finalRows);

        // Build Monthly Chart Data (last 6 months)
        const mChartData = results.map((monthRows, index) => {
          let presences = 0;
          let justified = 0;
          let unjustified = 0;
          monthRows.forEach(r => {
            presences += r.presences;
            justified += r.justifiedAbsences;
            unjustified += r.unjustifiedAbsences;
          });
          const totalAbs = justified + unjustified;
          const totalReq = presences + totalAbs;
          const absRate = totalReq > 0 ? (totalAbs / totalReq) * 100 : 0;
          return {
            name: MONTH_NAMES[parseInt(graphMonths[index].split('-')[1], 10) - 1],
            fullMonth: graphMonths[index],
            absRate: Number(absRate.toFixed(2)),
            justified,
            unjustified
          };
        });
        setMonthlyChartData(mChartData);

      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingMatrix(false);
      }
    };

    void loadMatrix();
    return () => { cancelled = true; };
  }, [filters.month, filters.clientId, filters.operationId, filters.coordinatorId, filters.supervisorId, filters.ilhaId, rows]);

  const sortedMatrixRows = useMemo(() => {
    if (!sortConfig) return matrixRows;
    return [...matrixRows].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key !== 'name') {
        aVal = typeof aVal === 'number' ? aVal : 0;
        bVal = typeof bVal === 'number' ? bVal : 0;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc' 
        ? String(aVal).localeCompare(String(bVal), 'pt-BR')
        : String(bVal).localeCompare(String(aVal), 'pt-BR');
    });
  }, [matrixRows, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) return { key, direction: 'desc' };
      if (current.direction === 'desc') return { key, direction: 'asc' };
      return null;
    });
  };

  const SortableMatrixHeader = ({ label, sortKey, align = 'left', sticky }: { label: string, sortKey: string, align?: 'left' | 'center', sticky?: boolean }) => {
    const isActive = sortConfig?.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;
    const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th className={`sticky top-0 ${sticky ? 'left-0 z-20 border-r border-hairline/70 bg-canvas' : 'z-10'} border-b border-hairline bg-canvas-sunk p-0`}>
        <button onClick={() => handleSort(sortKey)} className={`flex w-full items-center gap-2 p-3 font-semibold hover:bg-brand/5 focus:outline-none ${align === 'center' ? 'justify-center' : 'justify-start'} ${isActive ? 'text-brand-text' : 'text-ink-2'}`}>
          <span>{label}</span>
          <Icon size={14} className={isActive ? 'text-brand' : 'text-ink-faint'} />
        </button>
      </th>
    );
  };

  const dailyData = useMemo(() => {
    return days.map(day => {
      let presences = 0;
      let absences = 0;
      rows.forEach(row => {
        const status = row.dailyStatuses[day.date];
        if (status === 'P') presences++;
        else if (status === 'FI' || status === 'FJ') absences++;
      });
      const total = presences + absences;
      const absRate = total > 0 ? (absences / total) * 100 : 0;
      return {
        name: String(day.day).padStart(2, '0'),
        date: day.date,
        rate: Number(absRate.toFixed(2)),
        absences,
        presences
      };
    });
  }, [days, rows]);

  return <div className="space-y-4">
    <Card className="p-5">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BarChart2 size={18} className="text-brand" />
          ABS Geral ao longo do tempo {chartView === 'dia' ? '(Mês Atual)' : '(Últimos 6 meses)'}
        </h3>
        <div className="flex bg-canvas-soft rounded-sm p-1 border border-hairline">
          <button 
            onClick={() => setChartView('dia')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${chartView === 'dia' ? 'bg-canvas shadow-sm text-brand-text' : 'text-ink-mute hover:text-ink'}`}
          >
            Por Dia
          </button>
          <button 
            onClick={() => setChartView('mes')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${chartView === 'mes' ? 'bg-canvas shadow-sm text-brand-text' : 'text-ink-mute hover:text-ink'}`}
          >
            Por Mês
          </button>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartView === 'dia' ? dailyData : monthlyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
            <RechartsTooltip 
              formatter={(value: number) => [`${value}%`, 'ABS']}
              labelFormatter={(label, entries) => chartView === 'dia' ? `Dia ${label} (${entries[0]?.payload?.date})` : `${label} (${entries[0]?.payload?.fullMonth})`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line type="monotone" dataKey={chartView === 'dia' ? 'rate' : 'absRate'} stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#0ea5e9' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-hairline bg-canvas-sunk px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <TableIcon size={18} className="text-rose-500" />
          Matriz de ABS por Operador (Últimos {matrixMonths.length} meses)
        </h3>
        {loadingMatrix && <Loader2 size={16} className="animate-spin text-ink-mute" />}
      </div>
      
      <div className="max-h-[500px] overflow-auto overscroll-contain">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <SortableMatrixHeader label="OPERADOR" sortKey="name" align="left" sticky />
              {matrixMonths.map(m => {
                const monthIndex = parseInt(m.split('-')[1], 10) - 1;
                return <SortableMatrixHeader key={m} label={MONTH_NAMES[monthIndex]} sortKey={m} align="center" />;
              })}
              <SortableMatrixHeader label="ACUMULADO" sortKey="accumulated" align="center" />
            </tr>
          </thead>
          <tbody>
            {!loadingMatrix && sortedMatrixRows.length === 0 && (
              <tr>
                <td colSpan={matrixMonths.length + 2} className="p-8 text-center text-ink-mute">
                  Nenhum dado encontrado para a matriz.
                </td>
              </tr>
            )}
            {sortedMatrixRows.map((row, index) => (
              <tr key={row.matricula} className="group hover:bg-brand/5">
                <td className={`sticky left-0 z-10 border-b border-r border-hairline/70 p-3 font-medium text-ink-2 align-middle text-left ${index % 2 ? 'bg-canvas-soft group-hover:bg-brand/5' : 'bg-canvas group-hover:bg-brand/5'}`}>
                  {row.name}
                </td>
                {matrixMonths.map(m => {
                  const val = row[m];
                  const colorClass = typeof val === 'number' && val > 0 ? 'text-danger font-medium' : val === 0 ? 'text-success font-medium' : 'text-ink-mute';
                  return (
                    <td key={m} className={`border-b border-hairline p-3 align-middle text-center tabular-nums ${colorClass} ${index % 2 ? 'bg-canvas-soft group-hover:bg-transparent' : 'bg-canvas group-hover:bg-transparent'}`}>
                      {typeof val === 'number' ? `${(val * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '-'}
                    </td>
                  );
                })}
                <td className={`border-b border-hairline p-3 align-middle text-center tabular-nums font-semibold ${row.accumulated > 0 ? 'text-danger' : row.accumulated === 0 ? 'text-success' : 'text-ink-mute'} ${index % 2 ? 'bg-canvas-soft group-hover:bg-transparent' : 'bg-canvas group-hover:bg-transparent'}`}>
                  {typeof row.accumulated === 'number' ? `${(row.accumulated * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>;
}
