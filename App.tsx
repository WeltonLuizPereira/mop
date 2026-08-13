
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Users, UserCog, Building2, Globe, MapPin, Briefcase, 
  LogOut, Menu, X, Plus, Edit2, ChevronLeft, ChevronRight, ChevronDown, Search, Phone,
  ShieldCheck, Upload, FileSpreadsheet, Trash2, CheckCircle, AlertCircle,
  Bell, Info, AlertTriangle, Gift, ArrowUpRight, ArrowDownRight, Eye,
  FileDown, Filter, CalendarDays, Wallet, Sun, Calendar as CalendarIcon, Clock, History, FileText, Check, XCircle, Lightbulb, Save,
  User as UserIcon, Cake, Mail, Hash, BriefcaseBusiness, CalendarClock, UserPlus, Loader2, ArrowLeft, Activity, File,
  TrendingUp, TrendingDown, MoreHorizontal, BarChart3, PieChart, Timer, UserMinus, LineChart, ListChecks, Calendar, Network, Maximize, AlignJustify, GanttChartSquare,
  MousePointer2, Hand, Stethoscope, UserX, Key, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell, Line, ComposedChart
} from 'recharts';
import { 
  User, UserRole, Collaborator, Coordinator, Supervisor, 
  Client, Operation, Ilha, CollaboratorStatus, EntityStatus, HistoryLog, ScheduledTask 
} from './types';
import { db } from './services/mockDb';
import { getCollaboratorCalculations, generateId, formatTime, parseExcelTime, parseExcelDate, calculateDaysDiff, formatDate, formatDateString, addDays, getInitials } from './utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

