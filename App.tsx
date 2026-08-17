
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import {
  LayoutDashboard, Users, UserCog, Building2, Globe, MapPin, Briefcase,
  LogOut, Menu, ChevronLeft, ChevronRight, Search, Phone,
  ShieldCheck, Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  Info, AlertTriangle, ArrowUpRight, ArrowDownRight, Eye,
  Wallet, Sun, Calendar as CalendarIcon, Clock, History, FileText, XCircle, Lightbulb, Save,
  User as UserIcon, Cake, Hash, BriefcaseBusiness, UserPlus, ArrowLeft, Activity, File,
  TrendingUp, MoreHorizontal, BarChart3, PieChart, Timer, UserMinus, LineChart, ListChecks, Calendar, Network, AlignJustify, GanttChartSquare,
  Stethoscope, UserX, Key
} from 'lucide-react';
import {
  User, UserRole, Collaborator, Coordinator, Supervisor,
  Client, Operation, Ilha, CollaboratorStatus
} from './types';
import { db } from './services/mockDb';
import { getCollaboratorCalculations, formatTime, calculateDaysDiff, formatDate, formatDateString, addDays, getInitials } from './utils';
import * as XLSX from 'xlsx';
import { Button, Badge, MultiSelect } from './components/ui';
import { NavItem } from './components/shell/NavItem';
import { ThemeToggle } from './components/shell/ThemeToggle';
import { NotificationCenter } from './components/shell/NotificationCenter';
import { Header } from './components/shell/Header';
import { LoginPage } from './pages/LoginPage';
import { CollaboratorsPage } from './pages/CollaboratorsPage';
import { CollaboratorDetailsPage } from './pages/CollaboratorDetailsPage';
import { CrudPage } from './pages/CrudPage';
import { ScheduledTasksPage } from './pages/ScheduledTasksPage';
import { HistoryPage } from './pages/HistoryPage';
import { UsersPage } from './pages/UsersPage';
import { ResetDataPage } from './pages/ResetDataPage';
import { AboutPage } from './pages/AboutPage';
import { TurnoverPage } from './pages/TurnoverPage';
import { OrganogramPage } from './pages/OrganogramPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { BulkUpdatePage } from './pages/BulkUpdatePage';

// --- TurnoverPage ---

// ... OrganogramPage, CrudPage, LoginPage ...
// Reusing same components

// ... ScheduledTasksPage, HistoryPage, Dashboard ...
// (Reusing existing components for brevity)

// ... ImportPage ...

