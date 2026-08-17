import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, AlertCircle, Info, FileSpreadsheet, FileDown, CalendarDays, CalendarClock, TrendingUp, TrendingDown, Users, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';
import {
  Collaborator, Client, Operation, Ilha, Supervisor, CollaboratorStatus
} from '../types';
import { db } from '../services/mockDb';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Button } from '../components/ui';

export const TurnoverPage = () => {
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11
    const [filterClient, setFilterClient] = useState('');
    const [filterOp, setFilterOp] = useState('');
    const [filterIlha, setFilterIlha] = useState('');
    const [filterSup, setFilterSup] = useState('');

    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setCollabs(await db.getCollaborators());
            setClients((await db.getClients()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setOperations((await db.getOperations()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setIlhas((await db.getIlhas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
            setSupervisors((await db.getSupervisors()).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        };
        loadData();
    }, []);

    const safeDate = (dateStr: string) => {
        if(!dateStr) return null;
        const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanStr.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0])) {
             return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return null;
    };

    const calculateTurnover = (collabList: Collaborator[], start: Date, end: Date) => {
        const admissions = collabList.filter(c => {
            const entryDate = safeDate(c.dtEntradaProduto);
            return entryDate && entryDate >= start && entryDate <= end;
        });

        const terminations = collabList.filter(c => {
            const exitDate = safeDate(c.dataFim || '');
            if (exitDate) {
                return exitDate >= start && exitDate <= end;
            }
            if (c.status === CollaboratorStatus.DESLIGADO) {
                // Fallback se não tiver dataFim mas estiver desligado
                // Assumimos que foi no mês se não tiver data, o que é um risco, mas melhor que ignorar
                // Porém, para precisão, ideal é ter a data. 
                return false; 
            }
            return false;
        });

        const activeAtStart = collabList.filter(c => {
            const entry = safeDate(c.dtEntradaProduto);
            let exit = c.dataFim ? safeDate(c.dataFim) : null;
            if (!entry) return false;
            // Estava na empresa antes do inicio E (não saiu OU saiu depois do inicio)
            return entry < start && (!exit || exit >= start);
        }).length;

        const activeAtEnd = collabList.filter(c => {
            const entry = safeDate(c.dtEntradaProduto);
            let exit = c.dataFim ? safeDate(c.dataFim) : null;
            if (!entry) return false;
            // Entrou até o fim E (não saiu OU saiu depois do fim)
            return entry <= end && (!exit || exit > end);
        }).length;

        const avgHeadcount = (activeAtStart + activeAtEnd) / 2 || 1;
        const turnoverRate = (((admissions.length + terminations.length) / 2) / avgHeadcount) * 100;
        const terminationRate = (terminations.length / avgHeadcount) * 100;

        let tenure90 = 0, tenure180 = 0, tenure365 = 0, tenureMoreThan365 = 0;
        terminations.forEach(c => {
            const entry = safeDate(c.dtEntradaProduto);
            const exit = safeDate(c.dataFim || '');
            if (entry && exit) {
                const diffTime = Math.abs(exit.getTime() - entry.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 90) tenure90++;
                else if (diffDays <= 180) tenure180++;
                else if (diffDays <= 365) tenure365++;
                else tenureMoreThan365++;
            }
        });

        return {
            admissionsCount: admissions.length,
            terminationsCount: terminations.length,
            turnoverRate: turnoverRate,
            terminationRate: terminationRate,
            avgHeadcount,
            activeAtStart,
            activeAtEnd,
            tenure90,
            tenure180,
            tenure365,
            tenureMoreThan365
        };
    };

    const applyFilters = (c: Collaborator) => {
        if (filterClient && c.clientId !== filterClient) return false;
        if (filterOp && c.operationId !== filterOp) return false;
        if (filterIlha && c.ilhaId !== filterIlha) return false;
        if (filterSup && c.supervisorId !== filterSup) return false;
        return true;
    };

    const metrics = useMemo(() => {
        const filteredCollabs = collabs.filter(applyFilters);
        let startOfMonth, endOfMonth;

        if (selectedMonth === -1) {
            startOfMonth = new Date(selectedYear, 0, 1);
            startOfMonth.setHours(0,0,0,0);
            endOfMonth = new Date(selectedYear, 12, 0);
            endOfMonth.setHours(23,59,59,999);
        } else {
            startOfMonth = new Date(selectedYear, selectedMonth, 1);
            startOfMonth.setHours(0,0,0,0);
            endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
            endOfMonth.setHours(23,59,59,999);
        }

        const result = calculateTurnover(filteredCollabs, startOfMonth, endOfMonth);
        
        return {
            ...result,
            turnoverRate: result.turnoverRate.toFixed(2),
            terminationRate: result.terminationRate.toFixed(2),
            headcount: Math.round(result.avgHeadcount)
        };
    }, [selectedYear, selectedMonth, filterClient, filterOp, filterIlha, filterSup, collabs]);

    const chartData = useMemo(() => {
        const data = [];
        if (selectedMonth === -1) {
            for (let i = 0; i < 12; i++) {
                const start = new Date(selectedYear, i, 1); start.setHours(0,0,0,0);
                const end = new Date(selectedYear, i + 1, 0); end.setHours(23,59,59,999);
                const filtered = collabs.filter(applyFilters);
                const stats = calculateTurnover(filtered, start, end);
                data.push({
                    name: start.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                    turnover: parseFloat(stats.turnoverRate.toFixed(2)),
                    terminationRate: parseFloat(stats.terminationRate.toFixed(2)),
                    admissoes: stats.admissionsCount,
                    desligamentos: stats.terminationsCount,
                    activeAtStart: stats.activeAtStart,
                    activeAtEnd: stats.activeAtEnd,
                    avgHeadcount: Math.round(stats.avgHeadcount)
                });
            }
        } else {
            // Últimos 6 meses
            for (let i = 5; i >= 0; i--) {
                const d = new Date(selectedYear, selectedMonth - i, 1);
                const y = d.getFullYear();
                const m = d.getMonth();
                const start = new Date(y, m, 1); start.setHours(0,0,0,0);
                const end = new Date(y, m + 1, 0); end.setHours(23,59,59,999);

                const filtered = collabs.filter(applyFilters);
                const stats = calculateTurnover(filtered, start, end);

                data.push({
                    name: start.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                    turnover: parseFloat(stats.turnoverRate.toFixed(2)),
                    terminationRate: parseFloat(stats.terminationRate.toFixed(2)),
                    admissoes: stats.admissionsCount,
                    desligamentos: stats.terminationsCount,
                    activeAtStart: stats.activeAtStart,
                    activeAtEnd: stats.activeAtEnd,
                    avgHeadcount: Math.round(stats.avgHeadcount)
                });
            }
        }
        return data;
    }, [selectedYear, selectedMonth, filterClient, filterOp, filterIlha, filterSup, collabs]);

    const ilhaChartData = useMemo(() => {
        let start, end;
        if (selectedMonth === -1) {
            start = new Date(selectedYear, 0, 1); start.setHours(0,0,0,0);
            end = new Date(selectedYear, 12, 0); end.setHours(23,59,59,999);
        } else {
            start = new Date(selectedYear, selectedMonth, 1); start.setHours(0,0,0,0);
            end = new Date(selectedYear, selectedMonth + 1, 0); end.setHours(23,59,59,999);
        }

        const data = ilhas.map(i => {
            // Filtrar apenas se pertencer aos filtros globais
            if (filterClient && i.clientId !== filterClient) return null;
            if (filterOp && i.operationId !== filterOp) return null;
            if (filterIlha && i.id !== filterIlha) return null;
            
            // Pega colaboradores dessa ilha que obedecem todos os filtros
            const ilhaCollabs = collabs.filter(c => c.ilhaId === i.id && applyFilters(c));
            if(ilhaCollabs.length === 0) return null;

            const stats = calculateTurnover(ilhaCollabs, start, end);
            
            // Só retorna se tiver HC > 0 para evitar divisão por zero ou ilhas vazias
            if (stats.avgHeadcount < 1 && stats.admissionsCount === 0 && stats.terminationsCount === 0) return null;

            return {
                name: i.nome,
                turnover: parseFloat(stats.turnoverRate.toFixed(2)) || 0,
                headcount: Math.round(stats.avgHeadcount)
            };
        }).filter(Boolean) as {name: string, turnover: number, headcount: number}[];

        // Top 10 maiores turnovers
        return data.sort((a, b) => b.turnover - a.turnover).slice(0, 10);
    }, [selectedYear, selectedMonth, filterClient, filterOp, filterIlha, filterSup, ilhas, collabs]);

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = Array.from({length: 6}, (_, i) => (today.getFullYear() + 1) - i);

    const handleExport = async (type: 'excel' | 'pdf') => {
        let periodStr = selectedMonth === -1 ? `Ano de ${selectedYear}` : `${months[selectedMonth]} de ${selectedYear}`;

        if (type === 'excel') {
            const dataToExport = ilhaChartData.map(i => ({
                "Período": periodStr,
                "Ilha": i.name,
                "Turnover (%)": i.turnover,
                "Headcount Médio": i.headcount
            }));

            const ws = XLSX.utils.json_to_sheet([{
                "Período": periodStr,
                "Turnover Geral (%)": metrics.turnoverRate,
                "Taxa de Desligamento (%)": metrics.terminationRate,
                "Headcount Global Médio": metrics.headcount,
                "Total de Admissões": metrics.admissionsCount,
                "Total de Desligamentos": metrics.terminationsCount,
                "Deslig. (até 90 dias)": `${metrics.tenure90} (${metrics.terminationsCount > 0 ? ((metrics.tenure90 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`,
                "Deslig. (91 a 180 dias)": `${metrics.tenure180} (${metrics.terminationsCount > 0 ? ((metrics.tenure180 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`,
                "Deslig. (181 a 365 dias)": `${metrics.tenure365} (${metrics.terminationsCount > 0 ? ((metrics.tenure365 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`,
                "Deslig. (> 365 dias)": `${metrics.tenureMoreThan365} (${metrics.terminationsCount > 0 ? ((metrics.tenureMoreThan365 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`
             }, {}, ...dataToExport]);
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Turnover");
            
            if (selectedMonth === -1) {
                const wsMonthly = XLSX.utils.json_to_sheet(chartData.map(d => ({
                    "Mês": d.name,
                    "Ativos Início": d.activeAtStart,
                    "Admissões": d.admissoes,
                    "Desligamentos": d.desligamentos,
                    "Ativos Fim": d.activeAtEnd,
                    "Média Movimentação": ((d.admissoes + d.desligamentos) / 2),
                    "Headcount Médio": d.avgHeadcount,
                    "Turnover (%)": d.turnover,
                    "Taxa de Desligamento (%)": d.terminationRate
                })));
                XLSX.utils.book_append_sheet(wb, wsMonthly, "Mensal");
            }

            XLSX.writeFile(wb, `MOP_Turnover_${periodStr.replace(/ /g, '_')}.xlsx`);
        } else {
            const reportElement = document.getElementById('turnover-report-content');
            if (reportElement) {
                try {
                    const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, logging: false });
                    const imgData = canvas.toDataURL('image/png');
                    const pdfWidth = 210;
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    
                    // Ajusta o tamanho da página dinamicamente para caber todo o conteúdo
                    const doc = new jsPDF('p', 'mm', [pdfWidth, Math.max(297, pdfHeight + 30)]);
                    
                    doc.setFontSize(16);
                    doc.text(`Relatório Gerencial de Turnover - ${periodStr}`, 14, 15);
                    
                    doc.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
                    doc.save(`MOP_Turnover_${periodStr.replace(/ /g, '_')}.pdf`);
                } catch (error) {
                    console.error("Erro ao gerar PDF", error);
                    alert("Erro ao exportar PDF.");
                }
            } else {
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text(`Relatório Gerencial de Turnover - ${periodStr}`, 14, 20);
                
                doc.setFontSize(10);
                doc.text(`Visão Global:`, 14, 30);
                doc.text(`Turnover Geral: ${metrics.turnoverRate}%`, 14, 36);
                doc.text(`Taxa de Desligamento: ${metrics.terminationRate}%`, 80, 36);
                doc.text(`Headcount Médio: ${metrics.headcount}`, 150, 36);
                doc.text(`Admissões: ${metrics.admissionsCount}`, 14, 42);
                doc.text(`Desligamentos: ${metrics.terminationsCount}`, 80, 42);
                
                doc.text(`Perfil dos Desligamentos (Tempo de Casa):`, 14, 52);
                doc.text(`Até 90 dias: ${metrics.tenure90} (${metrics.terminationsCount > 0 ? ((metrics.tenure90 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`, 14, 58);
                doc.text(`91 a 180 dias: ${metrics.tenure180} (${metrics.terminationsCount > 0 ? ((metrics.tenure180 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`, 80, 58);
                doc.text(`181 a 365 dias: ${metrics.tenure365} (${metrics.terminationsCount > 0 ? ((metrics.tenure365 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`, 146, 58);
                doc.text(`mais de 365 dias: ${metrics.tenureMoreThan365} (${metrics.terminationsCount > 0 ? ((metrics.tenureMoreThan365 / metrics.terminationsCount) * 100).toFixed(1) : 0}%)`, 14, 64);

                doc.text(`Detalhamento por Ilha (Maiores Turnovers):`, 14, 74);

                const tableData = ilhaChartData.map(i => [
                    i.name,
                    `${i.turnover}%`,
                    i.headcount
                ]);

                autoTable(doc, {
                    startY: 78,
                    head: [['Ilha', 'Turnover (%)', 'Headcount Médio']],
                    body: tableData,
                    theme: 'grid',
                    styles: { fontSize: 8 }
                });
                doc.save(`MOP_Turnover_${periodStr.replace(/ /g, '_')}.pdf`);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Controls */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Indicadores de Turnover</h2>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <select 
                            className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none cursor-pointer"
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                        >
                            <option value={-1}>Todos os Meses</option>
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <select 
                            className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none cursor-pointer"
                            value={selectedYear} 
                            onChange={e => setSelectedYear(Number(e.target.value))}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => handleExport('excel')} className="h-10 px-3 bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-brand-600">
                            <FileSpreadsheet size={16} /> <span className="hidden sm:inline text-xs font-semibold">Excel</span>
                        </Button>
                        <Button variant="secondary" onClick={() => handleExport('pdf')} className="h-10 px-3 bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-red-600">
                            <FileDown size={16} /> <span className="hidden sm:inline text-xs font-semibold">PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Cliente</label>
                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                        <option value="">Todos</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Operação</label>
                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterOp} onChange={e => setFilterOp(e.target.value)}>
                        <option value="">Todas</option>
                        {operations
                            .filter(o => !filterClient || o.clientId === filterClient)
                            .map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Ilha</label>
                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterIlha} onChange={e => setFilterIlha(e.target.value)}>
                        <option value="">Todas</option>
                        {ilhas
                            .filter(i => (!filterClient || i.clientId === filterClient) && (!filterOp || i.operationId === filterOp))
                            .map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Supervisor</label>
                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterSup} onChange={e => setFilterSup(e.target.value)}>
                        <option value="">Todos</option>
                        {supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
            </div>

            {/* Report Content */}
            <div id="turnover-report-content" className="space-y-6 bg-gray-50/50 p-2 sm:p-4 rounded-xl">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                        <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide flex items-center gap-1">Turnover Mensal <HelpCircle size={12} className="text-gray-300"/></p>
                        <h3 className="text-3xl font-bold text-brand-600 mt-2">{metrics.turnoverRate}%</h3>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-brand-500"></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Taxa de Desligamento</p>
                        <h3 className="text-3xl font-bold text-red-500 mt-2">{metrics.terminationRate}%</h3>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Headcount Médio</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{metrics.headcount}</h3>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Movimentação</p>
                        <div className="flex items-end gap-3 mt-2">
                             <div>
                                 <span className="text-xs text-gray-400 font-bold block">Admissões</span>
                                 <span className="text-xl font-bold text-green-600">{metrics.admissionsCount}</span>
                             </div>
                             <div className="h-8 w-px bg-gray-200"></div>
                             <div>
                                 <span className="text-xs text-gray-400 font-bold block">Desligamentos</span>
                                 <span className="text-xl font-bold text-red-600">{metrics.terminationsCount}</span>
                             </div>
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-gray-400"></div>
                </div>
            </div>

            {/* Tenure KPI Cards */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><CalendarClock size={16} className="text-indigo-600"/> Tempo de Casa nos Desligamentos (Período Atual)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex justify-between items-center">
                         <div>
                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Até 90 Dias</span>
                             <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-indigo-700">{metrics.tenure90}</span>
                                <span className="text-sm font-medium text-indigo-500 mb-1">desl.</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100 text-sm font-bold text-indigo-700">
                                 {metrics.terminationsCount > 0 ? ((metrics.tenure90 / metrics.terminationsCount) * 100).toFixed(1) : '0'}%
                             </div>
                         </div>
                     </div>
                     <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex justify-between items-center">
                         <div>
                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">91 a 180 Dias</span>
                             <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-indigo-700">{metrics.tenure180}</span>
                                <span className="text-sm font-medium text-indigo-500 mb-1">desl.</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100 text-sm font-bold text-indigo-700">
                                 {metrics.terminationsCount > 0 ? ((metrics.tenure180 / metrics.terminationsCount) * 100).toFixed(1) : '0'}%
                             </div>
                         </div>
                     </div>
                     <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex justify-between items-center">
                         <div>
                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">181 a 365 Dias</span>
                             <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-indigo-700">{metrics.tenure365}</span>
                                <span className="text-sm font-medium text-indigo-500 mb-1">desl.</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100 text-sm font-bold text-indigo-700">
                                 {metrics.terminationsCount > 0 ? ((metrics.tenure365 / metrics.terminationsCount) * 100).toFixed(1) : '0'}%
                             </div>
                         </div>
                     </div>
                     <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex justify-between items-center">
                         <div>
                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Mais de 365</span>
                             <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-indigo-700">{metrics.tenureMoreThan365}</span>
                                <span className="text-sm font-medium text-indigo-500 mb-1">desl.</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100 text-sm font-bold text-indigo-700">
                                 {metrics.terminationsCount > 0 ? ((metrics.tenureMoreThan365 / metrics.terminationsCount) * 100).toFixed(1) : '0'}%
                             </div>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Row 1 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-brand-600"/> Evolução do Turnover (6 Meses)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} unit="%" />
                                <RechartsTooltip 
                                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px'}} 
                                    itemStyle={{color: '#16a34a'}}
                                />
                                <Area type="monotone" dataKey="turnover" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorTurnover)" name="Turnover %" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={16} className="text-blue-600"/> Admissões x Desligamentos</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px'}} />
                                <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                                <Bar dataKey="admissoes" name="Admissões" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={20} isAnimationActive={false} />
                                <Bar dataKey="desligamentos" name="Desligamentos" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={20} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col lg:col-span-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-red-500"/> Taxa de Desligamento</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTermination" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} unit="%" />
                                <RechartsTooltip 
                                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px'}} 
                                    itemStyle={{color: '#ef4444'}}
                                />
                                <Area type="monotone" dataKey="terminationRate" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTermination)" name="Taxa %" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-purple-600"/> Turnover por Ilha (Top 10 - Mês Atual)</h3>
                    <div className="flex-1 w-full min-h-0">
                         {ilhaChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ilhaChartData} layout="vertical" margin={{left: 20}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} unit="%" />
                                    <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#4b5563', fontWeight: 500}} />
                                    <RechartsTooltip 
                                        contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px'}}
                                        formatter={(value: any, name: any, props: any) => [`${value}% Turnover`, `HC Médio: ${props.payload.headcount}`]}
                                    />
                                    <Bar dataKey="turnover" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} name="Turnover %" isAnimationActive={false}>
                                         {ilhaChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index < 3 ? '#7c3aed' : '#a78bfa'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                 <AlertCircle size={24} className="mb-2 opacity-50"/>
                                 <p className="text-xs">Sem dados suficientes de HC para as ilhas selecionadas.</p>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {selectedMonth === -1 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><CalendarDays size={16} className="text-brand-600"/> Detalhamento Mensal</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 border-collapse">
                            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-3 border-b border-gray-100">Mês</th>
                                    <th className="p-3 text-right border-b border-gray-100">Ativos Início</th>
                                    <th className="p-3 text-right border-b border-gray-100">Admissões</th>
                                    <th className="p-3 text-right border-b border-gray-100">Desligamentos</th>
                                    <th className="p-3 text-right border-b border-gray-100">Ativos Fim</th>
                                    <th className="p-3 text-right border-b border-gray-100" title="Média de Movimentação = (Admissões + Desligamentos) / 2">Média Mov.</th>
                                    <th className="p-3 text-right border-b border-gray-100" title="Headcount Médio = (Ativos Início + Ativos Fim) / 2">HC Médio</th>
                                    <th className="p-3 text-right border-b border-gray-100">Turnover (%)</th>
                                    <th className="p-3 text-right border-b border-gray-100">Taxa Deslig. (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {chartData.map((d, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-semibold text-gray-800">{d.name}</td>
                                        <td className="p-3 text-right font-medium">{d.activeAtStart}</td>
                                        <td className="p-3 text-right text-green-600 font-medium">{d.admissoes}</td>
                                        <td className="p-3 text-right text-red-600 font-medium">{d.desligamentos}</td>
                                        <td className="p-3 text-right font-medium">{d.activeAtEnd}</td>
                                        <td className="p-3 text-right font-medium">{((d.admissoes + d.desligamentos) / 2).toFixed(1)}</td>
                                        <td className="p-3 text-right font-medium">{d.avgHeadcount}</td>
                                        <td className="p-3 text-right font-medium">{d.turnover}%</td>
                                        <td className="p-3 text-right font-medium">{d.terminationRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Methodology Footer */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-6">
                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><Info size={16}/> Metodologia de Cálculo</h4>
                <p className="text-xs text-blue-700 leading-relaxed mb-3">
                    O cálculo de Turnover apresentado segue a fórmula padrão de mercado para rotatividade média mensal:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                        <span className="font-bold text-blue-900 block mb-1">1. Média de Movimentação</span>
                        <span className="text-gray-600">(Admissões + Desligamentos) ÷ 2</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                        <span className="font-bold text-blue-900 block mb-1">2. Headcount Médio</span>
                        <span className="text-gray-600">(Ativos no Início do Período + Ativos no Fim do Período) ÷ 2</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                        <span className="font-bold text-blue-900 block mb-1">3. Taxa Final</span>
                        <span className="text-gray-600">(Média Movimentação ÷ Headcount Médio) × 100</span>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};