declare const __APP_VERSION__: string;
declare const __UPDATE_DATE__: string;

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-1 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-primary-tonal text-primary hover:bg-primary/20",
    danger: "bg-error/10 text-error hover:bg-error/20 border border-error/30",
    "solid-danger": "bg-error text-white hover:opacity-90 shadow-1 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-fg-muted hover:text-fg hover:bg-surface-alt"
  };
  return (
    <button type="button" className={`${base} ${styles[variant as keyof typeof styles]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label}</label>}
    <input
      className={`w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-fg ${className}`}
      {...props}
    />
  </div>
);

const Select = ({ label, children, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label}</label>}
    <select
      className={`w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-fg ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

const Badge = ({ status }: { status: string }) => {
  let color = 'bg-surface-alt text-fg-muted';
  if (status === 'ATIVO' || status === 'SIM' || status === 'APROVADO') color = 'bg-success/15 text-success';
  if (status === 'DESLIGADO' || status === 'INATIVO' || status === 'REJEITADO' || status === 'NÃO') color = 'bg-error/15 text-error';
  if (status === 'FÉRIAS' || status === 'PENDENTE') color = 'bg-warning/20 text-fg';
  if (status === 'AVISO PRÉVIO') color = 'bg-warning/30 text-fg border border-warning/50';
  if (status === 'AFASTADO') color = 'bg-error/10 text-error border border-error/30';
  if (status === 'LICENÇA MATERNIDADE') color = 'bg-surface-alt text-fg-muted border border-border-strong';

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {status}
    </span>
  );
};

const MultiSelect = ({ label, options, value, onChange }: { 
  label: string, 
  options: {value: string, label: string}[], 
  value: string[], 
  onChange: (val: string[]) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    const newValue = value.includes(val) 
      ? value.filter(v => v !== val)
      : [...value, val];
    onChange(newValue);
  };

  const toggleAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange(filteredOptions.map(opt => opt.value));
    }
  };

  const clearAll = () => onChange([]);
  
  const displayText = value.length === 0 
    ? 'Todos' 
    : value.length === 1 
      ? options.find(o => o.value === value[0])?.label || value[0]
      : `${value.length} selecionados`;

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative group" ref={containerRef}>
      <label className="text-[10px] font-bold text-fg-muted uppercase mb-1 block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 bg-surface-alt border rounded-lg text-xs focus:ring-1 focus:ring-primary flex justify-between items-center h-[34px] transition-colors ${isOpen ? 'border-primary ring-1 ring-primary bg-surface' : 'border-transparent hover:bg-border/30'}`}
      >
        <span className="truncate block max-w-[90%] text-fg font-medium">{displayText}</span>
        <ChevronDown size={14} className={`text-fg-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mop-pop-in absolute top-full left-0 w-full mt-1 bg-surface border border-border rounded-lg shadow-2 z-50 flex flex-col min-w-[200px]">
           <div className="p-2 border-b border-border">
               <input
                   type="text"
                   placeholder="Buscar..."
                   className="w-full px-2 py-1.5 bg-surface text-fg border border-primary rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
               />
               <div className="flex justify-between items-center mt-2 px-1">
                   <div
                       className="flex items-center gap-2 cursor-pointer group/select"
                       onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                   >
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.length === filteredOptions.length && filteredOptions.length > 0 ? 'bg-primary border-primary' : 'border-border-strong bg-surface'}`}>
                           {value.length === filteredOptions.length && filteredOptions.length > 0 && <Check size={10} className="text-white" />}
                       </div>
                       <span className="text-xs text-primary font-medium group-hover/select:underline">Selecionar todos</span>
                   </div>
                   <span
                       className="text-[10px] uppercase font-bold text-fg-subtle cursor-pointer hover:text-fg transition-colors"
                       onClick={(e) => { e.stopPropagation(); clearAll(); }}
                   >
                       Limpar
                   </span>
               </div>
           </div>
           <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => {
                    const isSelected = value.includes(opt.value);
                    return (
                    <div key={opt.value} className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary-tonal text-primary' : 'hover:bg-surface-alt text-fg'}`} onClick={() => toggleOption(opt.value)}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border-strong bg-surface'}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs">{opt.label}</span>
                    </div>
                 )})
              ) : (
                <div className="px-3 py-3 text-center text-xs text-fg-subtle">Nenhum resultado</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'bg-primary-tonal text-primary' : 'text-fg-muted hover:bg-surface-alt hover:text-fg'
    }`}
  >
    <Icon size={18} className={active ? 'text-primary' : 'text-fg-subtle group-hover:text-fg-muted'} />
    {label}
  </button>
);

const NotificationCenter = () => {
    // ... same as original ...
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<{
        birthdays: Collaborator[],
        expiring: (Collaborator & { vence: string })[],
        avisoEnding: Collaborator[],
        recentHistory: HistoryLog[]
    }>({ birthdays: [], expiring: [], avisoEnding: [], recentHistory: [] });
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const loadNotifications = async () => {
            const collabs = await db.getCollaborators();
            const today = new Date();
            const todayStr = today.toLocaleDateString('pt-BR'); 
            const d = today.getDate();
            const m = today.getMonth() + 1;

            const todaysBirthdays = collabs.filter(c => {
                if (!c.dtNasc || c.status !== CollaboratorStatus.ATIVO) return false;
                const parts = c.dtNasc.split('-'); 
                const bDay = parseInt(parts[2]);
                const bMonth = parseInt(parts[1]);
                return bDay === d && bMonth === m;
            });

            const todaysExpiring = collabs.filter(c => {
                if (c.status !== CollaboratorStatus.ATIVO) return false;
                const calc = getCollaboratorCalculations(c.dtEntradaProduto);
                return calc.vence === todayStr;
            }).map(c => ({
                ...c,
                vence: getCollaboratorCalculations(c.dtEntradaProduto).vence
            }));

            const todaysAvisoEnding = collabs.filter(c => {
                if (c.status !== CollaboratorStatus.AVISO_PREVIO || !c.dataFim) return false;
                return formatDateString(c.dataFim) === todayStr;
            });

            const fullHistory = await db.getHistory();
            const history = fullHistory.slice(0, 5);

            setNotifications({
                birthdays: todaysBirthdays,
                expiring: todaysExpiring,
                avisoEnding: todaysAvisoEnding,
                recentHistory: history
            });
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, [isOpen]); 

    const totalAlerts = notifications.birthdays.length + notifications.expiring.length + notifications.avisoEnding.length;

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="relative p-2 rounded-full text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
                <Bell size={20} />
                {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">Central de Notificações</h3>
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">Hoje</span>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {(notifications.birthdays.length > 0 || notifications.expiring.length > 0 || notifications.avisoEnding.length > 0) && (
                            <div className="p-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Atenção Hoje</p>
                                
                                {notifications.avisoEnding.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors bg-orange-50/50">
                                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                            <UserMinus size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Aviso Prévio Finalizando</p>
                                            <p className="text-xs text-gray-500">Último dia de <span className="font-semibold">{c.nome}</span>.</p>
                                            <p className="text-[10px] text-orange-600 font-medium mt-1">Realizar desligamento no sistema.</p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.birthdays.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="bg-pink-100 text-pink-600 p-2 rounded-lg">
                                            <Gift size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Aniversariante do Dia!</p>
                                            <p className="text-xs text-gray-500">Parabéns para <span className="font-semibold">{c.nome}</span></p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.expiring.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors bg-red-50/50">
                                        <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Contrato Vencendo Hoje</p>
                                            <p className="text-xs text-gray-500">{c.nome} completa o período de experiência.</p>
                                            <p className="text-[10px] text-red-600 font-medium mt-1">Ação necessária no sistema.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {notifications.birthdays.length === 0 && notifications.expiring.length === 0 && notifications.avisoEnding.length === 0 && (
                            <div className="p-6 text-center text-gray-400">
                                <CheckCircle className="mx-auto mb-2 text-gray-300" size={24} />
                                <p className="text-xs">Nenhuma pendência urgente para hoje.</p>
                            </div>
                        )}

                        <div className="w-full h-px bg-gray-100 my-1"></div>

                        <div className="p-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Últimas Atualizações</p>
                            {notifications.recentHistory.map(log => (
                                <div key={log.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 
                                        ${log.type === 'create' ? 'bg-green-500' : 
                                          log.type === 'delete' ? 'bg-red-500' : 'bg-blue-500'}`} 
                                    />
                                    <div>
                                        <p className="text-xs text-gray-800 leading-tight">
                                            <span className="font-bold">{log.user}</span> {log.action.toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">{log.target} • {log.date.split(' ')[1]}</p>
                                    </div>
                                </div>
                            ))}
                             {notifications.recentHistory.length === 0 && (
                                <p className="text-xs text-gray-400 p-3 text-center">Nenhum histórico recente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Header = ({ title, user, children }: { title: string, user: User, children?: React.ReactNode }) => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
                <h1 className="text-lg font-bold text-gray-900 capitalize leading-none">{title}</h1>
                <p className="text-xs text-gray-500 capitalize mt-1">{today}</p>
            </div>
            
            <div className="flex items-center gap-6">
                {children}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{user.nome.split(' ')[0]} {user.nome.split(' ').pop()}</p>
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">{user.role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-brand-100 border-2 border-white shadow-sm text-brand-700 flex items-center justify-center font-bold text-sm">
                        {user.nome.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};

// --- TurnoverPage ---
const TurnoverPage = () => {
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

// ... OrganogramPage, CrudPage, LoginPage ...
// Reusing same components
const OrganogramPage = () => {
    // ... same as original ...
    const [hierarchy, setHierarchy] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filter States
    const [filterCoord, setFilterCoord] = useState('');
    const [filterSup, setFilterSup] = useState('');
    const [coordinatorsList, setCoordinatorsList] = useState<Coordinator[]>([]);
    const [supervisorsList, setSupervisorsList] = useState<Supervisor[]>([]);
    
    // Pan & Zoom State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [tool, setTool] = useState<'hand' | 'mouse'>('hand');

    useEffect(() => {
        const buildHierarchy = async () => {
            const [coords, sups, ilhas, collabs] = await Promise.all([
                db.getCoordinators(),
                db.getSupervisors(),
                db.getIlhas(),
                db.getCollaborators()
            ]);

            setCoordinatorsList(coords);
            setSupervisorsList(sups);

            // Filter out inactive collabs
            const activeCollabs = collabs.filter(c => c.status !== CollaboratorStatus.DESLIGADO);

            // Level 1: Manager (Fixed as requested)
            const root = {
                id: 'root-mgr',
                name: 'Tatiane Tappi',
                role: 'GERENTE OPERACIONAL',
                type: 'manager',
                children: [] as any[]
            };

            // Sorting Strategy: Roger first, then Thais, then others
            const sortedCoords = [...coords].sort((a, b) => {
                const nameA = a.nome.toUpperCase();
                const nameB = b.nome.toUpperCase();
                const isRogerA = nameA.includes('ROGER');
                const isThaisA = nameA.includes('THAIS');
                const isRogerB = nameB.includes('ROGER');
                const isThaisB = nameB.includes('THAIS');

                if (isRogerA) return -1;
                if (isRogerB) return 1;
                if (isThaisA) return -1;
                if (isThaisB) return 1;
                return nameA.localeCompare(nameB);
            });

            // Filter based on dropdown selection
            let relevantCoords = sortedCoords;
            if (filterCoord) {
                relevantCoords = sortedCoords.filter(c => c.id === filterCoord);
            }

            root.children = relevantCoords.map(c => {
                const coordNode = {
                    id: c.id,
                    name: c.nome,
                    role: 'COORDENADOR',
                    type: 'coordinator',
                    children: [] as any[]
                };

                // NEW LOGIC: Hierarchy based on Ilha assignments to handle M:N
                // 1. Find Ilhas assigned to this Coordinator
                let myIlhas = ilhas.filter(i => i.coordinatorIds?.includes(c.id));

                // 2. Identify Supervisors from these Ilhas
                const mySupIds = Array.from(new Set(myIlhas.flatMap(i => i.supervisorIds || [])));

                // 3. Apply Supervisor Filter
                let filteredSupIds = mySupIds;
                if (filterSup) {
                    if (mySupIds.includes(filterSup)) {
                        filteredSupIds = [filterSup];
                    } else {
                        filteredSupIds = [];
                    }
                }

                coordNode.children = filteredSupIds.map(supId => {
                    const supObj = sups.find(s => s.id === supId) || { id: supId, nome: 'Supervisor N/A', coordinatorId: '', status: EntityStatus.ACTIVE };
                    
                    const supervisorNode = {
                        id: `sup-${c.id}-${supId}`, // Unique ID for tree
                        name: supObj.nome,
                        role: 'SUPERVISOR',
                        type: 'supervisor',
                        children: [] as any[]
                    };

                    // 4. Find Ilhas for this Coordinator AND this Supervisor
                    const specificIlhas = myIlhas.filter(i => i.supervisorIds?.includes(supId));

                    supervisorNode.children = specificIlhas.map(ilha => {
                         const ilhaCollabs = activeCollabs.filter(col => col.ilhaId === ilha.id);

                         return {
                            id: `ilha-${c.id}-${supId}-${ilha.id}`,
                            name: ilha.nome,
                            role: 'ILHA',
                            type: 'ilha',
                            children: ilhaCollabs.map(col => ({
                                id: col.matricula,
                                name: col.nome,
                                role: 'COLABORADOR',
                                status: col.status,
                                type: 'collaborator'
                            }))
                         };
                    });

                    return supervisorNode;
                }).filter(s => s.children.length > 0 || !filterSup); 
                
                return coordNode;
            }).filter(c => c.children.length > 0 || (!filterSup && !filterCoord) || (filterCoord && !filterSup));

            setHierarchy(root);
            setLoading(false);
        };
        buildHierarchy();
    }, [filterCoord, filterSup]);

    // ... Pan & Zoom ...
    const handleWheel = (e: React.WheelEvent) => {
        if (tool === 'hand') {
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.2, scale + delta), 2);
            setScale(newScale);
        }
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool === 'mouse') return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || tool === 'mouse') return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    // ... TreeNode ...
    const TreeNode = ({ node }: { node: any }) => {
        if (!node) return null;
        const hasChildren = node.children && node.children.length > 0;
        const isIlhaNode = node.type === 'ilha';
        
        // ... node styles ...
        let cardStyle = "bg-white border-2 p-3 rounded-lg shadow-sm min-w-[180px] text-center relative z-10 transition-shadow hover:shadow-md";
        let headerColor = "";
        if (node.type === 'manager') { cardStyle += " border-emerald-500"; headerColor = "text-emerald-700 bg-emerald-50"; } 
        else if (node.type === 'coordinator') { cardStyle += " border-blue-500"; headerColor = "text-blue-700 bg-blue-50"; }
        else if (node.type === 'supervisor') { cardStyle += " border-orange-500"; headerColor = "text-orange-700 bg-orange-50"; }
        else if (node.type === 'ilha') { cardStyle += " border-indigo-500 min-w-[160px]"; headerColor = "text-indigo-700 bg-indigo-50"; }
        else { cardStyle += " border-gray-200 min-w-[150px]"; headerColor = "text-gray-600"; }

        if (isIlhaNode) {
            return (
                <div className="flex flex-col items-center mx-4">
                    <div className={cardStyle}>
                         <div className={`text-[10px] font-bold uppercase mb-1 rounded px-1 py-0.5 ${headerColor}`}>{node.role}</div>
                        <div className="font-bold text-sm text-gray-900 leading-tight">{node.name}</div>
                        <div className="mt-1 text-[10px] text-gray-500 font-medium">{node.children.length} Colaboradores</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="grid grid-cols-2 gap-4 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 relative w-max">
                        <div className="absolute -top-3 left-1/2 w-px h-3 bg-gray-300"></div>
                        {node.children.map((child: any) => (
                             <div key={child.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-left flex flex-col justify-between w-44 hover:border-brand-300 transition-colors">
                                 <div className="mb-2">
                                     <div className="font-bold text-xs text-gray-900 truncate" title={child.name}>{child.name}</div>
                                     <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5">Matrícula: {child.id}</div>
                                 </div>
                                 <div className="flex justify-end mt-1"><Badge status={child.status}/></div>
                             </div>
                        ))}
                         {node.children.length === 0 && <div className="col-span-2 text-xs text-gray-400 p-2 italic text-center">Nenhum colaborador nesta ilha/supervisor.</div>}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center mx-4">
                <div className={cardStyle}>
                    <div className={`text-[10px] font-bold uppercase mb-1 rounded px-1 py-0.5 ${headerColor}`}>{node.role}</div>
                    <div className="font-bold text-sm text-gray-900 leading-tight">{node.name}</div>
                </div>
                {hasChildren && (
                    <>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div className="flex relative">
                            {node.children.length > 1 && <div className="absolute top-0 left-[calc(50%-50%)] right-[calc(50%-50%)] h-px bg-gray-300"></div>}
                             <div className="flex items-start pt-6 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-px before:bg-gray-300">
                                {node.children.map((child: any) => (
                                    <div key={child.id} className="relative flex flex-col items-center before:content-[''] before:absolute before:-top-6 before:left-1/2 before:-ml-px before:w-px before:h-6 before:bg-gray-300 first:before:bg-transparent last:before:bg-transparent only:before:bg-gray-300"> 
                                        <div className="absolute -top-6 left-0 w-1/2 h-px bg-white first:block hidden"></div>
                                        <div className="absolute -top-6 right-0 w-1/2 h-px bg-white last:block hidden"></div>
                                        <div className="absolute -top-6 left-1/2 w-px h-6 bg-gray-300"></div>
                                        <TreeNode node={child} />
                                    </div>
                                ))}
                             </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
            {/* ... organogram controls ... */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Organograma Operacional</h2>
                <div className="flex gap-4">
                    <div className="flex gap-2">
                        <select className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500" value={filterCoord} onChange={(e) => setFilterCoord(e.target.value)}>
                            <option value="">Todos Coordenadores</option>
                            {coordinatorsList.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        <select className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500" value={filterSup} onChange={(e) => setFilterSup(e.target.value)}>
                            <option value="">Todos Supervisores</option>
                            {supervisorsList.filter(s => !filterCoord || s.coordinatorIds?.includes(filterCoord)).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                        <button onClick={() => setTool('hand')} className={`p-2 rounded-md transition-colors ${tool === 'hand' ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><Hand size={18} /></button>
                         <div className="w-px h-6 bg-gray-200"></div>
                        <button onClick={() => { setTool('mouse'); }} className={`p-2 rounded-md transition-colors ${tool === 'mouse' ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><MousePointer2 size={18} /></button>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 bg-gray-100 rounded-xl border border-gray-300 relative overflow-hidden select-none">
                 <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-md p-2">
                     <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Plus size={16}/></button>
                     <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronDown size={16}/></button>
                     <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Reset"><Maximize size={16}/></button>
                 </div>
                 
                 <div ref={containerRef} className={`w-full h-full overflow-hidden flex items-start justify-center pt-10 ${tool === 'hand' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default overflow-auto'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
                     <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: 'top center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
                         <TreeNode node={hierarchy} />
                     </div>
                 </div>
            </div>
        </div>
    );
};

const CrudPage = <T extends { id: string, nome: string, status: string | EntityStatus }>({ 
  title, data, onSave, onDelete, schema, currentUser, onRefresh
}: { 
  key?: any, title: string, data: Promise<T[]> | T[], onSave: (item: any) => Promise<void> | void, onDelete: (id: string) => Promise<void> | void, schema: { key: string, label: string, type: 'text' | 'select' | 'multiselect', options?: any[] | ((currentItem: any) => any[]) }[], currentUser: User, onRefresh: () => void
}) => {
    // ... same as original ...
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [currentItem, setCurrentItem] = useState<any>({});
    const [search, setSearch] = useState('');
    const [listData, setListData] = useState<T[]>([]); 
    const [loading, setLoading] = useState(false);

    const isAdmin = currentUser.role === UserRole.ADMIN;

    useEffect(() => {
        const load = async () => {
            if (data instanceof Promise) setListData(await data);
            else setListData(data);
        }
        load();
    }, [data]);

    const handleEdit = (item: any) => { setCurrentItem(item); setIsOpen(true); };
    const handleDeleteRequest = (item: T) => { setItemToDelete(item); setIsDeleteOpen(true); };
    const confirmDelete = async () => {
        if (itemToDelete) {
           await onDelete(itemToDelete.id);
           await db.addHistory({ action: `Exclusão de ${title.slice(0, -1)}`, target: itemToDelete.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: 'delete', details: `Registro removido permanentemente` });
           setIsDeleteOpen(false); setItemToDelete(null); onRefresh();
        }
    };
    const handleCreate = () => { setCurrentItem({ status: EntityStatus.ACTIVE }); setIsOpen(true); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        const isNew = !currentItem.id;
        const payload = { ...currentItem, id: currentItem.id || generateId() };
        await onSave(payload);
        await db.addHistory({ action: isNew ? `Criação de ${title.slice(0, -1)}` : `Edição de ${title.slice(0, -1)}`, target: payload.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: isNew ? 'create' : 'update', details: isNew ? 'Novo registro criado' : 'Atualização de dados cadastrais' });
        setLoading(false); setIsOpen(false); onRefresh(); 
    };

    const filteredData = listData.filter(d => (d.nome || '').toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* ... CRUD UI ... */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                {isAdmin && <Button onClick={handleCreate}><Plus size={16} /> Novo</Button>}
            </div>
            {/* Table ... */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input className="pl-9 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500" placeholder={`Buscar ${title}...`} value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Status</th>
                        {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => (<th key={s.key} className="p-4">{s.label}</th>))}
                        {isAdmin && <th className="p-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-medium text-gray-900">{item.nome}</td>
                          <td className="p-4"><Badge status={item.status} /></td>
                          {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => { 
    const opts = typeof s.options === 'function' ? s.options(item) : s.options;
    const selectedOpt = opts?.find(o => o.value === (item as any)[s.key]); 
    return <td key={s.key} className="p-4">{selectedOpt?.label || '-'}</td>; 
})}
                          {isAdmin && (<td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="text-brand-600 hover:text-brand-800 p-1 bg-brand-50 rounded"><Edit2 size={16} /></button><button onClick={() => handleDeleteRequest(item)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                      ))}
                      {filteredData.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-gray-400">Nenhum registro encontrado</td></tr>}
                    </tbody>
                  </table>
                </div>
            </div>
            {/* Modal ... */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg">{currentItem.id ? 'Editar' : 'Novo'} {title}</h3>
                      <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {schema.map(field => {
                        const opts = typeof field.options === 'function' ? field.options(currentItem) : field.options;
                        return (
                        <div key={field.key} className={field.type === 'multiselect' ? 'col-span-1 md:col-span-2' : ''}>
                          {field.type === 'text' && <Input label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => setCurrentItem({...currentItem, [field.key]: e.target.value})} required={field.key !== 'logo'} />}
                          {field.type === 'select' && <Select label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => {
                                const newVal = e.target.value;
                                // se mudar cliente, limpa operacao.
                                if (field.key === 'clientId') {
                                    setCurrentItem({...currentItem, clientId: newVal, operationId: ''});
                                } else {
                                    setCurrentItem({...currentItem, [field.key]: newVal});
                                }
                          }} required><option value="">Selecione...</option>{opts?.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</Select>}
                          {field.type === 'multiselect' && (
                              <div className="mb-4">
                                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{field.label}</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                                      {opts?.map((opt: any) => {
                                          const isSelected = (currentItem[field.key] || []).includes(opt.value);
                                          return (
                                              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={isSelected}
                                                      onChange={(e) => {
                                                          const curr = currentItem[field.key] || [];
                                                          if (e.target.checked) {
                                                              setCurrentItem({...currentItem, [field.key]: [...curr, opt.value]});
                                                          } else {
                                                              setCurrentItem({...currentItem, [field.key]: curr.filter(v => v !== opt.value)});
                                                          }
                                                      }}
                                                      className="rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                                                  />
                                                  {opt.label}
                                              </label>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                        </div>
                      );
                      })}
                       </div>
                      <div className="mt-2 pt-4 border-t border-gray-100">
                        <Select label="Status" value={currentItem.status || EntityStatus.ACTIVE} onChange={(e: any) => setCurrentItem({...currentItem, status: e.target.value})}><option value={EntityStatus.ACTIVE}>Ativo</option><option value={EntityStatus.INACTIVE}>Inativo</option></Select>
                      </div>
                      <div className="mt-4 flex justify-end gap-3 shrink-0">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                      </div>
                    </form>
                  </div>
                </div>
            )}
            {/* Delete Modal ... */}
            {isDeleteOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 text-center">
                       <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir {title.slice(0, -1)}?</h3>
                       <p className="text-gray-500 text-sm mb-6">Tem certeza que deseja remover <b>{itemToDelete.nome}</b>?</p>
                       <div className="flex gap-3 justify-center"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button><Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button></div>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
    // ... same as original ...
    const [matricula, setMatricula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        const users = await db.getUsers();
        const user = users.find(u => u.matricula === matricula && u.password === password);
        if (user) { if (user.status !== EntityStatus.ACTIVE) setError('Acesso bloqueado: Usuário inativo.'); else onLogin(user); } 
        else setError('Credenciais inválidas');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
               <div className="w-12 h-12 bg-brand-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">M</div>
               <h1 className="text-2xl font-bold text-gray-900">Bem-vindo</h1>
               <p className="text-gray-500 text-sm">Entre com suas credenciais para acessar.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Matrícula" value={matricula} onChange={(e: any) => setMatricula(e.target.value)} placeholder="Ex: 3924" />
              <Input label="Senha" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••" />
              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
              <Button className="w-full justify-center py-3" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Entrar na Plataforma'}</Button>
            </form>
            <p className="mt-6 text-center text-xs text-gray-400">© 2026 MOP System v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</p>
          </div>
        </div>
    );
};

// ... CollaboratorFormModal ...
const CollaboratorFormModal = ({ onClose, onSave, initialData, onSchedule, initialScheduleDate }: any) => {
    const [formData, setFormData] = useState<Partial<Collaborator>>(initialData || {
        status: CollaboratorStatus.ATIVO
    });
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [scheduleDate, setScheduleDate] = useState(initialScheduleDate || '');
    const [isScheduling, setIsScheduling] = useState(!!initialScheduleDate);

    useEffect(() => {
        const load = async () => {
            setIlhas(await db.getIlhas());
            setCoordinators(await db.getCoordinators());
            setSupervisors(await db.getSupervisors());
            setClients(await db.getClients());
            setOperations(await db.getOperations());
        }
        load();
    }, []);

    const handleChange = (k: keyof Collaborator, v: any) => setFormData(p => ({ ...p, [k]: v }));

    const handleConfirmSchedule = () => {
        if (!scheduleDate) {
            alert("Selecione uma data para agendar.");
            return;
        }
        onSchedule(formData, scheduleDate);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">{initialData ? 'Editar' : 'Novo'} Colaborador</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                <Input label="Matrícula" value={formData.matricula} onChange={(e:any) => handleChange('matricula', e.target.value)} required disabled={!!initialData} />
                <Input label="Nome Completo" value={formData.nome} onChange={(e:any) => handleChange('nome', e.target.value)} required />
                <Input label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} />
                <Input label="Data Nascimento" type="date" value={formData.dtNasc} onChange={(e:any) => handleChange('dtNasc', e.target.value)} />

                {/* Novos Campos VR */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <Input label="Email VR" value={formData.email_vr || ''} onChange={(e:any) => handleChange('email_vr', e.target.value)} placeholder="Email para sistema VR" />
                    <Input label="Senha de Acesso" value={formData.senha || ''} onChange={(e:any) => handleChange('senha', e.target.value)} placeholder="Senha inicial" />
                </div>
                
                <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alocação</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select label="Cliente" value={formData.clientId} onChange={(e:any) => {
                           handleChange('clientId', e.target.value);
                           handleChange('operationId', '');
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Operação" value={formData.operationId} onChange={(e:any) => {
                           handleChange('operationId', e.target.value);
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {operations.filter(o => !formData.clientId || o.clientId === formData.clientId).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </Select>
                        <Select label="Ilha" value={formData.ilhaId} onChange={(e:any) => {
                            const ilha = ilhas.find(i => i.id === e.target.value);
                            if(ilha) {
                                setFormData(p => ({
                                    ...p, 
                                    ilhaId: ilha.id,
                                    operationId: ilha.operationId,
                                    clientId: ilha.clientId,
                                    coordinatorId: ilha.coordinatorIds?.[0] || p.coordinatorId,
                                    supervisorId: ilha.supervisorIds?.[0] || p.supervisorId
                                }));
                            } else {
                                handleChange('ilhaId', e.target.value);
                            }
                        }}>
                            <option value="">Selecione...</option>
                            {ilhas.filter(i => (!formData.clientId || i.clientId === formData.clientId) && (!formData.operationId || i.operationId === formData.operationId)).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Coordenador" value={formData.coordinatorId} onChange={(e:any) => handleChange('coordinatorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {coordinators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Supervisor" value={formData.supervisorId} onChange={(e:any) => handleChange('supervisorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </Select>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <Select label="Status" value={formData.status} onChange={(e:any) => handleChange('status', e.target.value)}>
                        {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    
                    {formData.status === CollaboratorStatus.FERIAS && (
                        <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-in slide-in-from-top-2">
                             <Input label="Início Férias" type="date" value={formData.feriasInicio} onChange={(e:any) => handleChange('feriasInicio', e.target.value)} />
                             <Input label="Fim Férias" type="date" value={formData.feriasFim} onChange={(e:any) => handleChange('feriasFim', e.target.value)} />
                        </div>
                    )}
                    
                    {formData.status === CollaboratorStatus.DESLIGADO && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top-2">
                             <Input label="Data Desligamento" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AVISO_PREVIO && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-2 text-orange-800">
                                <AlertTriangle size={16} />
                                <p className="text-sm font-bold">Registro de Aviso Prévio</p>
                             </div>
                             <p className="text-xs text-orange-600 mb-3">Informe a data prevista para o desligamento final. O sistema usará esta data para cálculos de turnover futuro.</p>
                             <Input label="Data Fim do Aviso" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AFASTADO && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-2 text-red-800">
                                <Activity size={16} />
                                <p className="text-sm font-bold">Registro de Afastamento</p>
                             </div>
                             <Input label="Data de Início do Afastamento" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.LICENCA_MATERNIDADE && (
                        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-2 text-pink-800">
                                <Stethoscope size={16} />
                                <p className="text-sm font-bold">Registro de Licença Maternidade</p>
                             </div>
                             <Input label="Data de Início da Licença" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <Input label="Data Entrada" type="date" value={formData.dtEntradaProduto} onChange={(e:any) => handleChange('dtEntradaProduto', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Horário Entrada" type="time" value={formData.horarioEntrada} onChange={(e:any) => handleChange('horarioEntrada', e.target.value)} />
                        <Input label="Horário Saída" type="time" value={formData.horarioSaida} onChange={(e:any) => handleChange('horarioSaida', e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-100 shrink-0">
                 {onSchedule ? (
                    <div className="flex items-center gap-2">
                        {!isScheduling ? (
                            <Button variant="secondary" onClick={() => setIsScheduling(true)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                <CalendarClock size={16}/> {initialData ? "Agendar Alteração" : "Agendar Cadastro"}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-left-2">
                                <span className="text-xs font-bold text-blue-700 uppercase">Para:</span>
                                <input 
                                    type="date" 
                                    className="px-2 py-1 text-sm rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                                <button 
                                    onClick={() => setIsScheduling(false)} 
                                    className="p-1 rounded-full text-blue-400 hover:text-blue-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                 ) : <div></div>}

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    {isScheduling ? (
                        <Button onClick={handleConfirmSchedule} className="bg-blue-600 hover:bg-blue-700">
                            Confirmar Agendamento
                        </Button>
                    ) : (
                        <Button onClick={() => onSave(formData)}>Salvar</Button>
                    )}
                </div>
            </div>
          </div>
        </div>
    );
};

// ... CollaboratorsPage ...
const CollaboratorsPage: React.FC<{ currentUser: User, onViewDetails: (c: Collaborator) => void, onRefresh: () => void }> = ({ currentUser, onViewDetails, onRefresh }) => {
    // ... same as original ...
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
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
    
    useEffect(() => {
    const load = async () => {
        setCollabs(await db.getCollaborators());
        const coords = await db.getCoordinators();
        setCoordinators(coords.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        const supers = await db.getSupervisors();
        setSupervisors(supers.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        const ilhasList = await db.getIlhas();
        setIlhas(ilhasList.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        const ops = await db.getOperations();
        setOperations(ops.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        const cli = await db.getClients();
        setClients(cli.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
    };
    load();
}, []);

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
        const enteredBeforeEnd = entryDate && entryDate <= endOfMonth;
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
                        <input className="pl-9 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500" placeholder="Buscar por nome ou matrícula..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto"><span className="font-bold">{filtered.length}</span> resultados</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="p-4 w-16"></th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Supervisor</th>
                                <th className="p-4">Ilha</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(c => {
                                const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                                const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                                const client = clients.find(cl => cl.id === c.clientId);
                                const clientLogo = client?.logo;
                                return (
                                    <tr key={c.matricula} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewDetails(c)}>
                                        <td className="p-4">
                                            {clientLogo ? (
                                                <img src={clientLogo} alt={`Logo ${client?.nome}`} className="w-9 h-9 rounded-full object-cover object-center bg-white border border-gray-200" referrerPolicy="no-referrer" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                                    {getInitials(c.nome)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                        <td className="p-4"><Badge status={c.status} /></td>
                                        <td className="p-4 text-xs">{sup}</td>
                                        <td className="p-4 text-xs">{ilhaName}</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" className="p-1 h-auto" onClick={(e: any) => { e.stopPropagation(); onViewDetails(c); }}>
                                                <Eye size={16}/>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum colaborador encontrado com os filtros selecionados.</td></tr>}
                        </tbody>
                    </table>
                </div>
             </div>

             {isCreateOpen && (
                 <CollaboratorFormModal onClose={() => setIsCreateOpen(false)} onSave={handleSave} onSchedule={handleScheduleCreate} />
             )}
        </div>
    );
};

const CollaboratorDetailsPage: React.FC<{ collab: Collaborator, onBack: () => void, currentUser: User, onRefresh: () => void }> = ({ collab, onBack, currentUser, onRefresh }) => {
    // ... same as original ...
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentCollab, setCurrentCollab] = useState(collab);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
    const [vacationHistory, setVacationHistory] = useState<any[]>([]);
    const [ilha, setIlha] = useState<Ilha | undefined>(undefined);
    const [op, setOp] = useState<Operation | undefined>(undefined);
    const [client, setClient] = useState<Client | undefined>(undefined);
    const [coord, setCoord] = useState<Coordinator | undefined>(undefined);
    const [sup, setSup] = useState<Supervisor | undefined>(undefined);
    
    const isAdmin = currentUser.role === UserRole.ADMIN;

    useEffect(() => {
        const load = async () => {
            const allLogs = await db.getHistory();
            setHistoryLogs(allLogs.filter(h => h.target === currentCollab.nome || h.details?.includes(currentCollab.matricula)));
            const vacHistory = await db.getVacationHistory(currentCollab.matricula);
            setVacationHistory(vacHistory);
            const ilhas = await db.getIlhas();
            setIlha(ilhas.find(i => i.id === currentCollab.ilhaId));
            const ops = await db.getOperations();
            setOp(ops.find(o => o.id === currentCollab.operationId));
            const clients = await db.getClients();
            setClient(clients.find(c => c.id === currentCollab.clientId));
            const coords = await db.getCoordinators();
            setCoord(coords.find(c => c.id === currentCollab.coordinatorId));
            const sups = await db.getSupervisors();
            setSup(sups.find(s => s.id === currentCollab.supervisorId));
        };
        load();
    }, [currentCollab]);

    const calc = useMemo(() => getCollaboratorCalculations(currentCollab.dtEntradaProduto), [currentCollab]);
    
    const handleUpdate = async (data: Collaborator) => {
        const [ilhasList, supsList, coordsList, opsList, clientsList] = await Promise.all([
            db.getIlhas(),
            db.getSupervisors(),
            db.getCoordinators(),
            db.getOperations(),
            db.getClients()
        ]);

        const changes: string[] = [];

        const addChange = (field: string, oldVal: any, newVal: any) => {
            if (oldVal !== newVal) {
                const fmt = (v: any) => {
                    if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}$/)) return formatDateString(v);
                    return v || '(vazio)';
                };
                changes.push(`${field}: de '${fmt(oldVal)}' para '${fmt(newVal)}'`);
            }
        };

        const addIdChange = (field: string, oldId: string, newId: string, list: {id: string, nome: string}[]) => {
            if (oldId !== newId) {
                const oldName = list.find(i => i.id === oldId)?.nome || 'N/A';
                const newName = list.find(i => i.id === newId)?.nome || 'N/A';
                changes.push(`${field}: de '${oldName}' para '${newName}'`);
            }
        };

        addChange('Nome', currentCollab.nome, data.nome);
        addChange('Email', currentCollab.email, data.email);
        addChange('Status', currentCollab.status, data.status);
        addChange('Nascimento', currentCollab.dtNasc, data.dtNasc);
        
        // Tracking changes for new VR fields
        addChange('Email VR', currentCollab.email_vr, data.email_vr);
        addChange('Senha', currentCollab.senha, data.senha);
        
        addIdChange('Ilha', currentCollab.ilhaId, data.ilhaId, ilhasList);
        addIdChange('Supervisor', currentCollab.supervisorId, data.supervisorId, supsList);
        addIdChange('Coordenador', currentCollab.coordinatorId, data.coordinatorId, coordsList);
        addIdChange('Operação', currentCollab.operationId, data.operationId, opsList);
        addIdChange('Cliente', currentCollab.clientId, data.clientId, clientsList);

        addChange('Entrada', currentCollab.dtEntradaProduto, data.dtEntradaProduto);
        addChange('Desligamento', currentCollab.dataFim, data.dataFim);
        addChange('Horário Entrada', currentCollab.horarioEntrada, data.horarioEntrada);
        addChange('Horário Saída', currentCollab.horarioSaida, data.horarioSaida);
        
        addChange('Início Férias', currentCollab.feriasInicio, data.feriasInicio);
        addChange('Fim Férias', currentCollab.feriasFim, data.feriasFim);
        addChange('Data Afastamento', currentCollab.dataAfastamento, data.dataAfastamento);
        addChange('Efetivação', currentCollab.efetivacao, data.efetivacao);

        const details = changes.length > 0 ? changes.join('; ') : 'Dados cadastrais atualizados sem alterações críticas identificadas.';

        await db.saveCollaborator(data);
        if (data.feriasInicio && data.feriasFim && (currentCollab.feriasInicio !== data.feriasInicio || currentCollab.feriasFim !== data.feriasFim)) {
            await db.addVacationHistory(data.matricula, data.feriasInicio, data.feriasFim);
        }
        await db.addHistory({
            action: 'Atualização Colaborador',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'update',
            details: details
        });
        setCurrentCollab(data);
        setIsEditOpen(false);
        onRefresh(); 
    };

    const handleScheduleUpdate = async (data: Collaborator, date: string) => {
        const changes: any = {};
        
        if (currentCollab.nome !== data.nome) changes.nome = data.nome;
        if (currentCollab.email !== data.email) changes.email = data.email;
        if (currentCollab.status !== data.status) changes.status = data.status;
        if (currentCollab.ilhaId !== data.ilhaId) changes.ilhaId = data.ilhaId;
        if (currentCollab.supervisorId !== data.supervisorId) changes.supervisorId = data.supervisorId;
        if (currentCollab.coordinatorId !== data.coordinatorId) changes.coordinatorId = data.coordinatorId;
        if (currentCollab.operationId !== data.operationId) changes.operationId = data.operationId;
        if (currentCollab.clientId !== data.clientId) changes.clientId = data.clientId;
        
        if (currentCollab.dtEntradaProduto !== data.dtEntradaProduto) changes.dtEntradaProduto = data.dtEntradaProduto;
        if (currentCollab.dataFim !== data.dataFim) changes.dataFim = data.dataFim;
        if (currentCollab.horarioEntrada !== data.horarioEntrada) changes.horarioEntrada = data.horarioEntrada;
        if (currentCollab.horarioSaida !== data.horarioSaida) changes.horarioSaida = data.horarioSaida;
        if (currentCollab.dtNasc !== data.dtNasc) changes.dtNasc = data.dtNasc;
        
        if (currentCollab.feriasInicio !== data.feriasInicio) changes.feriasInicio = data.feriasInicio;
        if (currentCollab.feriasFim !== data.feriasFim) changes.feriasFim = data.feriasFim;
        if (currentCollab.dataAfastamento !== data.dataAfastamento) changes.dataAfastamento = data.dataAfastamento;
        if (currentCollab.efetivacao !== data.efetivacao) changes.efetivacao = data.efetivacao;
        
        if (currentCollab.email_vr !== data.email_vr) changes.email_vr = data.email_vr;
        if (currentCollab.senha !== data.senha) changes.senha = data.senha;

        if (data.status === CollaboratorStatus.FERIAS) {
            changes.feriasInicio = data.feriasInicio;
            changes.feriasFim = data.feriasFim;
        }

        if (data.status === CollaboratorStatus.DESLIGADO) {
            changes.dataFim = data.dataFim;
        }

        if (data.status === CollaboratorStatus.AFASTADO || data.status === CollaboratorStatus.LICENCA_MATERNIDADE) {
            changes.dataAfastamento = data.dataAfastamento;
        }

        if (Object.keys(changes).length === 0) {
            alert("Nenhuma alteração detectada para agendar.");
            return;
        }

        await db.scheduleTask(data.matricula, changes, date, currentUser.nome);
        await db.addHistory({
            action: 'Agendamento de Tarefa',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'create',
            details: `Alteração agendada para ${formatDateString(date)}`
        });
        
        setIsEditOpen(false);
        alert(`Alteração agendada para ${formatDateString(date)} com sucesso!`);
    };

    const handleDelete = async () => {
        if(confirm('Tem certeza que deseja excluir este colaborador?')) {
            await db.deleteCollaborator(currentCollab.matricula);
            onRefresh(); 
            onBack();
        }
    };

    const Field = ({ label, value, className = "" }: any) => (
        <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-medium text-gray-900 ${className}`}>{value || '-'}</p>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-right-10 duration-500 pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>
                
                {client?.logo ? (
                    <img src={client.logo} alt={`Logo ${client.nome}`} className="w-12 h-12 rounded-full object-cover object-center bg-white border border-gray-200" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-lg">
                        {getInitials(currentCollab.nome)}
                    </div>
                )}

                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{currentCollab.nome}</h1>
                    <p className="text-gray-500">Matrícula: {currentCollab.matricula}</p>
                </div>
                {(isAdmin || currentUser.role === UserRole.SUPPORT) && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsEditOpen(true)}><Edit2 size={16}/> Editar Cadastro</Button>
                        {isAdmin && <Button variant="danger" onClick={handleDelete}><Trash2 size={16}/></Button>}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon size={18} className="text-brand-600"/> Dados Pessoais</h3>
                        <Field label="Email" value={currentCollab.email} className="break-all" />
                        <Field label="Data de Nascimento" value={formatDateString(currentCollab.dtNasc)} />
                        <Field label="Status" value={<Badge status={currentCollab.status} />} />
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-brand-600"/> Contrato</h3>
                        <Field label="Data de Entrada" value={formatDateString(currentCollab.dtEntradaProduto)} />
                        {currentCollab.status === CollaboratorStatus.DESLIGADO && (
                            <Field label="Data Desligamento" value={formatDateString(currentCollab.dataFim)} />
                        )}
                         {currentCollab.status === CollaboratorStatus.AVISO_PREVIO && (
                            <Field label="Fim do Aviso" value={formatDateString(currentCollab.dataFim)} />
                        )}
                        {currentCollab.status === CollaboratorStatus.AFASTADO && (
                            <Field label="Início Afastamento" value={formatDateString(currentCollab.dataAfastamento)} />
                        )}
                        <Field label="Tempo de Casa" value={`${calc.tempoDeCasa} dias`} />
                        <Field label="Período de Experiência" value={calc.experiencia} />
                        <Field label="Vencimento Experiência" value={calc.vence === '-' ? '-' : formatDateString(calc.vence)} />
                    </div>
                </div>

                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={18} className="text-brand-600"/> Alocação</h3>
                        <Field label="Cliente" value={client?.nome} />
                        <Field label="Operação" value={op?.nome} />
                        <Field label="Ilha" value={ilha?.nome} />
                        <Field label="Coordenador" value={coord?.nome} />
                        <Field label="Supervisor" value={sup?.nome} />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock size={18} className="text-brand-600"/> Jornada</h3>
                        <div className="flex gap-8">
                             <Field label="Entrada" value={formatTime(currentCollab.horarioEntrada)} />
                             <Field label="Saída" value={formatTime(currentCollab.horarioSaida)} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Key size={18} className="text-brand-600"/> Dados de Acesso</h3>
                        <Field label="Email VR" value={currentCollab.email_vr} className="break-all" />
                        <Field label="Senha" value={currentCollab.senha} />
                    </div>
                    
                    {/* Férias Display */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sun size={18} className="text-brand-600"/> Férias</h3>
                        {currentCollab.feriasInicio ? (
                             <>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Início" value={formatDateString(currentCollab.feriasInicio)} />
                                    <Field label="Fim" value={formatDateString(currentCollab.feriasFim)} />
                                </div>
                                {currentCollab.feriasFim && (
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Retorno Previsto</p>
                                        <p className="font-bold text-green-600 text-lg">{addDays(currentCollab.feriasFim, 1)}</p>
                                    </div>
                                )}
                                <div className="mt-2">
                                    <Badge status={currentCollab.status === 'FÉRIAS' ? 'EM GOZO' : 'PROGRAMADO'} />
                                </div>
                             </>
                        ) : (
                            <p className="text-gray-400 text-sm">Nenhuma férias programada.</p>
                        )}
                        
                        {vacationHistory.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <History size={16} className="text-gray-400" /> Histórico de Férias
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {vacationHistory.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                            <span className="text-gray-600">
                                                {formatDateString(h.start_date)} - {formatDateString(h.end_date)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <History size={18} className="text-gray-500"/> Histórico de Alterações
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 w-32">Data/Hora</th>
                                <th className="p-4 w-40">Usuário</th>
                                <th className="p-4 w-40">Ação</th>
                                <th className="p-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {historyLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="p-4 text-xs text-gray-500">{log.date}</td>
                                    <td className="p-4 font-bold text-xs">{log.user}</td>
                                    <td className="p-4 text-xs">{log.action}</td>
                                    <td className="p-4 text-xs text-gray-700 font-mono">{log.details || '-'}</td>
                                </tr>
                            ))}
                            {historyLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum registro de alteração encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isEditOpen && (
                <CollaboratorFormModal 
                    initialData={currentCollab} 
                    onClose={() => setIsEditOpen(false)} 
                    onSave={handleUpdate} 
                    onSchedule={handleScheduleUpdate}
                />
            )}
        </div>
    );
};

// ... ScheduledTasksPage, HistoryPage, Dashboard ...
// (Reusing existing components for brevity)
const ScheduledTasksPage = () => {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [collabNames, setCollabNames] = useState<Record<string, string>>({});
    
    // New State for Editing
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
    const [initialData, setInitialData] = useState<Partial<Collaborator>>({});

    const loadTasks = async () => {
        const pending = await db.getPendingTasks();
        setTasks(pending);
        
        // Fetch Names
        const collabs = await db.getCollaborators();
        const names: Record<string, string> = {};
        pending.forEach(t => {
            const c = collabs.find(col => col.matricula === t.matricula);
            if (c) names[t.matricula] = c.nome;
            // Fallback para tarefas de criação onde o colaborador ainda não existe
            else if (t.changes && t.changes.nome) names[t.matricula] = t.changes.nome + " (Novo)";
        });
        setCollabNames(names);
    };

    useEffect(() => { loadTasks(); }, []);

    const handleCancel = async (id: string) => {
        if(confirm("Deseja cancelar esta tarefa agendada?")) {
            await db.cancelTask(id);
            loadTasks();
        }
    }

    const handleCancelAll = async () => {
        if(confirm("Atenção: Esta ação irá excluir TODAS as tarefas agendadas. Deseja continuar?")) {
            try {
                await db.cancelAllTasks();
                loadTasks();
            } catch (err: any) {
                alert("Erro ao excluir tarefas: " + err.message);
                console.error(err);
            }
        }
    }

    const handleEdit = async (task: ScheduledTask) => {
        setEditingTask(task);
        
        const collabs = await db.getCollaborators();
        const existing = collabs.find(c => c.matricula === task.matricula);
        
        if (existing) {
            setInitialData({ ...existing, ...task.changes });
        } else {
            setInitialData(task.changes);
        }
        
        setIsEditOpen(true);
    };

    const handleUpdateTask = async (data: Collaborator, date: string) => {
        if (!editingTask) return;
        
        await db.updateTask(editingTask.id, data, date);
        
        await db.addHistory({
            action: 'Edição de Tarefa Agendada',
            target: data.nome || 'N/A',
            user: 'Sistema', // Or current user if passed
            date: new Date().toLocaleString('pt-BR'),
            type: 'update',
            details: `Tarefa reagendada para ${formatDateString(date)}`
        });

        setIsEditOpen(false);
        setEditingTask(null);
        loadTasks();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Tarefas Agendadas</h2>
                    <span className="bg-brand-100 text-brand-700 text-sm font-bold px-3 py-1 rounded-full">
                        {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                </div>
                {tasks.length > 0 && (
                    <Button variant="solid-danger" onClick={handleCancelAll}>
                        <Trash2 size={16} className="mr-2" /> Excluir Todas
                    </Button>
                )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4">Data Programada</th>
                            <th className="p-4">Matrícula</th>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4">Resumo Alterações</th>
                            <th className="p-4">Criado Por</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-brand-700">{formatDateString(task.scheduled_date)}</td>
                                <td className="p-4 font-mono text-xs">{task.matricula}</td>
                                <td className="p-4 font-medium text-gray-900">{collabNames[task.matricula] || '...'}</td>
                                <td className="p-4 text-xs text-gray-500">
                                    {Object.keys(task.changes).length > 5 ? 'Alteração Completa (Cadastro)' : Object.keys(task.changes).join(', ')}
                                </td>
                                <td className="p-4 text-xs">{task.created_by}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" className="px-2 py-1 text-xs text-brand-600 border-brand-200 bg-brand-50 hover:bg-brand-100" onClick={() => handleEdit(task)}>
                                            <Edit2 size={14} className="mr-1"/> Editar
                                        </Button>
                                        <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleCancel(task.id)}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma tarefa pendente.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditOpen && (
                <CollaboratorFormModal 
                    initialData={initialData} 
                    onClose={() => setIsEditOpen(false)} 
                    onSave={() => {}} 
                    onSchedule={handleUpdateTask}
                    initialScheduleDate={editingTask?.scheduled_date}
                />
            )}
        </div>
    );
};

const HistoryPage: React.FC = () => {
    // ... same as original ...
    const [logs, setLogs] = useState<HistoryLog[]>([]);
    
    useEffect(() => {
        db.getHistory().then(setLogs);
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Histórico de Atividades</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4 w-32">Data/Hora</th>
                            <th className="p-4 w-40">Usuário</th>
                            <th className="p-4 w-40">Ação</th>
                            <th className="p-4 w-48">Alvo</th>
                            <th className="p-4">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td className="p-4 text-xs text-gray-500">{log.date}</td>
                                <td className="p-4 font-bold text-xs">{log.user}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                        ${log.type === 'create' ? 'bg-green-100 text-green-700' : 
                                          log.type === 'delete' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-800">{log.target}</td>
                                <td className="p-4 text-xs text-gray-600">{log.details || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ currentUser: User, onNavigate: (page: string) => void }> = ({ currentUser, onNavigate }) => {
    // ... same as original ...
  const [stats, setStats] = useState({
     total: 0,
     active: 0,
     vacation: 0,
     inactive: 0
  });
  
  const [operationsStats, setOperationsStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [ilhaStats, setIlhaStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [supervisorStats, setSupervisorStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [expiringCount, setExpiringCount] = useState(0);
  const [avisoPrevioCount, setAvisoPrevioCount] = useState(0);
  const [birthdaysCount, setBirthdaysCount] = useState(0);

  useEffect(() => {
     const load = async () => {
         const collabs = await db.getCollaborators();
         const ops = await db.getOperations();
         const ilhas = await db.getIlhas();
         const supervisors = await db.getSupervisors();
         
         const total = collabs.length;
         const active = collabs.filter(c => c.status === CollaboratorStatus.ATIVO);
         const vacation = collabs.filter(c => c.status === CollaboratorStatus.FERIAS).length;
         const inactive = collabs.filter(c => c.status === CollaboratorStatus.DESLIGADO).length;
         
         setStats({ total, active: active.length, vacation, inactive });
         setAvisoPrevioCount(collabs.filter(c => c.status === CollaboratorStatus.AVISO_PREVIO).length);

         const opStats = ops.map(op => {
             const count = active.filter(c => c.operationId === op.id).length;
             return {
                 name: op.nome,
                 count: count,
                 percent: active.length > 0 ? Math.round((count / active.length) * 100) : 0
             };
         }).sort((a, b) => b.count - a.count);
         setOperationsStats(opStats);

         const ilStats = ilhas.map(il => {
            const count = active.filter(c => c.ilhaId === il.id).length;
            return {
                name: il.nome,
                count: count,
                percent: active.length > 0 ? Math.round((count / active.length) * 100) : 0
            };
         }).sort((a, b) => b.count - a.count);
         setIlhaStats(ilStats);

         const supStats = supervisors.map(sup => {
            const count = active.filter(c => c.supervisorId === sup.id).length;
            return {
                name: sup.nome,
                count: count,
                percent: active.length > 0 ? Math.round((count / active.length) * 100) : 0
            };
         }).sort((a, b) => b.count - a.count);
         setSupervisorStats(supStats);

         const expiring = active.filter(c => {
            const calc = getCollaboratorCalculations(c.dtEntradaProduto);
            if (calc.vence === '-') return false;
            const parts = calc.vence.split('/');
            const vDate = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
            const now = new Date();
            now.setHours(0,0,0,0);
            const diffTime = vDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 15;
         });
         setExpiringCount(expiring.length);

         // Birthdays Logic
         const currentMonth = new Date().getMonth();
         const bdays = collabs.filter(c => {
            if(!c.dtNasc) return false;
            const m = parseInt(c.dtNasc.split('-')[1]) - 1;
            return m === currentMonth;
        }).length;
        setBirthdaysCount(bdays);
     }
     load();
  }, []);

  const Card = ({ title, value, subtext, trend, trendValue, icon: Icon, colorClass }: any) => (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">{title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-gray-50 ${colorClass}`}>
                  <Icon size={20} />
              </div>
          </div>
          <div className="mt-2">
              <div className="flex items-center gap-1 text-xs font-medium">
                  {trend === 'up' ? <TrendingUp size={14} className="text-green-600"/> : <TrendingDown size={14} className="text-red-600"/>}
                  <span className="text-green-600">{trendValue}</span>
                  <span className="text-gray-400 ml-1">{subtext}</span>
              </div>
          </div>
      </div>
  );

  const DistributionList = ({ title, data }: { title: string, data: any[] }) => (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
          <h3 className="font-bold text-gray-900 mb-6">{title}</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {data.map(item => (
                  <div key={item.name}>
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                          <span className="truncate max-w-[70%]">{item.name.toUpperCase()}</span>
                          <span>{item.percent}% ({item.count})</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${item.percent}%` }}></div>
                      </div>
                  </div>
              ))}
              {data.length === 0 && <p className="text-gray-400 text-sm">Sem dados registrados.</p>}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card 
               title="Total Colaboradores" 
               value={stats.total} 
               subtext="vs mês anterior"
               trend="up"
               trendValue="+4%"
               icon={Users}
               colorClass="text-blue-600"
           />
           <Card 
               title="Em Operação / Ativos" 
               value={stats.active} 
               subtext="de quadro total"
               trend="up"
               trendValue={`${stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}%`}
               icon={CheckCircle}
               colorClass="text-green-600"
           />
           <Card 
               title="Em Férias" 
               value={stats.vacation} 
               subtext="Próximo retorno: 26/02"
               trend="down"
               trendValue=""
               icon={Sun}
               colorClass="text-orange-600"
           />
           <Card 
               title="Desligados / Licença" 
               value={stats.inactive} 
               subtext="turnover mensal"
               trend="down"
               trendValue="-1%"
               icon={UserIcon}
               colorClass="text-gray-400"
           />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <DistributionList title="Distribuição por Operação" data={operationsStats} />
           </div>

           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 h-full">
               <h3 className="font-bold text-gray-900 mb-2">Avisos Recentes</h3>
               <div 
                   onClick={() => onNavigate('expiring')}
                   className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-yellow-100 transition-colors"
               >
                   <div className="text-yellow-600 mt-0.5"><AlertTriangle size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Fim de Contrato Próximo</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {expiringCount > 0 
                             ? `${expiringCount} colaboradores vencem contrato nos próximos 15 dias. Clique para ver.` 
                             : `Nenhum contrato vencendo nos próximos 15 dias.`}
                       </p>
                   </div>
               </div>

               <div 
                   onClick={() => onNavigate('aviso_previo')}
                   className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-orange-100 transition-colors"
               >
                   <div className="text-orange-600 mt-0.5"><UserMinus size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Colaboradores em Aviso Prévio</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {avisoPrevioCount > 0 
                             ? `${avisoPrevioCount} colaboradores atualmente em aviso. Clique para gerenciar.` 
                             : `Nenhum colaborador em aviso prévio.`}
                       </p>
                   </div>
               </div>

                <div 
                   onClick={() => onNavigate('vacation')}
                   className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-blue-100 transition-colors"
               >
                   <div className="text-blue-600 mt-0.5"><Sun size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Colaboradores em Férias</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                           {stats.vacation > 0 
                               ? `${stats.vacation} colaboradores em gozo de férias. Clique para gerenciar.` 
                               : `Nenhum colaborador em férias no momento.`}
                       </p>
                   </div>
               </div>

               <div 
                   onClick={() => onNavigate('birthdays')}
                   className="p-3 bg-green-50 border border-green-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-green-100 transition-colors"
               >
                   <div className="text-green-600 mt-0.5"><Gift size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Aniversariantes do Mês</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                           {birthdaysCount > 0
                               ? `${birthdaysCount} colaboradores celebram ano este mês.`
                               : 'Nenhum aniversariante este mês.'}
                       </p>
                   </div>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <DistributionList title="Distribuição por Ilha" data={ilhaStats} />
           <DistributionList title="Distribuição por Supervisor" data={supervisorStats} />
       </div>
    </div>
  );
};

// ... ImportPage ...
const ImportPage: React.FC<{ currentUser: User, onRefresh: () => void }> = ({ currentUser, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'import' | 'update'>('import');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [rawRows, setRawRows] = useState<any[]>([]); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [stats, setStats] = useState({ found: 0 });

    const handleTabChange = (tab: 'import' | 'update') => {
        setActiveTab(tab);
        setFile(null);
        setRawRows([]);
        setPreview([]);
        setStats({ found: 0 });
        setIsScheduling(false);
        setScheduleDate('');
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (f: File) => {
        try {
            const data = await f.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet); 
            
            setRawRows(json);
            setStats({ found: json.length });
            
            if (activeTab === 'import') {
                const mappedPreview = json.slice(0, 5).map((row: any) => ({
                    matricula: row['MATRICULA'] || row['Matricula'] || row['Matrícula'],
                    nome: row['NOME'] || row['Nome'],
                    status: row['STATUS'] || row['Status'],
                    ilha: row['ILHA'] || row['Ilha']
                }));
                setPreview(mappedPreview);
            } else {
                const mappedPreview = json.slice(0, 5).map((row: any) => ({
                    matricula: row['MATRICULA'] || row['Matricula'] || row['Matrícula'],
                    supervisor: row['SUPERVISOR'] || row['Supervisor'],
                    ilha: row['ILHA'] || row['Ilha'],
                    referencia: row['REFERENCIA'] || row['Referencia'] || row['Referência']
                }));
                setPreview(mappedPreview);
            }
        } catch (error) {
            alert("Erro ao ler arquivo: " + error);
        }
    };

    const handleImport = async () => {
        if (rawRows.length === 0) return;
        setIsProcessing(true);
        try {
            const newCollaborators: Collaborator[] = [];
            for (const row of rawRows) {
                const clientName = row['CLIENTE'] || row['Cliente'] || 'N/A';
                const client = await db.findOrCreateClient(clientName);

                const opName = row['OPERAÇÃO'] || row['OPERACAO'] || row['Operação'] || 'N/A';
                const operation = await db.findOrCreateOperation(opName, client.id);

                const coordName = row['COORDENADOR'] || row['Coordenador'] || 'N/A';
                const coordinator = await db.findOrCreateCoordinator(coordName);

                const supName = row['SUPERVISOR'] || row['Supervisor'] || 'N/A';
                const supervisor = await db.findOrCreateSupervisor(supName, [coordinator.id]);

                const ilhaName = row['ILHA'] || row['Ilha'] || 'N/A';
                const ilha = await db.findOrCreateIlha(ilhaName, client.id, operation.id, [coordinator.id], [supervisor.id]);

                const dtEntrada = parseExcelDate(row['DT ENTRADA PRODUTO'] || row['ADMISSAO'] || row['Data Entrada'] || row['DATA ENTRADA']);
                const dtNasc = parseExcelDate(row['DT_NASC'] || row['NASCIMENTO'] || row['Data Nascimento'] || row['Nascimento']);
                
                let dtDesligamentoRaw = row['DATA FIM'] || row['Data Fim'] || row['DATA_FIM'] || row['DATA DESLIGAMENTO'] || row['Data Desligamento'] || row['DT DESLIGAMENTO'] || row['DEMISSAO'] || row['Demissao'] || row['DT_SAIDA'] || row['DT_FIM'];
                
                if (!dtDesligamentoRaw) {
                     const key = Object.keys(row).find(k => {
                         const u = k.toUpperCase().trim();
                         return u === 'DATA FIM' || u === 'DT FIM' || u.includes('DESLIGAMENTO');
                     });
                     if (key) dtDesligamentoRaw = row[key];
                }

                const dtDesligamento = parseExcelDate(dtDesligamentoRaw);

                let hrSaidaRaw = row['HORÁRIO DE SÁIDA'] || row['HORÁRIO DE SAÍDA'] || row['HORARIO DE SAIDA'] || row['Saída'] || row['SAIDA'];
                if (!hrSaidaRaw) {
                     const key = Object.keys(row).find(k => k.toUpperCase().includes('SA') && (k.toUpperCase().includes('HOR') || k.toUpperCase().includes('IDA')));
                     if(key) hrSaidaRaw = row[key];
                }

                let hrEntradaRaw = row['HORÁRIO DE ENTRADA'] || row['HORARIO DE ENTRADA'] || row['Entrada'] || row['ENTRADA'];
                if (!hrEntradaRaw) {
                    const key = Object.keys(row).find(k => k.toUpperCase().includes('ENTRADA') && k.toUpperCase().includes('HOR'));
                    if(key) hrEntradaRaw = row[key];
                }

                const hrEntrada = parseExcelTime(hrEntradaRaw);
                const hrSaida = parseExcelTime(hrSaidaRaw);

                const statusRaw = (row['STATUS'] || row['Status'] || 'ATIVO').toUpperCase();
                let status = CollaboratorStatus.ATIVO;
                if(statusRaw.includes('FERIAS') || statusRaw.includes('FÉRIAS')) status = CollaboratorStatus.FERIAS;
                else if(statusRaw.includes('DESLIGADO')) status = CollaboratorStatus.DESLIGADO;
                else if(statusRaw.includes('LICENÇA') || statusRaw.includes('MATERNIDADE')) status = CollaboratorStatus.LICENCA_MATERNIDADE;
                else if(statusRaw.includes('AVISO')) status = CollaboratorStatus.AVISO_PREVIO;

                const matricula = String(row['MATRICULA'] || row['Matricula'] || row['Matrícula'] || generateId());
                const nome = row['NOME'] || row['Nome'] || 'Sem Nome';

                // Parsing novos campos
                const emailVr = row['EMAIL VR'] || row['EMAIL_VR'] || row['Email VR'] || row['Email_VR'];
                const senha = row['SENHA'] || row['Senha'] || row['PASSWORD'] || row['Password'];

                const collab: Collaborator = {
                    matricula: matricula,
                    nome: nome,
                    email: row['EMAIL'] || row['Email'] || '',
                    status: status,
                    ilhaId: ilha.id,
                    supervisorId: supervisor.id,
                    coordinatorId: coordinator.id,
                    operationId: operation.id,
                    clientId: client.id,
                    dtEntradaProduto: dtEntrada,
                    horarioEntrada: hrEntrada,
                    horarioSaida: hrSaida,
                    dtNasc: dtNasc,
                    feriasInicio: '',
                    feriasFim: '',
                    dataFim: dtDesligamento,
                    email_vr: emailVr,
                    senha: senha
                };
                
                if (matricula && nome !== 'Sem Nome') {
                    if (isScheduling && scheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === scheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...collab }, scheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, collab, scheduleDate, currentUser.nome);
                        }
                        if (!globalThis.scheduledCount) globalThis.scheduledCount = 0;
                        globalThis.scheduledCount++;
                    } else {
                        newCollaborators.push(collab);
                    }
                }
            }
            
            if (newCollaborators.length > 0) {
                await db.bulkCreateCollaborators(newCollaborators);
                
                const now = new Date().toLocaleString('pt-BR');
                await db.addHistory({
                    action: 'Importação em Massa',
                    target: `${newCollaborators.length} registros`,
                    user: currentUser.nome,
                    date: now,
                    type: 'import',
                    details: `${newCollaborators.length} registros importados via Excel`
                });

                const logPromises = newCollaborators.map(c => db.addHistory({
                    action: 'Importação',
                    target: c.nome,
                    user: currentUser.nome,
                    date: now,
                    type: 'create',
                    details: `Cadastro realizado via importação de arquivo.`
                }));
                await Promise.all(logPromises);
            }

            let msg = '';
            if (newCollaborators.length > 0) msg += `${newCollaborators.length} colaboradores importados.\n`;
            if (globalThis.scheduledCount > 0) {
                msg += `${globalThis.scheduledCount} tarefas agendadas para o mês de referência.\n`;
                globalThis.scheduledCount = 0;
            }
            
            alert(msg ? `Operação concluída com sucesso!\n${msg}` : 'Nenhum registro válido encontrado.');
            handleTabChange('import');
            onRefresh();

        } catch (err: any) {
            console.error(err);
            alert("Erro ao processar importação: " + (err.message || err));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdate = async () => {
        if (rawRows.length === 0) return;
        setIsProcessing(true);
        try {
            const collabs = await db.getCollaborators();
            const updates = [];
            
            const existingClients = await db.getClients();
            const existingOperations = await db.getOperations();
            const existingCoordinators = await db.getCoordinators();
            const existingSupervisors = await db.getSupervisors();
            const existingIlhas = await db.getIlhas();
            const pendingTasks = await db.getPendingTasks();
            
            for (const row of rawRows) {
                const matricula = String(row['MATRICULA'] || row['Matricula'] || row['Matrícula']);
                if (!matricula || matricula === 'undefined') continue;
                
                const collab = collabs.find(c => c.matricula === matricula);
                if (!collab) continue;
                
                // Fields to update
                const clientName = row['CLIENTE'] || row['Cliente'];
                const opName = row['OPERAÇÃO'] || row['OPERACAO'] || row['Operação'];
                const coordName = row['COORDENADOR'] || row['Coordenador'];
                const supName = row['SUPERVISOR'] || row['Supervisor'];
                const ilhaName = row['ILHA'] || row['Ilha'];
                
                // Get or create relations
                let client = collab.clientId ? existingClients.find(c => c.id === collab.clientId) : null;
                if (clientName) {
                    client = existingClients.find(c => c.nome.toLowerCase() === clientName.toLowerCase()) || await db.findOrCreateClient(clientName);
                    if (!existingClients.find(c => c.id === client.id)) existingClients.push(client);
                }
                
                let operation = collab.operationId ? existingOperations.find(o => o.id === collab.operationId) : null;
                if (opName && client) {
                    operation = existingOperations.find(o => o.nome.toLowerCase() === opName.toLowerCase() && o.clientId === client.id) || await db.findOrCreateOperation(opName, client.id);
                    if (!existingOperations.find(o => o.id === operation.id)) existingOperations.push(operation);
                }
                
                let coordinator = collab.coordinatorId ? existingCoordinators.find(c => c.id === collab.coordinatorId) : null;
                if (coordName) {
                    coordinator = existingCoordinators.find(c => c.nome.toLowerCase() === coordName.toLowerCase()) || await db.findOrCreateCoordinator(coordName);
                    if (!existingCoordinators.find(c => c.id === coordinator.id)) existingCoordinators.push(coordinator);
                }
                
                let supervisor = collab.supervisorId ? existingSupervisors.find(s => s.id === collab.supervisorId) : null;
                if (supName && coordinator) {
                    supervisor = existingSupervisors.find(s => s.nome.toLowerCase() === supName.toLowerCase()) || await db.findOrCreateSupervisor(supName, [coordinator.id]);
                    if (!existingSupervisors.find(s => s.id === supervisor.id)) existingSupervisors.push(supervisor);
                }
                
                let ilha = collab.ilhaId ? existingIlhas.find(i => i.id === collab.ilhaId) : null;
                if (ilhaName && client && operation && coordinator && supervisor) {
                    ilha = existingIlhas.find(i => i.nome.toLowerCase() === ilhaName.toLowerCase() && i.clientId === client.id && i.operationId === operation.id) || await db.findOrCreateIlha(ilhaName, client.id, operation.id, [coordinator.id], [supervisor.id]);
                    if (!existingIlhas.find(i => i.id === ilha.id)) existingIlhas.push(ilha);
                }
                
                // Ensure IDs are valid
                const updatePayload: Partial<Collaborator> = {};
                if (client) updatePayload.clientId = client.id;
                if (operation) updatePayload.operationId = operation.id;
                if (coordinator) updatePayload.coordinatorId = coordinator.id;
                if (supervisor) updatePayload.supervisorId = supervisor.id;
                if (ilha) updatePayload.ilhaId = ilha.id;

                if (Object.keys(updatePayload).length > 0) {
                    if (isScheduling && scheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === scheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...updatePayload }, scheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, updatePayload, scheduleDate, currentUser.nome);
                        }
                        if (!globalThis.scheduledCountUpdate) globalThis.scheduledCountUpdate = 0;
                        globalThis.scheduledCountUpdate++;
                    } else {
                        await db.updateCollaborator(collab.matricula, updatePayload);
                    }
                    updates.push(collab.matricula);
                }
            }
            const now = new Date().toLocaleString('pt-BR');
            if (updates.length > 0) {
                await db.addHistory({
                    action: 'Atualização em Massa (Update Tab)',
                    target: `${updates.length} registros`,
                    user: currentUser.nome,
                    date: now,
                    type: 'update',
                    details: `Agendamento de atualização via planilha Excel`
                });
                
                let msg = '';
                const scheduledUpdates = globalThis.scheduledCountUpdate || 0;
                const immediateUpdates = updates.length - scheduledUpdates;
                if (immediateUpdates > 0) msg += `${immediateUpdates} colaboradores atualizados imediatamente.\n`;
                if (scheduledUpdates > 0) msg += `${scheduledUpdates} atualizações agendadas para o mês de referência.\n`;
                globalThis.scheduledCountUpdate = 0;
                alert(`Operação concluída!\n${msg}`);

            } else {
                alert("Nenhum colaborador atualizado. Verifique se as matrículas da planilha existem no sistema.");
            }
            handleTabChange('update');
            onRefresh();

        } catch (err: any) {
            console.error(err);
            alert("Erro ao processar atualização: " + (err.message || err));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Dados</h2>
            
            <div className="flex gap-4 border-b border-gray-200">
                <button 
                    onClick={() => handleTabChange('import')}
                    className={`pb-3 px-4 text-sm font-bold ${activeTab === 'import' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Importar Novos
                </button>
                <button 
                    onClick={() => handleTabChange('update')}
                    className={`pb-3 px-4 text-sm font-bold ${activeTab === 'update' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Update em Massa
                </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                 <div className="w-16 h-16 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileSpreadsheet size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Carregar Planilha Excel ({activeTab === 'import' ? 'Importar' : 'Atualizar'})</h3>
                 
                 <p className="text-gray-500 text-sm mb-6">
                    {activeTab === 'import' ? 
                        "A planilha deve conter as colunas: MATRICULA, NOME, EMAIL, STATUS, SUPERVISOR, COORDENADOR, CLIENTE, OPERAÇÃO, ILHA, DT ENTRADA PRODUTO, HORÁRIOS, DATA FIM, EMAIL VR, SENHA." :
                        "A planilha deve conter as colunas obrigatórias: MATRICULA, SUPERVISOR, ILHA, REFERENCIA, COORDENADOR, OPERAÇÃO, CLIENTE."
                    }
                 </p>
                 
                 <input type="file" id="file-upload" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
                 <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer font-medium transition-colors shadow-lg shadow-brand-500/20">
                     <Upload size={18} /> Selecionar Arquivo
                 </label>

                 {file && (
                     <div className="mt-8 p-6 bg-gray-50 rounded-xl text-left border border-gray-100 animate-in slide-in-from-bottom-2">
                         <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="font-bold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{stats.found} registros encontrados</p>
                            </div>
                            <Button variant="ghost" onClick={() => handleTabChange(activeTab)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 size={16}/>
                            </Button>
                         </div>
                         
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pré-visualização</p>
                         <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 mb-6">
                             <table className="w-full text-xs text-left">
                                 <thead className="bg-gray-50 text-gray-600 font-semibold">
                                     <tr>
                                         {activeTab === 'import' ? (
                                             <>
                                                 <th className="p-3">Matrícula</th>
                                                 <th className="p-3">Nome</th>
                                                 <th className="p-3">Status</th>
                                                 <th className="p-3">Ilha</th>
                                             </>
                                         ) : (
                                             <>
                                                 <th className="p-3">Matrícula</th>
                                                 <th className="p-3">Supervisor</th>
                                                 <th className="p-3">Ilha</th>
                                                 <th className="p-3">Referência</th>
                                             </>
                                         )}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                     {preview.map((row, i) => (
                                         <tr key={i}>
                                             {activeTab === 'import' ? (
                                                 <>
                                                     <td className="p-3">{row.matricula}</td>
                                                     <td className="p-3">{row.nome}</td>
                                                     <td className="p-3">{row.status}</td>
                                                     <td className="p-3">{row.ilha}</td>
                                                 </>
                                             ) : (
                                                 <>
                                                     <td className="p-3">{row.matricula}</td>
                                                     <td className="p-3">{row.supervisor}</td>
                                                     <td className="p-3">{row.ilha}</td>
                                                     <td className="p-3">{row.referencia}</td>
                                                 </>
                                             )}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>

                         <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 flex-wrap">
                             <Button variant="secondary" onClick={() => handleTabChange(activeTab)}>Cancelar</Button>
                             
                             {!isScheduling ? (
                                 <Button variant="secondary" onClick={() => setIsScheduling(true)} disabled={isProcessing}>
                                     <CalendarClock size={16}/> Agendar
                                 </Button>
                             ) : (
                                 <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-left-2">
                                     <span className="text-xs font-bold text-blue-700 uppercase">Agendar para:</span>
                                     <input 
                                         type="date" 
                                         className="px-2 py-1 text-sm rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                         value={scheduleDate}
                                         onChange={(e) => setScheduleDate(e.target.value)}
                                     />
                                     <button 
                                         onClick={() => { setIsScheduling(false); setScheduleDate(''); }} 
                                         className="p-1 rounded-full text-blue-400 hover:text-blue-600 outline-none"
                                     >
                                         <X size={14} />
                                     </button>
                                 </div>
                             )}

                             <Button onClick={activeTab === 'import' ? handleImport : handleUpdate} disabled={isProcessing}>
                                 {isProcessing ? (
                                    <><Loader2 size={16} className="animate-spin mr-2"/> Processando...</>
                                 ) : (
                                    <><CheckCircle size={16} className="mr-2"/> {activeTab === 'import' ? 'Confirmar Importação' : 'Confirmar Atualização'}</>
                                 )}
                             </Button>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};

const UsersPage = ({ currentUser, onRefresh }: any) => {
    return <CrudPage 
        title="Usuários" 
        data={db.getUsers()} 
        onSave={(u: User) => {
             db.getUsers().then(users => {
                 if(users.find(x => x.id === u.id)) db.updateUser(u);
                 else db.addUser(u);
             });
        }} 
        onDelete={(id: string) => db.deleteUser(id)}
        schema={[
            {key: 'matricula', label: 'Matrícula', type: 'text'},
            {key: 'nome', label: 'Nome', type: 'text'},
            {key: 'email', label: 'Email', type: 'text'},
            {key: 'password', label: 'Senha', type: 'text'},
            {key: 'role', label: 'Função', type: 'select', options: [
                {value: UserRole.ADMIN, label: 'Admin'}, 
                {value: UserRole.MANAGER, label: 'Gerente'},
                {value: UserRole.COORDINATOR, label: 'Coordenador'},
                {value: UserRole.SUPERVISOR, label: 'Supervisor'},
                {value: UserRole.RH, label: 'RH'},
                {value: UserRole.VIEWER, label: 'Visualizador'},
                {value: UserRole.SUPPORT, label: 'Suporte'}
            ]}
        ]}
        currentUser={currentUser}
        onRefresh={onRefresh}
    />;
};

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

const ResetDataPage = () => {
    const handleReset = async () => {
        if(confirm("ATENÇÃO: Isso apagará TODOS os dados! Continuar?")) {
            await db.resetDatabase();
            window.location.reload();
        }
    }
    return (
        <div className="space-y-6 animate-in fade-in duration-500 flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                 <AlertTriangle size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Zona de Perigo</h2>
            <p className="text-gray-500 max-w-md text-center">
                Esta ação irá apagar todos os dados do banco de dados e restaurar o usuário Admin padrão.
                Isso não pode ser desfeito.
            </p>
            <Button variant="danger" onClick={handleReset} className="px-8 py-4 text-lg">
                RESETAR SISTEMA COMPLETO
            </Button>
        </div>
    );
}

const BulkUpdatePage = ({ currentUser, onRefresh }: { currentUser: User, onRefresh: () => void }) => {
    // ... same as original ...
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    
    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        type: 'info' | 'confirm' | 'error' | 'success';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    
    // Filters
    const [filterClient, setFilterClient] = useState('');
    const [filterOp, setFilterOp] = useState('');
    const [filterIlha, setFilterIlha] = useState('');
    const [filterStatus, setFilterStatus] = useState(CollaboratorStatus.ATIVO);
    
    // Update Actions
    const [updates, setUpdates] = useState<{ field: string, value: string }[]>([{ field: '', value: '' }]);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    // Metadata
    const [clients, setClients] = useState<Client[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);

    useEffect(() => {
        const load = async () => {
            const [c, cl, op, il, sup, coord] = await Promise.all([
                db.getCollaborators(),
                db.getClients(),
                db.getOperations(),
                db.getIlhas(),
                db.getSupervisors(),
                db.getCoordinators()
            ]);
            setCollabs(c);
            setClients(cl);
            setOperations(op);
            setIlhas(il);
            setSupervisors(sup);
            setCoordinators(coord);
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        return collabs.filter(c => {
            if (filterClient && c.clientId !== filterClient) return false;
            if (filterOp && c.operationId !== filterOp) return false;
            if (filterIlha && c.ilhaId !== filterIlha) return false;
            if (filterStatus && c.status !== filterStatus) return false;
            return true;
        });
    }, [collabs, filterClient, filterOp, filterIlha, filterStatus]);

    const handleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(c => String(c.matricula))));
        }
    };

    const toggleSelect = (id: string) => {
        const strId = String(id);
        const newSet = new Set(selectedIds);
        if (newSet.has(strId)) newSet.delete(strId);
        else newSet.add(strId);
        setSelectedIds(newSet);
    };

        const getFieldName = (f: string) => {
        if(f === 'coordinatorId') return 'Coordenador';
        if(f === 'supervisorId') return 'Supervisor';
        if(f === 'ilhaId') return 'Ilha (com cascata)';
        if(f === 'status') return 'Status';
        if(f === 'operationId') return 'Operação';
        if(f === 'clientId') return 'Cliente';
        return 'Registro';
    };

    const processSchedule = async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const matriculas: string[] = Array.from(selectedIds);
            const now = new Date().toLocaleString('pt-BR');
            
            const validUpdates = updates.filter(u => u.field && u.value);
            if (validUpdates.length === 0) return;

            const changes: any = {};
            validUpdates.forEach(u => {
                changes[u.field] = u.value;
            });

            const schedulePromises = matriculas.map(mat => {
                const c = collabs.find(col => String(col.matricula) === String(mat));
                if(!c) return Promise.resolve();
                return db.scheduleTask(mat, changes, scheduleDate, currentUser.nome);
            });
            await Promise.all(schedulePromises);

            const fieldNames = validUpdates.map(u => getFieldName(u.field)).join(', ');

            const logPromises = matriculas.map(mat => {
                const c = collabs.find(col => String(col.matricula) === String(mat));
                if(!c) return Promise.resolve();
                return db.addHistory({
                    action: 'Agendamento em Massa',
                    target: c.nome,
                    user: currentUser.nome,
                    date: now,
                    type: 'update',
                    details: `Campos [${fieldNames}] agendados para ${scheduleDate} via lote.`
                });
            });
            await Promise.all(logPromises);

            setModalConfig({
                isOpen: true,
                title: 'Sucesso',
                message: 'Agendamentos realizados com sucesso!',
                type: 'success'
            });
            setSelectedIds(new Set());
            setUpdates([{ field: '', value: '' }]);
            setIsScheduling(false);
            setScheduleDate('');
            onRefresh();
            setCollabs(await db.getCollaborators());
        } catch (e: any) {
            console.error("Erro no agendamento em massa:", e);
            setModalConfig({ isOpen: true, title: 'Erro', message: "Erro ao agendar: " + e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const processUpdate = async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const matriculas: string[] = Array.from(selectedIds);
            const now = new Date().toLocaleString('pt-BR');

            const validUpdates = updates.filter(u => u.field && u.value);
            if (validUpdates.length === 0) return;

            // Execute sequentially to respect cascading
            for (const update of validUpdates) {
                await db.bulkUpdateCollaborators(matriculas, update.field, update.value);
            }

            const fieldNames = validUpdates.map(u => getFieldName(u.field)).join(', ');

            await db.addHistory({
                action: 'Update em Massa',
                target: `${selectedIds.size} registros`,
                user: currentUser.nome,
                date: now,
                type: 'update',
                details: `Alteração de [${fieldNames}] para ${selectedIds.size} colaboradores.`
            });

            const logPromises = matriculas.map(mat => {
                const c = collabs.find(col => String(col.matricula) === String(mat));
                if(!c) return Promise.resolve();
                return db.addHistory({
                    action: 'Atualização em Massa',
                    target: c.nome,
                    user: currentUser.nome,
                    date: now,
                    type: 'update',
                    details: `Campos [${fieldNames}] alterados via ação em lote.`
                });
            });
            
            await Promise.all(logPromises);

            setModalConfig({
                isOpen: true,
                title: 'Sucesso',
                message: 'Atualização realizada com sucesso!',
                type: 'success'
            });
            setSelectedIds(new Set());
            setUpdates([{ field: '', value: '' }]);
            onRefresh();
            setCollabs(await db.getCollaborators());
        } catch (e: any) {
            console.error("Erro no update em massa:", e);
            setModalConfig({ isOpen: true, title: 'Erro', message: "Erro ao atualizar: " + e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteSchedule = () => {
        if (selectedIds.size === 0) {
            setModalConfig({ isOpen: true, title: 'Atenção', message: 'Selecione pelo menos um colaborador.', type: 'info' });
            return;
        }
        const validUpdates = updates.filter(u => u.field && u.value);
        if (validUpdates.length === 0) { 
             setModalConfig({ isOpen: true, title: 'Atenção', message: 'Preencha pelo menos um campo e um novo valor.', type: 'info' });
             return;
        }
        if (!scheduleDate) {
             setModalConfig({ isOpen: true, title: 'Atenção', message: 'Selecione uma data para o agendamento.', type: 'info' });
             return;
        }
        setModalConfig({
            isOpen: true,
            title: 'Confirmar Agendamento',
            message: <span dangerouslySetInnerHTML={{__html: `Confirma o agendamento para <b>${selectedIds.size}</b> colaboradores na data <b>${scheduleDate}</b>?`}} />,
            type: 'confirm',
            onConfirm: processSchedule
        });
    };

    const handleExecute = () => {
        if (selectedIds.size === 0) {
            setModalConfig({ isOpen: true, title: 'Atenção', message: 'Selecione pelo menos um colaborador.', type: 'info' });
            return;
        }
        const validUpdates = updates.filter(u => u.field && u.value);
        if (validUpdates.length === 0) { 
             setModalConfig({ isOpen: true, title: 'Atenção', message: 'Preencha pelo menos um campo e um novo valor para atualização.', type: 'info' });
             return;
        }
        setModalConfig({
            isOpen: true,
            title: 'Confirmar Atualização',
            message: <span dangerouslySetInnerHTML={{__html: `Confirma a atualização de <b>${selectedIds.size}</b> colaboradores?`}} />,
            type: 'confirm',
            onConfirm: processUpdate
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <h2 className="text-2xl font-bold text-gray-800">Atualização em Massa</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Filters and Actions */}
                <div className="space-y-6 lg:col-span-1">
                    
                    {/* Actions Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-brand-200 ring-1 ring-brand-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ListChecks size={18} className="text-brand-600"/> Ação de Atualização
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-3 bg-brand-50 rounded-lg text-center">
                                <span className="block text-2xl font-bold text-brand-700">{selectedIds.size}</span>
                                <span className="text-xs text-brand-600 font-medium uppercase">Selecionados</span>
                            </div>

                            {updates.map((update, index) => (
                                <div key={index} className="space-y-3 p-3 bg-gray-50 rounded border border-gray-100 relative">
                                    {updates.length > 1 && (
                                        <button 
                                            onClick={() => setUpdates(updates.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            title="Remover campo"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Campo {index + 1}</label>
                                        <select 
                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                            value={update.field}
                                            onChange={e => { 
                                                const newUpdates = [...updates]; 
                                                newUpdates[index] = { field: e.target.value, value: '' }; 
                                                setUpdates(newUpdates); 
                                            }}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="coordinatorId">Coordenador</option>
                                            <option value="supervisorId">Supervisor</option>
                                            <option value="ilhaId">Ilha</option>
                                            <option value="operationId">Operação</option>
                                            <option value="clientId">Cliente</option>
                                            <option value="status">Status</option>
                                        </select>
                                    </div>

                                    {update.field && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Novo Valor</label>
                                            <select 
                                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                value={update.value}
                                                onChange={e => {
                                                    const newUpdates = [...updates]; 
                                                    newUpdates[index] = { ...update, value: e.target.value }; 
                                                    setUpdates(newUpdates); 
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                {update.field === 'coordinatorId' && coordinators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                {update.field === 'supervisorId' && supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                                {update.field === 'ilhaId' && ilhas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                                {update.field === 'operationId' && operations.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                                {update.field === 'clientId' && clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                {update.field === 'status' && Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {update.field === 'ilhaId' && update.value && (
                                                <p className="text-[10px] text-brand-600 mt-2 bg-brand-50 p-2 rounded">
                                                    Atenção: Ao alterar a Ilha, a Operação, Cliente, Coordenador e Supervisor serão atualizados automaticamente para os padrões da Ilha selecionada.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            <Button 
                                variant="outline" 
                                className="w-full border-dashed border-2 text-brand-600 hover:bg-brand-50 hover:text-brand-700 justify-center flex items-center gap-2"
                                onClick={() => setUpdates([...updates, { field: '', value: '' }])}
                            >
                                <Plus size={16} /> Adicionar Campo
                            </Button>

                            <div className="pt-2 mt-2 border-t border-gray-100 flex flex-col gap-2">
                                        {!isScheduling ? (
                                            <Button variant="secondary" onClick={() => setIsScheduling(true)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 w-full flex justify-center gap-2">
                                                <CalendarClock size={16}/> Agendar Alteração
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-700 uppercase">Agendar para:</span>
                                                    <button onClick={() => {setIsScheduling(false); setScheduleDate('');}} className="p-1 rounded-full text-blue-400 hover:text-blue-600 bg-blue-100">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <input 
                                                    type="date" 
                                                    className="px-2 py-1.5 text-sm rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                            <Button 
                                 onClick={isScheduling ? handleExecuteSchedule : handleExecute} 
                                disabled={loading || selectedIds.size === 0 || updates.filter(u => u.field && u.value).length === 0 || (isScheduling && !scheduleDate)}
                                className="w-full justify-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (isScheduling ? 'Confirmar Agendamento' : 'Aplicar Alterações')}
                            </Button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Filter size={18} className="text-gray-400"/> Filtros
                            </h3>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                                    <option value="">Todos</option>
                                    {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Cliente</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                                    <option value="">Todos</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Operação</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterOp} onChange={e => setFilterOp(e.target.value)}>
                                    <option value="">Todas</option>
                                    {operations.filter(o => !filterClient || o.clientId === filterClient).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Ilha</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterIlha} onChange={e => setFilterIlha(e.target.value)}>
                                    <option value="">Todas</option>
                                    {ilhas.filter(i => (!filterClient || i.clientId === filterClient) && (!filterOp || i.operationId === filterOp)).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Table */}
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <span className="text-sm font-bold text-gray-600">{filtered.length} colaboradores encontrados</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-white text-gray-700 font-semibold uppercase tracking-wider text-xs sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                            onChange={handleSelectAll}
                                            className="rounded text-brand-600 focus:ring-brand-500"
                                        />
                                    </th>
                                    <th className="p-4">Nome / Matrícula</th>
                                    <th className="p-4">Supervisor Atual</th>
                                    <th className="p-4">Coordenador Atual</th>
                                    <th className="p-4">Ilha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(c => {
                                    const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                                    const coord = coordinators.find(co => co.id === c.coordinatorId)?.nome || '-';
                                    const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                                    const strMatricula = String(c.matricula);
                                    
                                    return (
                                        <tr key={strMatricula} className={selectedIds.has(strMatricula) ? "bg-brand-50/30" : "hover:bg-gray-50"}>
                                            <td className="p-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(strMatricula)}
                                                    onChange={() => toggleSelect(strMatricula)}
                                                    className="rounded text-brand-600 focus:ring-brand-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{c.nome}</div>
                                                <div className="text-xs text-gray-400">{c.matricula}</div>
                                            </td>
                                            <td className="p-4 text-xs">{sup}</td>
                                            <td className="p-4 text-xs">{coord}</td>
                                            <td className="p-4 text-xs">{ilha}</td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Custom Modal for Sandbox Compatibility */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 p-6 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                            ${modalConfig.type === 'error' ? 'bg-red-100 text-red-600' : 
                              modalConfig.type === 'success' ? 'bg-green-100 text-green-600' : 
                              modalConfig.type === 'confirm' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-600'}`}>
                            {modalConfig.type === 'error' ? <AlertTriangle size={32} /> :
                             modalConfig.type === 'success' ? <CheckCircle size={32} /> :
                             modalConfig.type === 'confirm' ? <AlertCircle size={32} /> : <Info size={32} />} 
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
                        <div className="text-gray-500 text-sm mb-6">{modalConfig.message}</div>
                        
                        <div className="flex gap-3 justify-center">
                            {(modalConfig.type === 'confirm') ? (
                                <>
                                    <Button variant="secondary" onClick={() => setModalConfig(p => ({...p, isOpen: false}))}>Cancelar</Button>
                                    <Button onClick={modalConfig.onConfirm}>Confirmar</Button>
                                </>
                            ) : (
                                <Button variant="secondary" onClick={() => setModalConfig(p => ({...p, isOpen: false}))}>Fechar</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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

const AboutPage = () => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <Info size={48} />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">MOP - Mapa Operacional</h1>
      <p className="text-xl text-gray-500 mb-8">Desenvolvido para simplificar o seu dia a dia.</p>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full space-y-6">
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <span className="text-gray-500 font-medium">Versão</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <span className="text-gray-500 font-medium">Última Atualização</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">{typeof __UPDATE_DATE__ !== 'undefined' ? __UPDATE_DATE__ : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
           <span className="text-gray-500 font-medium">Desenvolvedor</span>
           <span className="font-bold text-gray-900">Welton Luiz Pereira</span>
        </div>
        <div className="flex flex-col gap-2 pt-2">
           <span className="text-gray-500 font-medium text-left">Precisa de ajuda?</span>
           <a href="mailto:welton.pereira@qualitycontactcenter.com.br" className="text-brand-600 font-bold hover:underline flex items-center justify-center gap-2 p-3 bg-brand-50 rounded-xl transition-colors">
              <Mail size={18} /> welton.pereira@qualitycontactcenter.com.br
           </a>
        </div>
      </div>

      <p className="mt-12 text-sm text-gray-400">© 2026 Todos os direitos reservados.</p>
    </div>
);

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
      case 'dashboard': return <Dashboard currentUser={currentUser!} onNavigate={setCurrentPage} key={dataVersion} />;
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
      default: return <Dashboard currentUser={currentUser!} onNavigate={setCurrentPage} key={dataVersion} />;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const isViewer = currentUser.role === UserRole.VIEWER;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  // Grupo que inclui todos MENOS visualizador (Admin, Gerente, Coord, Sup, RH)
  const isManagementOrRh = currentUser.role !== UserRole.VIEWER;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
       <aside className="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-10">
          <div className="h-16 flex items-center px-6 border-b border-border">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold mr-3">M</div>
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
                 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-1">
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

       <main className="flex-1 ml-64 overflow-y-auto h-full bg-gray-50 flex flex-col relative custom-scrollbar">
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