const ExpiringContractsPage: React.FC<{ onBack: () => void, currentUser: User }> = ({ onBack, currentUser }) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
    const [tooltipData, setTooltipData] = useState<{
        show: boolean;
        x: number;
        y: number;
        data: any;
    }>({ show: false, x: 0, y: 0, data: null });
    const scrollRef = useRef<HTMLDivElement>(null);
    const leftColRef = useRef<HTMLDivElement>(null);
    const topHeaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => { 
        const load = async () => {
            setCollabs(await db.getCollaborators());
            setOperations(await db.getOperations());
        };
        load();
    }, []);

    const handleEfetivacao = async (c: Collaborator, value: 'SIM' | 'NÃO') => {
        try {
            const updated = { ...c, efetivacao: value };
            setCollabs(prev => prev.map(item => item.matricula === c.matricula ? updated : item));

            await db.updateCollaboratorEfetivacao(c.matricula, value);

            await db.addHistory({
                action: 'Decisão de Contrato',
                target: c.nome,
                user: currentUser.nome,
                date: new Date().toLocaleString('pt-BR'),
                type: 'update',
                details: `Contrato marcado para: ${value}`
            });
        } catch (error) {
            console.error("Erro ao salvar efetivação:", error);
            setCollabs(prev => prev.map(item => item.matricula === c.matricula ? c : item));
            alert("Não foi possível salvar a alteração. Tente novamente.");
        }
    };

    const canEdit = [UserRole.ADMIN, UserRole.MANAGER, UserRole.COORDINATOR, UserRole.SUPPORT].includes(currentUser.role);

    const filtered = collabs
    .filter(c => c.status === CollaboratorStatus.ATIVO)
    .filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(c => {
        const calc = getCollaboratorCalculations(c.dtEntradaProduto);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let daysRemaining45 = 999;
        if(calc.vence45 !== '-') {
            const parts45 = calc.vence45.split('/'); // DD/MM/YYYY
            const vDate45 = new Date(Number(parts45[2]), Number(parts45[1]) - 1, Number(parts45[0]));
            daysRemaining45 = Math.ceil((vDate45.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        let daysRemaining90 = 999;
        if(calc.vence90 !== '-') {
            const parts90 = calc.vence90.split('/'); // DD/MM/YYYY
            const vDate90 = new Date(Number(parts90[2]), Number(parts90[1]) - 1, Number(parts90[0]));
            daysRemaining90 = Math.ceil((vDate90.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        return { ...c, calc, daysRemaining45, daysRemaining90 };
    })
    .filter(c => c.calc.experiencia === "SIM")
    .sort((a, b) => {
        return a.daysRemaining90 - b.daysRemaining90;
    });

    const ganttDates = useMemo(() => {
        if (filtered.length === 0) return [];
        let minD = new Date();
        minD.setHours(0,0,0,0);
        let maxD = new Date();
        maxD.setHours(0,0,0,0);
        
        filtered.forEach(c => {
            let d1 = new Date();
            if (c.dtEntradaProduto) {
                if (c.dtEntradaProduto.includes('-')) {
                    d1 = new Date(c.dtEntradaProduto + 'T00:00:00');
                } else {
                    const parts = c.dtEntradaProduto.split('/');
                    if(parts.length === 3) d1 = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
                }
                d1.setHours(0,0,0,0);
                if (d1 < minD) minD = d1;
            }
            if (c.calc && c.calc.vence90 !== '-') {
                const p = c.calc.vence90.split('/');
                if(p.length === 3) {
                    const d2 = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                    d2.setHours(0,0,0,0);
                    if (d2 > maxD) maxD = d2;
                }
            }
        });
        
        const start = new Date(minD);
        start.setDate(start.getDate() - 5);
        const end = new Date(maxD);
        end.setDate(end.getDate() + 5);
        
        const dates = [];
        const curr = new Date(start);
        while(curr <= end) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, [filtered]);

    useEffect(() => {
        if (viewMode === 'gantt' && scrollRef.current) {
            const todayIdx = ganttDates.findIndex(d => d.toDateString() === new Date().toDateString());
            if (todayIdx !== -1) {
                const px = todayIdx * 40 - 200;
                scrollRef.current.scrollLeft = Math.max(0, px);
            }
        }
    }, [viewMode, ganttDates]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-full">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex flex-wrap items-center gap-4">
                  <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>
                  <h2 className="text-2xl font-bold text-gray-800">Contratos Vencendo</h2>
               </div>
               
               <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                   <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>
                       <AlignJustify size={16}/> Tabela
                   </button>
                   <button onClick={() => setViewMode('gantt')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-md transition-all ${viewMode === 'gantt' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>
                       <GanttChartSquare size={16}/> Gantt
                   </button>
               </div>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input className="pl-9 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto"><span className="font-bold">{filtered.length}</span> resultados</div>
                </div>
                {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px] text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="p-4 w-12"></th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Data de entrada</th>
                                <th className="p-4">Vencimento<br/>45 dias</th>
                                <th className="p-4">Dias Restantes</th>
                                <th className="p-4">Vencimento<br/>90 dias</th>
                                <th className="p-4">Dias Restantes</th>
                                <th className="p-4">Operação</th>
                                <th className="p-4 text-center whitespace-nowrap">Efetivar?</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(c => {
                                const opName = operations.find(o => o.id === c.operationId)?.nome || '-';
                                
                                const getStatus = (days: number) => {
                                    if (days < 0) return { color: 'text-red-700', bg: 'bg-red-100' };
                                    if (days <= 5) return { color: 'text-red-600', bg: 'bg-red-50' };
                                    if (days <= 15) return { color: 'text-orange-600', bg: 'bg-orange-50' };
                                    return { color: 'text-blue-600', bg: 'bg-blue-50' };
                                };
                                const st45 = getStatus(c.daysRemaining45);
                                const st90 = getStatus(c.daysRemaining90);

                                return (
                                    <tr key={c.matricula} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                                {getInitials(c.nome)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium min-w-[200px] break-words whitespace-normal">{c.nome}</td>
                                        <td className="p-4">{formatDateString(c.dtEntradaProduto)}</td>
                                        <td className="p-4 font-bold text-gray-800">{formatDateString(c.calc.vence45)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${st45.bg} ${st45.color}`}>
                                                {c.daysRemaining45 < 0 ? '-' : 
                                                 c.daysRemaining45 === 0 ? 'Vence Hoje' : 
                                                 `${c.daysRemaining45} dias`}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">{formatDateString(c.calc.vence90)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${st90.bg} ${st90.color}`}>
                                                {c.daysRemaining90 < 0 ? '-' : 
                                                 c.daysRemaining90 === 0 ? 'Vence Hoje' : 
                                                 `${c.daysRemaining90} dias`}
                                            </span>
                                        </td>
                                        <td className="p-4">{opName}</td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            {canEdit ? (
                                                <div className="flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleEfetivacao(c, 'SIM')}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${c.efetivacao === 'SIM' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                                                    >
                                                        SIM
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEfetivacao(c, 'NÃO')}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${c.efetivacao === 'NÃO' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                                                    >
                                                        NÃO
                                                    </button>
                                                </div>
                                            ) : (
                                                <Badge status={c.efetivacao || '-'} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                </table>
               </div>
               ) : (
                    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden flex w-full" style={{ height: 'calc(100vh - 220px)', minHeight: '300px' }}>
                        {/* Left Column (Fixed Width, Vertical Scroll Synced) */}
                        <div className="w-[300px] shrink-0 border-r border-gray-200 flex flex-col bg-white z-20">
                            <div className="h-[80px] shrink-0 border-b border-gray-200 flex items-center px-4 bg-white">
                                <span className="font-bold text-gray-500 text-xs uppercase tracking-wider">Colaborador / Data de Entrada</span>
                            </div>
                            <div className="flex-1 overflow-hidden custom-scrollbar" ref={leftColRef} onScroll={(e) => {
                                // sync scroll back just in case, though mostly we scroll the right pane
                                if (scrollRef.current) scrollRef.current.scrollTop = e.currentTarget.scrollTop;
                            }}>
                                {filtered.map(c => (
                                    <div key={c.matricula} className="h-[60px] border-b border-gray-100 px-4 flex items-center gap-3 bg-white hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200">
                                            {getInitials(c.nome)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-gray-800 truncate text-[13px]" title={c.nome}>{c.nome}</div>
                                            <div className="text-[11px] text-gray-500">{formatDateString(c.dtEntradaProduto)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Timeline (Scrollable) */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                            {/* Header (Horizontal Scroll Synced) */}
                            <div className="h-[80px] shrink-0 border-b border-gray-200 bg-white overflow-hidden flex flex-col relative" ref={topHeaderRef}>
                                <div style={{ width: `${ganttDates.length * 40}px` }} className="flex flex-col relative">
                                    <div className="h-[30px] flex items-center justify-center font-bold text-gray-800 text-sm border-b border-gray-100 sticky left-0 w-full" style={{ left: 0 }}>
                                        {ganttDates.length > 0 && ganttDates[Math.floor(ganttDates.length / 2)].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
                                    </div>
                                    <div className="h-[50px] flex relative">
                                        {ganttDates.map((date, i) => {
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            const dayNum = date.getDate();
                                            const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3);
                                            
                                            return (
                                                <div key={i} className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1" style={{ left: `${i * 40}px`, width: '40px' }}>
                                                    <div className={`flex flex-col items-center justify-center w-8 rounded ${isToday ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500'} pt-1 pb-1 z-20`}>
                                                        <span className={`text-[13px] font-bold leading-none ${isToday ? 'text-white' : 'text-gray-800'}`}>{dayNum}</span>
                                                        <span className={`text-[9px] font-medium uppercase mt-0.5 ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>{dayStr}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid & Bars */}
                            <div className="flex-1 overflow-auto custom-scrollbar relative" ref={scrollRef} onScroll={(e) => {
                                if (leftColRef.current) leftColRef.current.scrollTop = e.currentTarget.scrollTop;
                                if (topHeaderRef.current) topHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
                            }}>
                                <div style={{ width: `${ganttDates.length * 40}px` }} className="relative flex-1 min-h-full">
                                    {/* Vertical Lines */}
                                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none flex z-0 h-full">
                                        {ganttDates.map((date, i) => {
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            return (
                                                <div key={i} className={`h-full border-r border-gray-100 ${isWeekend ? 'bg-gray-50/50' : ''} ${isToday ? 'border-r-blue-400 border-dashed border-r-2 bg-blue-50/30 z-10 relative' : ''}`} style={{ width: '40px', flexShrink: 0 }}></div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Bars */}
                                    <div className="relative z-10 flex flex-col">
                                        {filtered.map((c, index) => {
                                            let d1;
                                            if (c.dtEntradaProduto.includes('-')) {
                                                d1 = new Date(c.dtEntradaProduto + 'T00:00:00');
                                            } else {
                                                const parts = c.dtEntradaProduto.split('/');
                                                d1 = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                                            }
                                            d1.setHours(0,0,0,0);
                                            
                                            let d45;
                                            if (c.calc.vence45 !== '-') {
                                                const p = c.calc.vence45.split('/');
                                                d45 = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                                            } else {
                                                d45 = new Date(d1);
                                                d45.setDate(d45.getDate() + 45);
                                            }
                                            d45.setHours(0,0,0,0);

                                            let d90;
                                            if (c.calc.vence90 !== '-') {
                                                const p = c.calc.vence90.split('/');
                                                d90 = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                                            } else {
                                                d90 = new Date(d1);
                                                d90.setDate(d90.getDate() + 90);
                                            }
                                            d90.setHours(0,0,0,0);
                                            
                                            if (!ganttDates.length) return null;
                                            
                                            const startDiff = Math.floor((d1.getTime() - ganttDates[0].getTime()) / (1000 * 60 * 60 * 24));
                                            const end45Diff = Math.floor((d45.getTime() - ganttDates[0].getTime()) / (1000 * 60 * 60 * 24));
                                            const end90Diff = Math.floor((d90.getTime() - ganttDates[0].getTime()) / (1000 * 60 * 60 * 24));
                                            
                                            const leftPx = startDiff * 40;
                                            const widthPx = Math.max(40, (end90Diff - startDiff + 1) * 40);
                                            
                                            const elapsedDays = 90 - c.daysRemaining90;
                                            
                                            let baseColorHex = '#3DD598'; // green
                                            
                                            if (elapsedDays >= 75) {
                                                baseColorHex = '#FFC043'; // yellow
                                            } else if (elapsedDays >= 45) {
                                                baseColorHex = '#FFC043'; // yellow
                                            }
                                            
                                            const isLate = c.daysRemaining90 < 0;
                                            if (isLate) {
                                                baseColorHex = '#EF4444'; // red
                                            }
                                            
                                            const pct = Math.min(100, Math.max(0, (elapsedDays / 90) * 100));

                                            const left45Px = end45Diff * 40 + 20;
                                            const left90Px = end90Diff * 40 + 20;

                                            return (
                                                <div key={c.matricula} className="h-[60px] border-b border-gray-100/50 flex items-center relative shrink-0 w-full hover:bg-gray-50/50 transition-colors" onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setTooltipData({
                                                        show: true,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top,
                                                        data: c
                                                    });
                                                }} onMouseLeave={() => setTooltipData(prev => ({ ...prev, show: false }))}>
                                                    
                                                    {/* 45 Day Marker */}
                                                    {left45Px > 0 && left45Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-0 bottom-0 border-l border-brand-300 border-dashed z-0" style={{ left: `${left45Px}px` }}>
                                                        </div>
                                                    )}

                                                    {/* 90 Day Marker */}
                                                    {left90Px > 0 && left90Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-0 bottom-0 border-l border-red-300 border-dashed z-0" style={{ left: `${left90Px}px` }}>
                                                        </div>
                                                    )}

                                                    <div 
                                                        className="absolute top-1/2 -translate-y-1/2 flex items-center z-20 cursor-pointer rounded-full shadow-sm overflow-hidden" 
                                                        style={{ left: `${leftPx}px`, width: `${widthPx}px`, height: '24px', backgroundColor: `${baseColorHex}80` }}
                                                    >
                                                        <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: baseColorHex }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-gray-800">{Math.round(pct)}%</span>
                                                        </div>
                                                    </div>

                                                    {/* 45 Day Icon */}
                                                    {left45Px > 0 && left45Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ left: `${left45Px - 8}px` }} title="Vencimento 45 dias">
                                                            <div className="w-[16px] h-[16px] bg-[#FFC043] text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm">!</div>
                                                        </div>
                                                    )}

                                                    {/* 90 Day Icon */}
                                                    {left90Px > 0 && left90Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ left: `${left90Px - 8}px` }} title="Vencimento 90 dias">
                                                            <div className="w-[16px] h-[16px] bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm">!</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {filtered.length === 0 && (
                                            <div className="text-center text-gray-400 py-12 w-full absolute left-0">
                                                Nenhum contrato encontrado.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            {tooltipData.show && tooltipData.data && (
                <div 
                    className="fixed bg-gray-900 text-white text-xs rounded-xl shadow-2xl p-4 w-[250px] z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+15px)] transition-opacity duration-150"
                    style={{ left: `${Math.min(window.innerWidth - 130, Math.max(130, tooltipData.x))}px`, top: `${tooltipData.y}px` }}
                >
                    <div className="font-bold text-sm mb-1">{tooltipData.data.nome}</div>
                    <div className="text-gray-400 mb-2 border-b border-gray-700 pb-2">Entrada: {tooltipData.data.dtEntradaProduto}</div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vencimento 45d:</span>
                            <span className="font-bold text-brand-300">{tooltipData.data.calc.vence45}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Restante (45):</span>
                            <span className="font-bold">{tooltipData.data.daysRemaining45 < 0 ? 'Venceu' : `${tooltipData.data.daysRemaining45} dias`}</span>
                        </div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-gray-700">
                            <span className="text-gray-400">Vencimento 90d:</span>
                            <span className="font-bold text-red-300">{tooltipData.data.calc.vence90}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Restante (90):</span>
                            <span className="font-bold">{tooltipData.data.daysRemaining90 < 0 ? 'Venceu' : `${tooltipData.data.daysRemaining90} dias`}</span>
                        </div>
                    </div>
                </div>
            )}
           </div>
      </div>
    );
}


const BirthdaysPage = ({ onBack }: any) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
      const load = async () => {
          setCollabs(await db.getCollaborators());
          setIlhas(await db.getIlhas());
      }
      load();
  }, []);

  const filtered = collabs.filter(c => {
      if(!c.dtNasc) return false;
      const m = parseInt(c.dtNasc.split('-')[1]) - 1;
      return m === month;
  }).sort((a, b) => {
      const dayA = parseInt(a.dtNasc.split('-')[2]);
      const dayB = parseInt(b.dtNasc.split('-')[2]);
      return dayA - dayB;
  });

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
      <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>
                  <h2 className="text-2xl font-bold text-gray-800">Aniversariantes</h2>
              </div>
              <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <select 
                        className="px-3 py-1.5 bg-transparent text-sm font-medium outline-none"
                        value={month} 
                        onChange={e => setMonth(parseInt(e.target.value))}
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
              </div>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                         <tr>
                             <th className="p-4 w-24 text-center">Dia</th>
                             <th className="p-4">Nome</th>
                             <th className="p-4">Ilha</th>
                             <th className="p-4">Data Completa</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {filtered.map(c => {
                             const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                             const day = c.dtNasc ? c.dtNasc.split('-')[2] : '--';
                             return (
                                 <tr key={c.matricula} className="hover:bg-gray-50">
                                     <td className="p-4 flex justify-center">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-md flex items-center justify-center font-bold text-lg">
                                            {day}
                                        </div>
                                     </td>
                                     <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                     <td className="p-4 text-xs">{ilhaName}</td>
                                     <td className="p-4">{formatDateString(c.dtNasc)}</td>
                                 </tr>
                             )
                         })}
                         {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum aniversariante neste mês.</td></tr>}
                     </tbody>
                </table>
           </div>
      </div>
  )
}

const AvisoPrevioPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [today] = useState(new Date());

    useEffect(() => { 
        const load = async () => {
            setCollabs(await db.getCollaborators());
        };
        load();
    }, []);

    const filtered = collabs.filter(c => c.status === CollaboratorStatus.AVISO_PREVIO).map(c => {
        let daysLeft = 0;
        if(c.dataFim) {
            const parts = c.dataFim.split('-');
            const endDate = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
            const now = new Date(); now.setHours(0,0,0,0);
            const diffTime = endDate.getTime() - now.getTime();
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return { ...c, daysLeft };
    }).sort((a,b) => a.daysLeft - b.daysLeft);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
                <h2 className="text-2xl font-bold text-gray-800">Colaboradores em Aviso Prévio</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                         <tr>
                             <th className="p-4 w-16"></th>
                             <th className="p-4">Nome</th>
                             <th className="p-4">Data Final</th>
                             <th className="p-4">Dias Restantes</th>
                             <th className="p-4">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {filtered.map(c => (
                             <tr key={c.matricula} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                 <td className="p-4">
                                     <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                         {getInitials(c.nome)}
                                     </div>
                                 </td>
                                 <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                 <td className="p-4 font-bold text-gray-800">{formatDateString(c.dataFim)}</td>
                                 <td className="p-4">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                                         c.daysLeft <= 5 ? 'bg-red-100 text-red-700' : 
                                         c.daysLeft <= 15 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                     }`}>
                                         {c.daysLeft} dias
                                     </span>
                                 </td>
                                 <td className="p-4"><Badge status={c.status} /></td>
                             </tr>
                         ))}
                         {filtered.length === 0 && (
                             <tr>
                                 <td colSpan={5} className="p-8 text-center text-gray-400">
                                     <CheckCircle className="mx-auto mb-2 opacity-50" size={24}/>
                                     Nenhum colaborador em aviso prévio no momento.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
            </div>
        </div>
    );
}

const VacationManagementPage = ({ currentUser, onBack, onViewDetails }: any) => {
    // ... same as original ...
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
        const [activeTab, setActiveTab] = useState<'mapa' | 'historico'>('mapa');
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyYear, setHistoryYear] = useState('');
    const [historyMonth, setHistoryMonth] = useState('');
    const [historySearch, setHistorySearch] = useState('');
    
    
    
    useEffect(() => { 
        const load = async () => {
            setCollabs(await db.getCollaborators());
            setIlhas(await db.getIlhas());
            setHistoryData(await db.getVacationHistory());
        };
        load();
    }, []);

    
    const getDaysUntilReturn = (endDateStr?: string) => {
        if (!endDateStr) return 999;
        const parts = endDateStr.split('-');
        const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        end.setDate(end.getDate() + 1); 
        end.setHours(0,0,0,0);
        
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const diffTime = end.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const activeVacations = collabs.filter(c => {
        const hasVacationData = c.status === CollaboratorStatus.FERIAS || 
            (c.feriasInicio && c.feriasFim && c.feriasInicio !== '' && c.feriasFim !== '');
        if (!hasVacationData) return false;
        
        const daysUntil = getDaysUntilReturn(c.feriasFim);
        return daysUntil >= 0;
    });
    
    
    
    
  const filteredHistory = historyData.filter(h => {
      const c = collabs.find(col => col.matricula === h.collaborator_matricula);
      if (!c) return false;
      
      const startParts = h.start_date.split('-');
      if (historyYear && startParts[0] !== historyYear) return false;
      if (historyMonth && startParts[1] !== historyMonth) return false;
      
      if (historySearch) {
          const s = historySearch.toLowerCase();
          return c.nome.toLowerCase().includes(s) || c.matricula.toLowerCase().includes(s);
      }
      return true;
  });
  
    
  return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
                  <h2 className="text-2xl font-bold text-gray-800">Controle de Férias</h2>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{activeVacations.length}</span>
              </div>
           </div>
           <div className="flex gap-4 border-b border-gray-200">
               <button 
                   className={`pb-2 px-1 text-sm font-bold transition-colors ${activeTab === 'mapa' ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                   onClick={() => setActiveTab('mapa')}
               >
                   Mapa de Férias
               </button>
               <button 
                   className={`pb-2 px-1 text-sm font-bold transition-colors ${activeTab === 'historico' ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                   onClick={() => setActiveTab('historico')}
               >
                   Histórico de Férias
               </button>
           </div>

           <div>
              {activeTab === 'mapa' ? (
                <>
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Sun size={18} className="text-orange-500" />
                        Mapa de Férias (Ativas e Programadas)
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-orange-50 text-orange-800 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 w-16"></th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Ilha</th>
                                    <th className="p-4">Início</th>
                                    <th className="p-4">Fim</th>
                                    <th className="p-4">Retorno Previsto</th>
                                    <th className="p-4 text-center">Status Retorno</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeVacations.map(c => {
                                    const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                                    const daysUntil = getDaysUntilReturn(c.feriasFim);
                                    const isAlert = false;

                                    return (
                                        <tr key={c.matricula} className={`hover:bg-gray-50 cursor-pointer transition-colors ${isAlert ? 'bg-red-50 hover:bg-red-100' : ''}`} onClick={() => onViewDetails && onViewDetails(c)}>
                                            <td className="p-4">
                                                 <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                                    {getInitials(c.nome)}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                            <td className="p-4 text-xs">{ilhaName}</td>
                                            <td className="p-4">{formatDateString(c.feriasInicio)}</td>
                                            <td className="p-4">{formatDateString(c.feriasFim)}</td>
                                            <td className="p-4 font-bold text-green-600">
                                                {c.feriasFim ? addDays(c.feriasFim, 1) : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {isAlert ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold animate-pulse">
                                                        <AlertTriangle size={12} />
                                                        Em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {daysUntil === 999 ? '-' : daysUntil < 0 ? 'Retornou' : `Em ${daysUntil} dias`}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activeVacations.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-gray-400 text-xs">
                                            Nenhuma férias mapeada no momento.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                    </table>
                </div>
                </>
              ) : (
                <>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <History size={18} className="text-gray-500" />
                            Histórico de Férias
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{filteredHistory.length}</span>
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar nome ou matrícula..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>
                            <select 
                                value={historyYear}
                                onChange={(e) => setHistoryYear(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">Ano</option>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                            <select 
                                value={historyMonth}
                                onChange={(e) => setHistoryMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">Mês</option>
                                <option value="01">Janeiro</option>
                                <option value="02">Fevereiro</option>
                                <option value="03">Março</option>
                                <option value="04">Abril</option>
                                <option value="05">Maio</option>
                                <option value="06">Junho</option>
                                <option value="07">Julho</option>
                                <option value="08">Agosto</option>
                                <option value="09">Setembro</option>
                                <option value="10">Outubro</option>
                                <option value="11">Novembro</option>
                                <option value="12">Dezembro</option>
                            </select>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 w-16"></th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Ilha</th>
                                    <th className="p-4">Início</th>
                                    <th className="p-4">Fim</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistory.map(h => {
                                    const c = collabs.find(col => col.matricula === h.collaborator_matricula);
                                    const nome = c ? c.nome : 'Desconhecido';
                                    const ilhaName = c ? (ilhas.find(i => i.id === c.ilhaId)?.nome || '-') : '-';
                                    return (
                                        <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                                    {getInitials(nome)}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-gray-900">{nome}</td>
                                            <td className="p-4 text-xs">{ilhaName}</td>
                                            <td className="p-4">{formatDateString(h.start_date)}</td>
                                            <td className="p-4">{formatDateString(h.end_date)}</td>
                                        </tr>
                                    );
                                })}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-400 text-xs">
                                            Nenhum histórico encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
              )}
           </div>

           
        </div>
    );
}
const AfastadosPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

    useEffect(() => {
        const load = async () => {
            setCollabs(await db.getCollaborators());
            setIlhas(await db.getIlhas());
            setSupervisors(await db.getSupervisors());
        }
        load();
    }, []);

    const filtered = collabs.filter(c =>
        c.status === CollaboratorStatus.AFASTADO ||
        c.status === CollaboratorStatus.LICENCA_MATERNIDADE
    );

    const countAfastado = filtered.filter(c => c.status === CollaboratorStatus.AFASTADO).length;
    const countLicenca = filtered.filter(c => c.status === CollaboratorStatus.LICENCA_MATERNIDADE).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Afastados</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg"><Activity size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase">Afastamento Médico/INSS</p>
                        <h3 className="text-2xl font-bold text-gray-900">{countAfastado}</h3>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-pink-100 text-pink-600 rounded-lg"><UserIcon size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase">Licença Maternidade</p>
                        <h3 className="text-2xl font-bold text-gray-900">{countLicenca}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                         <tr>
                             <th className="p-4 w-16"></th>
                             <th className="p-4">Nome</th>
                             <th className="p-4">Status</th>
                             <th className="p-4">Data Início</th>
                             <th className="p-4">Ilha</th>
                             <th className="p-4">Supervisor</th>
                             <th className="p-4 text-right">Ações</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {filtered.map(c => {
                             const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                             const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                             return (
                                 <tr key={c.matricula} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                     <td className="p-4">
                                         <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                             {getInitials(c.nome)}
                                         </div>
                                     </td>
                                     <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                     <td className="p-4"><Badge status={c.status} /></td>
                                     <td className="p-4 font-bold text-gray-800">{formatDateString(c.dataAfastamento)}</td>
                                     <td className="p-4 text-xs">{ilha}</td>
                                     <td className="p-4 text-xs">{sup}</td>
                                     <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm"><Eye size={16}/></Button>
                                     </td>
                                 </tr>
                             );
                         })}
                          {filtered.length === 0 && (
                             <tr>
                                 <td colSpan={7} className="p-8 text-center text-gray-400">
                                     <CheckCircle className="mx-auto mb-2 opacity-50" size={24}/>
                                     Nenhum colaborador afastado no momento.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
            </div>
        </div>
    );
}

const DesligadosPage = ({ onBack, onViewDetails }: any) => {
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
            "Data de Admissão": c.dataInicio ? formatDateString(c.dataInicio) : '-',
            "Data de Desligamento": c.dataFim ? formatDateString(c.dataFim) : '-',
            "Ilha": ilhas.find(i => i.id === c.ilhaId)?.nome || '-',
            "Supervisor": supervisors.find(s => s.id === c.supervisorId)?.nome || '-',
            "Motivo do Desligamento": c.motivoDesligamento || '-',
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
                                        <Button variant="ghost" size="sm"><Eye size={16}/></Button>
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

const App = () => {
    // ... same as original ...
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [dataVersion, setDataVersion] = useState(0); 
  const refreshData = () => setDataVersion(v => v + 1);

  const [dropdownOptions, setDropdownOptions] = useState({
      coordinators: [] as {value: string, label: string}[],
      supervisors: [] as {value: string, label: string}[],
      clients: [] as {value: string, label: string}[],
      operations: [] as {value: string, label: string, clientId?: string}[]
  });

  useEffect(() => {
      const runChecks = async () => {
          await db.processDueTasks();
          await db.checkVacationReturns();
          await db.checkAvisoPrevioEnds();
      };
      runChecks();
  }, []);

  useEffect(() => {
      const load = async () => {
          const [c, s, cli, op] = await Promise.all([
              db.getCoordinators(),
              db.getSupervisors(),
              db.getClients(),
              db.getOperations()
          ]);
          setDropdownOptions({
              coordinators: c.map(x => ({value: x.id, label: x.nome})),
              supervisors: s.map(x => ({value: x.id, label: x.nome})),
              clients: cli.map(x => ({value: x.id, label: x.nome})),
              operations: op.map(x => ({value: x.id, label: x.nome, clientId: x.clientId}))
          });
      };
      load();
  }, [dataVersion]);

  const handleLogin = (u: User) => {
    setCurrentUser(u);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const getPageTitle = (page: string) => {
      switch(page) {
          case 'dashboard': return 'Visão Geral';
          case 'collaborators': return 'Gestão de Colaboradores';
          case 'turnover': return 'Turnover';
          case 'organogram': return 'Organograma Operacional';
          case 'birthdays': return 'Aniversariantes';
          case 'desligados': return 'Colaboradores Desligados';
          case 'expiring': return 'Contratos Vencendo';
          case 'aviso_previo': return 'Aviso Prévio';
          case 'vacation': return 'Gestão de Férias';
          case 'afastados': return 'Afastados / Licenças';
          case 'scheduled_tasks': return 'Tarefas Agendadas';
          case 'coordinators': return 'Coordenadores';
          case 'supervisors': return 'Supervisores';
          case 'clients': return 'Clientes';
          case 'operations': return 'Operações';
          case 'ilhas': return 'Ilhas';
          case 'users': return 'Usuários do Sistema';
          case 'import': return 'Importar Dados';
          case 'bulk_update': return 'Update em Massa';
          case 'history': return 'Histórico de Atividades';
          case 'reset': return 'Resetar Dados';
          case 'about': return 'Sobre o Sistema';
          default: return 'Sistema MOP';
      }
  };

  const renderContent = () => {
    const commonProps = { onRefresh: refreshData, currentUser: currentUser! };

    switch (currentPage) {
      case 'dashboard': return <DashboardPage currentUser={currentUser!} onNavigate={setCurrentPage} key={dataVersion} />;
      case 'turnover': return <TurnoverPage key={dataVersion} />;
      case 'organogram': return <OrganogramPage key={dataVersion} />;
      case 'collaborators': 
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <CollaboratorsPage key={dataVersion} onViewDetails={setSelectedCollab} {...commonProps} />;
      case 'coordinators': return <CrudPage key={dataVersion} title="Coordenadores" data={db.getCoordinators()} onSave={db.saveCoordinator.bind(db)} onDelete={db.deleteCoordinator.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}]} {...commonProps} />;
      case 'supervisors': return <CrudPage key={dataVersion} title="Supervisores" data={db.getSupervisors()} onSave={db.saveSupervisor.bind(db)} onDelete={db.deleteSupervisor.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'coordinatorIds', label:'Coordenadores', type:'multiselect', options: dropdownOptions.coordinators }]} {...commonProps} />;
      case 'clients': return <CrudPage key={dataVersion} title="Clientes" data={db.getClients()} onSave={db.saveClient.bind(db)} onDelete={db.deleteClient.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'logo', label:'URL da Logo', type:'text'}]} {...commonProps} />;
      case 'operations': return <CrudPage key={dataVersion} title="Operações" data={db.getOperations()} onSave={db.saveOperation.bind(db)} onDelete={db.deleteOperation.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'clientId', label:'Cliente', type:'select', options: dropdownOptions.clients }]} {...commonProps} />;
      case 'ilhas': return <CrudPage key={dataVersion} title="Ilhas" data={db.getIlhas()} onSave={db.saveIlha.bind(db)} onDelete={db.deleteIlha.bind(db)} schema={[
        {key:'nome', label:'Nome', type:'text'},
        {key:'clientId', label:'Cliente', type:'select', options: dropdownOptions.clients },
        {key:'operationId', label:'Operação', type:'select', options: (currentItem: any) => currentItem.clientId ? dropdownOptions.operations.filter(o => o.clientId === currentItem.clientId) : dropdownOptions.operations },
        {key:'coordinatorIds', label:'Coordenadores', type:'multiselect', options: dropdownOptions.coordinators },
        {key:'supervisorIds', label:'Supervisores', type:'multiselect', options: dropdownOptions.supervisors }
      ]} {...commonProps} />;
      case 'users': return <UsersPage key={dataVersion} {...commonProps} />;
      case 'history': return <HistoryPage key={dataVersion} />;
      case 'birthdays': return <BirthdaysPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} />;
      case 'desligados': 
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <DesligadosPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'expiring': return <ExpiringContractsPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} currentUser={currentUser!} />;
      case 'aviso_previo': 
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <AvisoPrevioPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'vacation': 
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <VacationManagementPage currentUser={currentUser!} key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'afastados':
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <AfastadosPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'scheduled_tasks': return <ScheduledTasksPage key={dataVersion} />;
      case 'import': return <ImportPage key={dataVersion} {...commonProps} />;
      case 'bulk_update': return <BulkUpdatePage key={dataVersion} {...commonProps} />;
      case 'reset': return <ResetDataPage key={dataVersion} />;
      case 'about': return <AboutPage key={dataVersion} />;
      default: return <DashboardPage currentUser={currentUser!} onNavigate={setCurrentPage} key={dataVersion} />;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const isViewer = currentUser.role === UserRole.VIEWER;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  // Grupo que inclui todos MENOS visualizador (Admin, Gerente, Coord, Sup, RH)
  const isManagementOrRh = currentUser.role !== UserRole.VIEWER;

  return (
    <div className="flex h-screen bg-bg text-fg font-sans">
       <aside className="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-10">
          <div className="h-16 flex items-center px-6 border-b border-border">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold mr-3">M</div>
             <span className="font-bold text-lg tracking-tight text-fg">MOP System</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <nav className="space-y-1">
                <div className="pb-2">
                   <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Principal</p>
                   {/* Todos visualizam */}
                   <NavItem icon={LayoutDashboard} label="Visão Geral" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
                </div>
                
                <div className="pt-2 pb-2">
                   <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Gestão</p>
                   {/* Todos visualizam Colaboradores */}
                   <NavItem icon={Users} label="Colaboradores" active={currentPage === 'collaborators'} onClick={() => { setCurrentPage('collaborators'); setSelectedCollab(null); }} />
                   
                   {/* Organograma: Visualizar para todos */}
                   <NavItem icon={Network} label="Organograma" active={currentPage === 'organogram'} onClick={() => setCurrentPage('organogram')} />
                   
                   {/* Turnover: Apenas não-visualizadores */}
                   {isManagementOrRh && (
                       <NavItem icon={TrendingUp} label="Turnover" active={currentPage === 'turnover'} onClick={() => setCurrentPage('turnover')} />
                   )}
                </div>

                <div className="pt-2 pb-2">
                   <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">RH</p>
                   {/* Aniversariantes: Todos visualizam */}
                   <NavItem icon={Cake} label="Aniversariantes" active={currentPage === 'birthdays'} onClick={() => setCurrentPage('birthdays')} />
                   <NavItem icon={UserX} label="Desligados" active={currentPage === 'desligados'} onClick={() => setCurrentPage('desligados')} />
                   
                   {/* Outros itens de RH: Apenas não-visualizadores */}
                   {isManagementOrRh && (
                       <>
                           <NavItem icon={AlertCircle} label="Vencimento Contratos" active={currentPage === 'expiring'} onClick={() => setCurrentPage('expiring')} />
                           <NavItem icon={Sun} label="Férias" active={currentPage === 'vacation'} onClick={() => setCurrentPage('vacation')} />
                           <NavItem icon={UserMinus} label="Aviso Prévio" active={currentPage === 'aviso_previo'} onClick={() => setCurrentPage('aviso_previo')} />
                           <NavItem icon={Stethoscope} label="Afastados / Licenças" active={currentPage === 'afastados'} onClick={() => setCurrentPage('afastados')} />
                       </>
                   )}
                </div>

                {isAdmin && (
                    <>
                        <div className="pt-2 pb-2">
                            <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Cadastros</p>
                            <NavItem icon={Building2} label="Clientes" active={currentPage === 'clients'} onClick={() => setCurrentPage('clients')} />
                            <NavItem icon={Globe} label="Operações" active={currentPage === 'operations'} onClick={() => setCurrentPage('operations')} />
                            <NavItem icon={MapPin} label="Ilhas" active={currentPage === 'ilhas'} onClick={() => setCurrentPage('ilhas')} />
                            <NavItem icon={Briefcase} label="Coordenadores" active={currentPage === 'coordinators'} onClick={() => setCurrentPage('coordinators')} />
                            <NavItem icon={UserCog} label="Supervisores" active={currentPage === 'supervisors'} onClick={() => setCurrentPage('supervisors')} />
                        </div>

                        <div className="pt-2 pb-2">
                            <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Administração</p>
                            <NavItem icon={ShieldCheck} label="Usuários" active={currentPage === 'users'} onClick={() => setCurrentPage('users')} />
                        </div>

                        <div className="pt-2 pb-2">
                            <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Sistema</p>
                            <NavItem icon={Calendar} label="Tarefas Agendadas" active={currentPage === 'scheduled_tasks'} onClick={() => setCurrentPage('scheduled_tasks')} />
                            <NavItem icon={Upload} label="Importar Dados" active={currentPage === 'import'} onClick={() => setCurrentPage('import')} />
                            <NavItem icon={ListChecks} label="Update em Massa" active={currentPage === 'bulk_update'} onClick={() => setCurrentPage('bulk_update')} />
                            <NavItem icon={History} label="Histórico" active={currentPage === 'history'} onClick={() => setCurrentPage('history')} />
                            <NavItem icon={AlertTriangle} label="Resetar Dados" active={currentPage === 'reset'} onClick={() => setCurrentPage('reset')} />
                        </div>
                    </>
                )}

                <div className="pt-2 pb-2">
                   <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Ajuda</p>
                   <NavItem icon={Info} label="Sobre" active={currentPage === 'about'} onClick={() => setCurrentPage('about')} />
                </div>
             </nav>
          </div>
          <div className="p-4 border-t border-border bg-surface-alt">
             <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-1">
                     {currentUser.nome.charAt(0)}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-xs font-bold text-fg truncate">{currentUser.nome}</p>
                     <p className="text-[10px] text-fg-muted truncate">{currentUser.email}</p>
                 </div>
             </div>
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error">
                 <LogOut size={14} /> Sair
             </button>
          </div>
       </aside>

       <main className="flex-1 ml-64 overflow-y-auto h-full bg-bg flex flex-col relative custom-scrollbar">
          <Header title={getPageTitle(currentPage)} user={currentUser}>
              <NotificationCenter />
          </Header>
          <div className="p-6 md:p-8 max-w-[1600px] w-full mx-auto flex-1">
              {renderContent()}
          </div>
       </main>
    </div>
  );
};

export default App;
