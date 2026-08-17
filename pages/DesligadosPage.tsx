import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, FileSpreadsheet, Eye, UserX } from 'lucide-react';
import { Collaborator, Coordinator, Supervisor, Client, Operation, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, getInitials } from '../utils';
import * as XLSX from 'xlsx';
import { Button, MultiSelect } from '../components/ui';

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
                    <h2 className="text-2xl font-bold text-gray-800">
                        Colaboradores Desligados <span className="text-gray-500 text-lg font-normal ml-2">({filtered.length})</span>
                    </h2>
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="viewAllMode"
                            className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
                            checked={viewAll}
                            onChange={(e) => setViewAll(e.target.checked)}
                        />
                        <label htmlFor="viewAllMode" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                            Todo o Período
                        </label>
                    </div>

                    {!viewAll && (
                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-right-2">
                            <select 
                                className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none"
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                            >
                                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <div className="w-px bg-gray-200 my-1"></div>
                            <select 
                                className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none"
                                value={selectedYear} 
                                onChange={e => setSelectedYear(Number(e.target.value))}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Filtros em linha idêntico aos outros */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
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
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                <div className="p-4 border-b border-gray-100 flex gap-4 justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            className="pl-9 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
                            placeholder="Buscar por nome ou matrícula..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExportExcel}>
                        <FileSpreadsheet size={16} /> Excel
                    </Button>
                </div>
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4 w-16"></th>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Ilha</th>
                            <th className="p-4">Supervisor</th>
                            <th className="p-4">Data Desligamento</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map(c => {
                            const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                            const supName = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                            return (
                                <tr key={c.matricula} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                    <td className="p-4">
                                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                            {getInitials(c.nome)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{c.nome}</div>
                                        <div className="text-xs text-gray-400">{c.matricula}</div>
                                    </td>
                                    <td className="p-4 text-xs">{ilhaName}</td>
                                    <td className="p-4 text-xs">{supName}</td>
                                    <td className="p-4 font-bold text-gray-800">{formatDateString(c.dataFim)}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost"><Eye size={16}/></Button>
                                    </td>
                                </tr>
                            );
                        })}
                         {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
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
