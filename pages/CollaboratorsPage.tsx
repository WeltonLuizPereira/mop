import React, { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, FileText, Plus, Search, Eye, Filter } from 'lucide-react';
import { Collaborator, User, UserRole, Coordinator, Supervisor, Ilha, Operation, Client, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { getCollaboratorCalculations, formatDate, formatDateString } from '../utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Badge, Button, MultiSelect, Table } from '../components/ui';
import { ClientLogo } from '../components/collaborators/ClientLogo';
import { resolveClient } from '../lib/clientLogo';
import { CollaboratorFormModal } from '../components/collaborators/CollaboratorFormModal';

export const CollaboratorsPage: React.FC<{ currentUser: User, onViewDetails: (c: Collaborator) => void, onRefresh: () => void }> = ({ currentUser, onViewDetails, onRefresh }) => {
    // ... same as original ...
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [falhouCarga, setFalhouCarga] = useState(false);
    
    // Filtros
    const [filterCoord, setFilterCoord] = useState<string[]>([]);
    const [filterSup, setFilterSup] = useState<string[]>([]);
    const [filterIlha, setFilterIlha] = useState<string[]>([]);
    const [filterOp, setFilterOp] = useState<string[]>([]);
    const [filterClient, setFilterClient] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);

    // Date Filters
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11

    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const isAdmin = currentUser.role === UserRole.ADMIN;
    
    const load = useCallback(async () => {
        const porNome = <T extends { nome?: string }>(a: T, b: T) =>
            (a.nome || '').localeCompare(b.nome || '');
        try {
            setFalhouCarga(false);
            const [colabs, coords, supers, ilhasList, ops, cli] = await Promise.all([
                db.getCollaborators(), db.getCoordinators(), db.getSupervisors(),
                db.getIlhas(), db.getOperations(), db.getClients(),
            ]);
            setCollabs(colabs);
            setCoordinators([...coords].sort(porNome));
            setSupervisors([...supers].sort(porNome));
            setIlhas([...ilhasList].sort(porNome));
            setOperations([...ops].sort(porNome));
            setClients([...cli].sort(porNome));
        } catch {
            // sem isso a tela ficava para sempre vazia, indistinguivel de
            // "nenhum colaborador cadastrado"
            setFalhouCarga(true);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = collabs.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.matricula.includes(search);
        
        const matchesCoord = filterCoord.length === 0 || filterCoord.includes(c.coordinatorId);
        const matchesSup = filterSup.length === 0 || filterSup.includes(c.supervisorId);
        const matchesIlha = filterIlha.length === 0 || filterIlha.includes(c.ilhaId);
        const matchesOp = filterOp.length === 0 || filterOp.includes(c.operationId);
        const matchesClient = filterClient.length === 0 || filterClient.includes(c.clientId);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(c.status);

        const startOfMonth = selectedMonth === -1 ? new Date(selectedYear, 0, 1) : new Date(selectedYear, selectedMonth, 1);
        startOfMonth.setHours(0,0,0,0);
        const endOfMonth = selectedMonth === -1 ? new Date(selectedYear, 12, 0) : new Date(selectedYear, selectedMonth + 1, 0);
        endOfMonth.setHours(23,59,59,999);

        const safeDate = (dateStr: string | undefined) => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                 return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            }
            return null;
        };

        const entryDate = safeDate(c.dtEntradaProduto);
        const exitDate = c.dataFim ? safeDate(c.dataFim) : null;
        // Sem data de entrada não dá para afirmar que a pessoa entrou depois do
        // período — e sumir com ela esconderia justamente o cadastro incompleto
        // que alguém precisa achar para corrigir.
        const enteredBeforeEnd = !entryDate || entryDate <= endOfMonth;
        const stillActiveAfterStart = !exitDate || exitDate >= startOfMonth;
        const isWithinDateRange = enteredBeforeEnd && stillActiveAfterStart;

        return matchesSearch && matchesCoord && matchesSup && matchesIlha && matchesOp && matchesClient && matchesStatus && isWithinDateRange;
    }).sort((a, b) => {
        const nameDiff = a.nome.localeCompare(b.nome);
        if (nameDiff !== 0) return nameDiff;
        const ilhaA = ilhas.find(i => i.id === a.ilhaId)?.nome || '';
        const ilhaB = ilhas.find(i => i.id === b.ilhaId)?.nome || '';
        return ilhaA.localeCompare(ilhaB);
    });

    const handleSave = async (data: Collaborator) => {
        await db.saveCollaborator(data);
        if (data.feriasInicio && data.feriasFim) {
            await db.addVacationHistory(data.matricula, data.feriasInicio, data.feriasFim);
        }
        await db.addHistory({
            action: 'Novo Colaborador',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'create',
            details: `Registro criado com matrícula ${data.matricula}`
        });
        setIsCreateOpen(false);
        setCollabs(await db.getCollaborators());
        onRefresh(); 
    };

    const handleScheduleCreate = async (data: Collaborator, date: string) => {
        if (!data.matricula || !data.nome) {
            alert("Preencha Matrícula e Nome para agendar.");
            return;
        }

        await db.scheduleTask(data.matricula, data, date, currentUser.nome);
        await db.addHistory({
            action: 'Agendamento de Cadastro',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'create',
            details: `Cadastro agendado para ${formatDateString(date)}`
        });
        setIsCreateOpen(false);
        alert(`Cadastro de ${data.nome} agendado para ${formatDateString(date)} com sucesso!`);
    };

    const clearFilters = () => {
        setFilterCoord([]); setFilterSup([]); setFilterIlha([]);
        setFilterOp([]); setFilterClient([]); setFilterStatus([]);
        setSearch('');
    };

    const prepareExportData = (isExcel = false) => {
        const referencia = selectedMonth === -1 ? `Ano ${selectedYear}` : `01/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
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
        XLSX.utils.book_append_sheet(wb, ws, "MOP");
        XLSX.writeFile(wb, "MOP_Colaboradores.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const dataToExport = prepareExportData();
        if (dataToExport.length === 0) { alert("Sem dados para exportar."); return; }
        const columns = Object.keys(dataToExport[0]);
        const rows = dataToExport.map(obj => Object.values(obj).map(val => { if (val instanceof Date) return formatDate(val); return val; }));
        autoTable(doc, { head: [columns], body: rows, styles: { fontSize: 6, cellPadding: 1 }, theme: 'grid' });
        doc.save('MOP_Colaboradores.pdf');
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    const clientOptions = clients.map(c => ({value: c.id, label: c.nome}));
    const opOptions = operations.filter(o => filterClient.length === 0 || filterClient.includes(o.clientId)).map(o => ({value: o.id, label: o.nome}));
    const ilhaOptions = ilhas.filter(i => (filterClient.length === 0 || filterClient.includes(i.clientId)) && (filterOp.length === 0 || filterOp.includes(i.operationId))).map(i => ({value: i.id, label: i.nome}));
    const coordOptions = coordinators.map(c => ({value: c.id, label: c.nome}));
    const supOptions = supervisors.filter(s => filterCoord.length === 0 || s.coordinatorIds?.some(id => filterCoord.includes(id))).map(s => ({value: s.id, label: s.nome}));
    const statusOptions = Object.values(CollaboratorStatus).map(s => ({value: s, label: s}));
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = Array.from({length: 6}, (_, i) => (today.getFullYear() + 1) - i);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-[calc(100vh-120px)]">
             <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Colaboradores</h2>
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <select className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                            <option value={-1}>Todos os Meses</option>
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <select className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportExcel}><FileSpreadsheet size={16}/> Excel</Button>
                    <Button variant="secondary" onClick={handleExportPDF}><FileText size={16}/> PDF</Button>
                    {(isAdmin || currentUser.role === UserRole.SUPPORT) && <Button onClick={() => setIsCreateOpen(true)}><Plus size={16}/> Novo Cadastro</Button>}
                </div>
             </div>
             
             {/* Filtros ... (omitted same as original) */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Filter size={14}/> Filtros Avançados</h3>
                    {(filterCoord.length > 0 || filterSup.length > 0 || filterIlha.length > 0 || filterOp.length > 0 || filterClient.length > 0 || filterStatus.length > 0) && (
                        <button onClick={clearFilters} className="text-xs text-brand-600 hover:text-brand-800 font-bold hover:underline">Limpar Filtros</button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="space-y-1"><MultiSelect label="Cliente" options={clientOptions} value={filterClient} onChange={setFilterClient} /></div>
                    <div className="space-y-1"><MultiSelect label="Operação" options={opOptions} value={filterOp} onChange={setFilterOp} /></div>
                    <div className="space-y-1"><MultiSelect label="Ilha" options={ilhaOptions} value={filterIlha} onChange={setFilterIlha} /></div>
                    <div className="space-y-1"><MultiSelect label="Coordenador" options={coordOptions} value={filterCoord} onChange={setFilterCoord} /></div>
                    <div className="space-y-1"><MultiSelect label="Supervisor" options={supOptions} value={filterSup} onChange={setFilterSup} /></div>
                    <div className="space-y-1"><MultiSelect label="Status" options={statusOptions} value={filterStatus} onChange={setFilterStatus} /></div>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input className="pl-9 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500" placeholder="Buscar por nome ou matrícula" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto"><span className="font-bold">{filtered.length}</span> resultados</div>
                </div>
                {falhouCarga ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-ink-2">Não foi possível carregar os colaboradores.</p>
                        <Button variant="secondary" className="mt-3" onClick={() => load()}>Tentar de novo</Button>
                    </div>
                ) : collabs.length === 0 ? (
                    <p className="p-10 text-center text-sm text-ink-mute">
                        Nenhum colaborador cadastrado. Importe uma planilha ou cadastre o primeiro.
                    </p>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-ink-mute">Nenhum colaborador encontrado para esses filtros.</p>
                        <Button variant="secondary" className="mt-3" onClick={clearFilters}>Limpar filtros</Button>
                    </div>
                ) : (
                    <Table>
                      <Table.Head>
                        <Table.Th className="w-px pr-0">Cliente</Table.Th>
                        <Table.Th>Nome</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Supervisor</Table.Th>
                        <Table.Th>Ilha</Table.Th>
                      </Table.Head>
                      <tbody>
                        {filtered.map(c => {
                          const cliente = resolveClient(c, ilhas, clients);
                          const ilha = ilhas.find(i => i.id === c.ilhaId);
                          const supervisor = supervisors.find(s => s.id === c.supervisorId);
                          return (
                            <tr
                              key={c.matricula}
                              tabIndex={0}
                              onClick={() => onViewDetails(c)}
                              onKeyDown={e => { if (e.key === 'Enter') onViewDetails(c); }}
                              className="cursor-pointer hover:bg-canvas-soft"
                            >
                              <Table.Td className="w-px pr-0"><ClientLogo client={cliente} /></Table.Td>
                              <Table.Td className="font-medium text-ink">{c.nome}</Table.Td>
                              <Table.Td><Badge status={c.status} /></Table.Td>
                              <Table.Td>{supervisor?.nome ?? '—'}</Table.Td>
                              <Table.Td>{ilha?.nome ?? '—'}</Table.Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                )}
             </div>

             {isCreateOpen && (
                 <CollaboratorFormModal onClose={() => setIsCreateOpen(false)} onSave={handleSave} onSchedule={handleScheduleCreate} />
             )}
        </div>
    );
};
