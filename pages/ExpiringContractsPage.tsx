import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, AlignJustify, GanttChartSquare } from 'lucide-react';
import { User, UserRole, Collaborator, Operation, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { getCollaboratorCalculations, formatDateString, getInitials } from '../utils';
import { Button, Badge, Chip, Table } from '../components/ui';
import { useChartTokens } from '../lib/tokens';

export const ExpiringContractsPage: React.FC<{ onBack: () => void, currentUser: User }> = ({ onBack, currentUser }) => {
    // as barras do gantt recebem cor como valor; vêm do tema em vigor
    const cor = useChartTokens();
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
           <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>
           </div>

           <Table.Card>
                <Table.Toolbar
                    busca={{ valor: searchTerm, aoMudar: setSearchTerm, placeholder: 'Buscar por nome' }}
                    contagem={{ n: filtered.length, um: 'contrato', varios: 'contratos' }}
                    chips={<>
                        <Chip
                            onClick={() => setViewMode('table')}
                            aria-pressed={viewMode === 'table'}
                            className={viewMode === 'table' ? 'border-brand text-brand-text' : ''}
                        >
                            <span className="inline-flex items-center gap-1.5"><AlignJustify size={12}/> Tabela</span>
                        </Chip>
                        <Chip
                            onClick={() => setViewMode('gantt')}
                            aria-pressed={viewMode === 'gantt'}
                            className={viewMode === 'gantt' ? 'border-brand text-brand-text' : ''}
                        >
                            <span className="inline-flex items-center gap-1.5"><GanttChartSquare size={12}/> Gantt</span>
                        </Chip>
                    </>}
                />
                {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px] text-ink-mute bg-canvas">
                        <thead>
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
                        <tbody className="divide-y divide-hairline">
                            {filtered.map(c => {
                                const opName = operations.find(o => o.id === c.operationId)?.nome || '-';
                                
                                const getStatus = (days: number) => {
                                    if (days < 0) return { color: 'text-danger', bg: 'bg-danger/15' };
                                    if (days <= 5) return { color: 'text-danger', bg: 'bg-danger/10' };
                                    if (days <= 15) return { color: 'text-brand-text', bg: 'bg-brand-wash' };
                                    return { color: 'text-brand-text', bg: 'bg-brand-wash' };
                                };
                                const st45 = getStatus(c.daysRemaining45);
                                const st90 = getStatus(c.daysRemaining90);

                                return (
                                    <tr key={c.matricula} className="hover:bg-canvas-soft">
                                        <td className="p-4">
                                            <div className="w-9 h-9 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-xs">
                                                {getInitials(c.nome)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium min-w-[200px] break-words whitespace-normal">{c.nome}</td>
                                        <td className="p-4 dado">{formatDateString(c.dtEntradaProduto)}</td>
                                        <td className="p-4 text-ink dado">{formatDateString(c.calc.vence45)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${st45.bg} ${st45.color}`}>
                                                {c.daysRemaining45 < 0 ? '-' : 
                                                 c.daysRemaining45 === 0 ? 'Vence Hoje' : 
                                                 `${c.daysRemaining45} dias`}
                                            </span>
                                        </td>
                                        <td className="p-4 text-ink dado">{formatDateString(c.calc.vence90)}</td>
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
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${c.efetivacao === 'SIM' ? 'bg-ok text-canvas shadow-1' : 'bg-canvas-sunk text-ink-faint hover:bg-ok/10 hover:text-ok'}`}
                                                    >
                                                        SIM
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEfetivacao(c, 'NÃO')}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${c.efetivacao === 'NÃO' ? 'bg-danger text-canvas shadow-1' : 'bg-canvas-sunk text-ink-faint hover:bg-danger/10 hover:text-danger'}`}
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
                            {filtered.length === 0 && (
                                <tr><td colSpan={9} className="p-10 text-center text-[13px] text-ink-mute">
                                    {searchTerm
                                        ? 'Nada com esse texto. Ajuste a busca.'
                                        : 'Nenhum contrato vence nos próximos 90 dias.'}
                                </td></tr>
                            )}
                        </tbody>
                </table>
               </div>
               ) : (
                    <div className="border border-hairline rounded-lg bg-canvas overflow-hidden flex w-full" style={{ height: 'calc(100vh - 220px)', minHeight: '300px' }}>
                        {/* Left Column (Fixed Width, Vertical Scroll Synced) */}
                        <div className="w-[300px] shrink-0 border-r border-hairline flex flex-col bg-canvas z-20">
                            <div className="h-[80px] shrink-0 border-b border-hairline flex items-center px-4 bg-canvas">
                                <span className="t-eyebrow text-ink-faint">Colaborador / Data de entrada</span>
                            </div>
                            <div className="flex-1 overflow-hidden custom-scrollbar" ref={leftColRef} onScroll={(e) => {
                                // sync scroll back just in case, though mostly we scroll the right pane
                                if (scrollRef.current) scrollRef.current.scrollTop = e.currentTarget.scrollTop;
                            }}>
                                {filtered.map(c => (
                                    <div key={c.matricula} className="h-[60px] border-b border-hairline px-4 flex items-center gap-3 bg-canvas hover:bg-canvas-soft transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-brand-wash text-brand-text font-bold text-xs flex items-center justify-center shrink-0 border border-brand-wash">
                                            {getInitials(c.nome)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-ink truncate text-[13px]" title={c.nome}>{c.nome}</div>
                                            <div className="text-[11px] text-ink-mute">{formatDateString(c.dtEntradaProduto)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Timeline (Scrollable) */}
                        <div className="flex-1 flex flex-col min-w-0 bg-canvas relative">
                            {/* Header (Horizontal Scroll Synced) */}
                            <div className="h-[80px] shrink-0 border-b border-hairline bg-canvas overflow-hidden flex flex-col relative" ref={topHeaderRef}>
                                <div style={{ width: `${ganttDates.length * 40}px` }} className="flex flex-col relative">
                                    <div className="h-[30px] flex items-center justify-center font-bold text-ink text-sm border-b border-hairline sticky left-0 w-full" style={{ left: 0 }}>
                                        {ganttDates.length > 0 && ganttDates[Math.floor(ganttDates.length / 2)].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
                                    </div>
                                    <div className="h-[50px] flex relative">
                                        {ganttDates.map((date, i) => {
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            const dayNum = date.getDate();
                                            const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3);
                                            
                                            return (
                                                <div key={i} className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1" style={{ left: `${i * 40}px`, width: '40px' }}>
                                                    <div className={`flex flex-col items-center justify-center w-8 rounded ${isToday ? 'bg-brand text-on-brand shadow-2' : 'text-ink-mute'} pt-1 pb-1 z-20`}>
                                                        <span className={`text-[13px] font-bold leading-none ${isToday ? 'text-on-brand' : 'text-ink'}`}>{dayNum}</span>
                                                        <span className={`text-[9px] font-medium uppercase mt-0.5 ${isToday ? 'text-on-brand/70' : 'text-ink-faint'}`}>{dayStr}</span>
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
                                                <div key={i} className={`h-full border-r border-hairline ${isWeekend ? 'bg-canvas-soft/50' : ''} ${isToday ? 'border-r-brand border-dashed border-r-2 bg-brand-wash/30 z-10 relative' : ''}`} style={{ width: '40px', flexShrink: 0 }}></div>
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
                                            
                                            // em dia · atenção a partir de 45 dias · vencido
                                            let barra = cor.ok;
                                            if (elapsedDays >= 45) barra = cor.brand;

                                            const isLate = c.daysRemaining90 < 0;
                                            if (isLate) barra = cor.danger;
                                            
                                            const pct = Math.min(100, Math.max(0, (elapsedDays / 90) * 100));

                                            const left45Px = end45Diff * 40 + 20;
                                            const left90Px = end90Diff * 40 + 20;

                                            return (
                                                <div key={c.matricula} className="h-[60px] border-b border-hairline/50 flex items-center relative shrink-0 w-full hover:bg-canvas-soft/50 transition-colors" onMouseEnter={(e) => {
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
                                                        <div className="absolute top-0 bottom-0 border-l border-brand-hot border-dashed z-0" style={{ left: `${left45Px}px` }}>
                                                        </div>
                                                    )}

                                                    {/* 90 Day Marker */}
                                                    {left90Px > 0 && left90Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-0 bottom-0 border-l border-danger/50 border-dashed z-0" style={{ left: `${left90Px}px` }}>
                                                        </div>
                                                    )}

                                                    <div 
                                                        className="absolute top-1/2 -translate-y-1/2 flex items-center z-20 cursor-pointer rounded-full shadow-1 overflow-hidden" 
                                                        style={{ left: `${leftPx}px`, width: `${widthPx}px`, height: '24px', backgroundColor: barra, opacity: .5 }}
                                                    >
                                                        <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: barra }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-ink">{Math.round(pct)}%</span>
                                                        </div>
                                                    </div>

                                                    {/* 45 Day Icon */}
                                                    {left45Px > 0 && left45Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ left: `${left45Px - 8}px` }} title="Vencimento 45 dias">
                                                            <div className="w-[16px] h-[16px] bg-brand text-on-brand rounded-full flex items-center justify-center font-bold text-[10px] shadow-1">!</div>
                                                        </div>
                                                    )}

                                                    {/* 90 Day Icon */}
                                                    {left90Px > 0 && left90Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ left: `${left90Px - 8}px` }} title="Vencimento 90 dias">
                                                            <div className="w-[16px] h-[16px] bg-danger text-canvas rounded-full flex items-center justify-center font-bold text-[10px] shadow-1">!</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {filtered.length === 0 && (
                                            <div className="text-center text-ink-faint py-12 w-full absolute left-0">
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
                    className="fixed bg-canvas text-ink border border-hairline text-xs rounded-lg shadow-3 p-4 w-[250px] z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+15px)] transition-opacity duration-150"
                    style={{ left: `${Math.min(window.innerWidth - 130, Math.max(130, tooltipData.x))}px`, top: `${tooltipData.y}px` }}
                >
                    <div className="font-bold text-sm mb-1">{tooltipData.data.nome}</div>
                    <div className="text-ink-faint mb-2 border-b border-hairline pb-2">Entrada: {tooltipData.data.dtEntradaProduto}</div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-ink-faint">Vencimento 45d:</span>
                            <span className="font-bold text-brand-hot">{tooltipData.data.calc.vence45}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-faint">Restante (45):</span>
                            <span className="font-bold">{tooltipData.data.daysRemaining45 < 0 ? 'Venceu' : `${tooltipData.data.daysRemaining45} dias`}</span>
                        </div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-hairline">
                            <span className="text-ink-faint">Vencimento 90d:</span>
                            <span className="font-bold text-danger">{tooltipData.data.calc.vence90}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-faint">Restante (90):</span>
                            <span className="font-bold">{tooltipData.data.daysRemaining90 < 0 ? 'Venceu' : `${tooltipData.data.daysRemaining90} dias`}</span>
                        </div>
                    </div>
                </div>
            )}
           </Table.Card>
      </div>
    );
}

