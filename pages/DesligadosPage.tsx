import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, FileSpreadsheet, Eye, UserX } from 'lucide-react';
import { Collaborator, Coordinator, Supervisor, Client, Operation, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, getInitials } from '../utils';
import * as XLSX from 'xlsx';
import { Button, ChipSelect, MultiSelect } from '../components/ui';

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
    const [viewAll, setViewAll] = useState(false);

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

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = Array.from({length: 6}, (_, i) => (today.getFullYear() + 1) - i);

    const handleExportExcel = () => {
        if (filtered.length === 0) {
            alert("Sem dados para exportar.");
            return;
        }

        const dataToExport = filtered.map(c => ({
            "Matrícula": c.matricula,
            "Nome": c.nome,
            "Data de Admissão": c.dtEntradaProduto ? formatDateString(c.dtEntradaProduto) : '-',
            "Data de Desligamento": c.dataFim ? formatDateString(c.dataFim) : '-',
            "Ilha": ilhas.find(i => i.id === c.ilhaId)?.nome || '-',
            "Supervisor": supervisors.find(s => s.id === c.supervisorId)?.nome || '-',
            "EMAIL VR": c.email_vr || '-',
            "SENHA": c.senha || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Desligados");
        XLSX.writeFile(wb, "MOP_Colaboradores_Desligados.xlsx");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                 <div className="flex items-center gap-4">
                    {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
                    <p className="text-[13px] text-ink-mute">
                        <span className="t-data text-ink">{filtered.length}</span> desligados
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="viewAllMode"
                            className="w-4 h-4 text-brand bg-canvas-sunk border-hairline rounded focus:ring-brand"
                            checked={viewAll}
                            onChange={(e) => setViewAll(e.target.checked)}
                        />
                        <label htmlFor="viewAllMode" className="text-sm font-medium text-ink cursor-pointer select-none">
                            Todo o período
                        </label>
                    </div>

                    {!viewAll && (
                        <div className="flex gap-2.5 animate-in fade-in slide-in-from-right-2">
                            <ChipSelect rotulo="Mês" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </ChipSelect>
                            <ChipSelect rotulo="Ano" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </ChipSelect>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
                {/* Filtros em linha idêntico aos outros */}
                <div className="p-4 border-b border-hairline bg-canvas-soft flex flex-wrap gap-3 items-center">
                    <div className="min-w-[180px]">
                        <MultiSelect 
                            options={clients.map(c => ({value: c.id, label: c.nome}))}
                            value={filterClient}
                            onChange={setFilterClient}
                            label="Cliente"
                        />
                    </div>
                    <div className="min-w-[180px]">
                        <MultiSelect 
                            options={operations.filter(o => filterClient.length === 0 || filterClient.includes(o.clientId)).map(o => ({value: o.id, label: o.nome}))}
                            value={filterOp}
                            onChange={setFilterOp}
                            label="Operação"
                        />
                    </div>
                    <div className="min-w-[180px]">
                        <MultiSelect 
                            options={coordinators.map(c => ({value: c.id, label: c.nome}))}
                            value={filterCoord}
                            onChange={setFilterCoord}
                            label="Coordenador"
                        />
                    </div>
                    <div className="min-w-[180px]">
                        <MultiSelect 
                            options={supervisors.filter(s => filterCoord.length === 0 || s.coordinatorIds?.some(id => filterCoord.includes(id))).map(s => ({value: s.id, label: s.nome}))}
                            value={filterSup}
                            onChange={setFilterSup}
                            label="Supervisor"
                        />
                    </div>
                    <div className="min-w-[180px]">
                        <MultiSelect 
                            options={ilhas.filter(i => 
                                (filterOp.length === 0 || filterOp.includes(i.operationId)) &&
                                (filterClient.length === 0 || filterClient.includes(i.clientId))
                            ).map(i => ({value: i.id, label: i.nome}))}
                            value={filterIlha}
                            onChange={setFilterIlha}
                            label="Ilha"
                        />
                    </div>
                    {(filterCoord.length > 0 || filterSup.length > 0 || filterIlha.length > 0 || filterOp.length > 0 || filterClient.length > 0) && (
                        <button 
                            onClick={() => { setFilterCoord([]); setFilterSup([]); setFilterIlha([]); setFilterOp([]); setFilterClient([]); }}
                            className="text-xs text-danger hover:text-danger font-medium px-2 py-1 rounded bg-danger/10 hover:bg-danger/15 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                <div className="p-4 border-b border-hairline flex gap-4 justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
                        <input
                            className="pl-9 w-full px-3 py-[7px] bg-canvas border border-hairline-2 rounded-sm text-[13px] text-ink placeholder:text-ink-faint"
                            placeholder="Buscar nome ou matrícula"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExportExcel}>
                        <FileSpreadsheet size={16} /> Excel
                    </Button>
                </div>
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
            </div>
        </div>
    );
}
