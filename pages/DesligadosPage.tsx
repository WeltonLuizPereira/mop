import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileSpreadsheet, Eye, UserX } from 'lucide-react';
import { Collaborator, Coordinator, Supervisor, Client, Operation, Ilha, CollaboratorStatus, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, getInitials, getCollaboratorCalculations } from '../utils';
import * as XLSX from 'xlsx';
import { Button, Chip, ChipSelect, MultiSelect, Table } from '../components/ui';

export const DesligadosPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    
    const [search, setSearch] = useState('');
    
    // Filtros
    const [filterCoord, setFilterCoord] = useState<string[]>([]);
    const [filterSup, setFilterSup] = useState<string[]>([]);
    const [filterIlha, setFilterIlha] = useState<string[]>([]);
    const [filterOp, setFilterOp] = useState<string[]>([]);
    const [filterClient, setFilterClient] = useState<string[]>([]);
    
    // New State for Date Filtering
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [viewAll, setViewAll] = useState(true);

    useEffect(() => {
        const load = async () => {
            setCollabs(await db.getCollaborators());
            setIlhas((await db.getIlhas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setSupervisors((await db.getSupervisors()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setClients((await db.getClients()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setOperations((await db.getOperations()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setCoordinators((await db.getCoordinators()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        }
        load();
    }, []);

    const filtered = collabs.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.matricula.includes(search);
        
        const mCoord = filterCoord.length === 0 || filterCoord.includes(c.coordinatorId);
        const mSup = filterSup.length === 0 || filterSup.includes(c.supervisorId);
        const mIlha = filterIlha.length === 0 || filterIlha.includes(c.ilhaId);
        const mOp = filterOp.length === 0 || filterOp.includes(c.operationId);
        const mClient = filterClient.length === 0 || filterClient.includes(c.clientId);
        
        let matchesDate = false;
        
        if (viewAll) {
            matchesDate = true;
        } else {
            if (c.dataFim) {
                 const parts = c.dataFim.split('-');
                 const dDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                 matchesDate = dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
            }
        }

        return c.status === CollaboratorStatus.DESLIGADO && matchesSearch && mCoord && mSup && mIlha && mOp && mClient && matchesDate;
    }).sort((a, b) => {
        // Sort by Data Desligamento (Newest to Oldest)
        const dateA = a.dataFim ? new Date(a.dataFim).getTime() : 0;
        const dateB = b.dataFim ? new Date(b.dataFim).getTime() : 0;
        return dateB - dateA;
    });

    const filtrosAtivos = filterCoord.length + filterSup.length + filterIlha.length
        + filterOp.length + filterClient.length;
    const limparFiltros = () => {
        setFilterCoord([]); setFilterSup([]); setFilterIlha([]); setFilterOp([]); setFilterClient([]);
    };

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = Array.from({length: 6}, (_, i) => (today.getFullYear() + 1) - i);

    const prepareExportData = (isExcel = false) => {
        const referencia = viewAll
            ? 'Todo o período'
            : `01/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
            
        return filtered.map(c => {
            const calc = getCollaboratorCalculations(c.dtEntradaProduto);
            const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
            const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
            const coord = coordinators.find(co => co.id === c.coordinatorId)?.nome || '-';
            const op = operations.find(o => o.id === c.operationId)?.nome || '-';
            const cli = clients.find(cl => cl.id === c.clientId)?.nome || '-';

            const toExcelDate = (dateStr: string | undefined) => {
                if (!dateStr || dateStr === '-') return null;
                let day, month, year;
                if (dateStr.includes('/')) {
                   const parts = dateStr.split('/');
                   if(parts.length !== 3) return null;
                   day = Number(parts[0]);
                   month = Number(parts[1]) - 1;
                   year = Number(parts[2]);
                } else {
                   const parts = dateStr.split('-');
                   if(parts.length !== 3) return null;
                   year = Number(parts[0]);
                   month = Number(parts[1]) - 1;
                   day = Number(parts[2]);
                }
                return new Date(year, month, day, 12, 0, 0);
            };

            const formatTimeForExport = (t: string | undefined) => {
                if(!t) return isExcel ? null : '00:00:00';
                if (isExcel) {
                    const parts = t.split(':');
                    if (parts.length >= 2) {
                        const h = parseInt(parts[0], 10) || 0;
                        const m = parseInt(parts[1], 10) || 0;
                        const s = parts.length >= 3 ? parseInt(parts[2], 10) || 0 : 0;
                        return (h * 3600 + m * 60 + s) / 86400;
                    }
                    return null;
                }
                if(t.length === 5) return `${t}:00`;
                return t;
            }

            return {
                'MATRICULA': parseInt(c.matricula) || c.matricula,
                'EMAIL': c.email,
                'NOME': c.nome,
                'SUPERVISOR': sup,
                'ILHA': ilha,
                'STATUS': c.status,
                'DT ENTRADA PRODUTO': toExcelDate(c.dtEntradaProduto),
                'DATA FIM': toExcelDate(c.dataFim),
                'HORÁRIO DE ENTRADA': formatTimeForExport(c.horarioEntrada),
                'HORÁRIO DE SÁIDA': formatTimeForExport(c.horarioSaida),
                'EXPERIENCIA': calc.experiencia,
                'TEMPO DE CASA': calc.tempoDeCasa,
                'VENCE': calc.vence !== '-' ? toExcelDate(calc.vence) : '-',
                'DT_NASC': toExcelDate(c.dtNasc),
                'REFERENCIA': referencia,
                'COORDENADOR': coord,
                'OPERAÇÃO': op,
                'CLIENTE': cli,
                'EMAIL VR': c.email_vr || '',
                'SENHA': c.senha || ''
            };
        });
    };

    const handleExportExcel = () => {
        if (filtered.length === 0) {
            alert("Sem dados para exportar.");
            return;
        }

        const dataToExport = prepareExportData(true);
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        let entradaCol = -1;
        let saidaCol = -1;
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            const cell = ws[cellAddress];
            if (cell && cell.v === 'HORÁRIO DE ENTRADA') entradaCol = C;
            if (cell && cell.v === 'HORÁRIO DE SÁIDA') saidaCol = C;
        }

        for (let R = 1; R <= range.e.r; ++R) {
            if (entradaCol !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: entradaCol });
                const cell = ws[cellAddress];
                if (cell && cell.t === 'n') {
                    cell.z = 'hh:mm:ss';
                }
            }
            if (saidaCol !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: saidaCol });
                const cell = ws[cellAddress];
                if (cell && cell.t === 'n') {
                    cell.z = 'hh:mm:ss';
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Desligados");
        XLSX.writeFile(wb, "MOP_Colaboradores_Desligados.xlsx");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
            </div>

            <Table.Card>
                <Table.Toolbar
                    busca={{ valor: search, aoMudar: setSearch, placeholder: 'Buscar nome ou matrícula' }}
                    contagem={{ n: filtered.length, um: 'desligado', varios: 'desligados' }}
                    filtrosAtivos={filtrosAtivos}
                    aoLimparFiltros={limparFiltros}
                    chips={<>
                        {/* "Todo o período" é o recorte de tempo: quando ligado,
                            mês e ano não têm mais o que dizer e saem de cena. */}
                        <Chip
                            onClick={() => setViewAll(v => !v)}
                            aria-pressed={viewAll}
                            className={viewAll ? 'border-brand text-brand-text' : ''}
                        >
                            Todo o período
                        </Chip>
                        {!viewAll && (
                            <>
                                <ChipSelect rotulo="Mês" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </ChipSelect>
                                <ChipSelect rotulo="Ano" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </ChipSelect>
                            </>
                        )}
                    </>}
                    acoes={
                        <Button variant="ghost" onClick={handleExportExcel}>
                            <FileSpreadsheet size={15} /> Excel
                        </Button>
                    }
                    filtros={<>
                        <MultiSelect
                            label="Cliente"
                            options={clients.filter(c => c.status === EntityStatus.ACTIVE).map(c => ({ value: c.id, label: c.nome }))}
                            value={filterClient}
                            onChange={setFilterClient}
                        />
                        <MultiSelect
                            label="Operação"
                            options={operations.filter(o => o.status === EntityStatus.ACTIVE && (filterClient.length === 0 || filterClient.includes(o.clientId))).map(o => ({ value: o.id, label: o.nome }))}
                            value={filterOp}
                            onChange={setFilterOp}
                        />
                        <MultiSelect
                            label="Coordenador"
                            options={coordinators.filter(c => c.status === EntityStatus.ACTIVE).map(c => ({ value: c.id, label: c.nome }))}
                            value={filterCoord}
                            onChange={setFilterCoord}
                        />
                        <MultiSelect
                            label="Supervisor"
                            options={supervisors.filter(s => s.status === EntityStatus.ACTIVE && (filterCoord.length === 0 || s.coordinatorIds?.some(id => filterCoord.includes(id)))).map(s => ({ value: s.id, label: s.nome }))}
                            value={filterSup}
                            onChange={setFilterSup}
                        />
                        <MultiSelect
                            label="Ilha"
                            options={ilhas.filter(i =>
                                i.status === EntityStatus.ACTIVE &&
                                (filterOp.length === 0 || filterOp.includes(i.operationId)) &&
                                (filterClient.length === 0 || filterClient.includes(i.clientId))
                            ).map(i => ({ value: i.id, label: i.nome }))}
                            value={filterIlha}
                            onChange={setFilterIlha}
                        />
                    </>}
                />
                <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                    <thead>
                        <tr>
                            <th className="p-4 w-16"></th>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Ilha</th>
                            <th className="p-4">Supervisor</th>
                            <th className="p-4">Data Desligamento</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                        {filtered.map(c => {
                            const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                            const supName = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                            return (
                                <tr key={c.matricula} className="hover:bg-canvas-soft cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                    <td className="p-4">
                                        <div className="w-9 h-9 rounded-full bg-danger/15 text-danger border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-xs">
                                            {getInitials(c.nome)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-ink">{c.nome}</div>
                                        <div className="text-xs text-ink-faint">{c.matricula}</div>
                                    </td>
                                    <td className="p-4"><span className="font-display text-xs tracking-[-.01em] text-ink-2">{ilhaName}</span></td>
                                    <td className="p-4 text-xs">{supName}</td>
                                    <td className="p-4 text-ink dado">{formatDateString(c.dataFim)}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost"><Eye size={16}/></Button>
                                    </td>
                                </tr>
                            );
                        })}
                         {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-ink-faint">
                                    <UserX className="mx-auto mb-2 opacity-50" size={24}/>
                                    Nenhum colaborador desligado encontrado neste período.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Table.Card>
        </div>
    );
}
