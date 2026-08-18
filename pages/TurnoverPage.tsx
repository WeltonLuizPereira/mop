import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, FileSpreadsheet, FileDown, CalendarDays } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';
import {
  Collaborator, Client, Operation, Ilha, Supervisor, CollaboratorStatus
} from '../types';
import { db } from '../services/mockDb';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Button, ChipSelect, Table } from '../components/ui';
import { useChartTokens } from '../lib/tokens';

export const TurnoverPage = () => {
    // o gráfico recebe cor como valor; os tokens vêm do tema em vigor
    const cor = useChartTokens();
    const eixo = { fontSize: 10, fill: cor.inkFaint };
    const painel = {
        backgroundColor: cor.canvas, borderRadius: '8px',
        border: `1px solid ${cor.hairline}`, fontSize: '12px', color: cor.ink2,
    };
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
    /** 4.35 vira "4,35": relatório de RH brasileiro não usa ponto decimal. */
    const taxa = (v: string | number) =>
        Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const rotuloPeriodo = selectedMonth === -1
        ? String(selectedYear)
        : `${months[selectedMonth].toLowerCase()} de ${selectedYear}`;

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
            {/* Uma faixa de contexto: periodo, recortes e exportacao, em chips. */}
            <div className="flex items-center flex-wrap gap-2.5">
                <span className="t-eyebrow text-ink-faint mr-1">Período e recorte</span>
                <ChipSelect rotulo="Mês" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                    <option value={-1}>todos</option>
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </ChipSelect>
                <ChipSelect rotulo="Ano" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </ChipSelect>
                <ChipSelect rotulo="Cliente" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                    <option value="">todos</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </ChipSelect>
                <ChipSelect rotulo="Operação" value={filterOp} onChange={e => setFilterOp(e.target.value)}>
                    <option value="">todas</option>
                    {operations
                        .filter(o => !filterClient || o.clientId === filterClient)
                        .map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </ChipSelect>
                <ChipSelect rotulo="Ilha" value={filterIlha} onChange={e => setFilterIlha(e.target.value)}>
                    <option value="">todas</option>
                    {ilhas
                        .filter(i => (!filterClient || i.clientId === filterClient) && (!filterOp || i.operationId === filterOp))
                        .map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </ChipSelect>
                <ChipSelect rotulo="Supervisor" value={filterSup} onChange={e => setFilterSup(e.target.value)}>
                    <option value="">todos</option>
                    {supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </ChipSelect>

                <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" onClick={() => handleExport('excel')}>
                        <FileSpreadsheet size={15} /> Excel
                    </Button>
                    <Button variant="ghost" onClick={() => handleExport('pdf')}>
                        <FileDown size={15} /> PDF
                    </Button>
                </div>
            </div>

            {/* O relatório inteiro é uma resposta a "quanto do quadro girou?" —
                e à pergunta que sempre vem depois, "como você chegou nesse
                número?". Por isso a conta aparece ao lado do resultado, com os
                valores do período no lugar, e não numa nota de rodapé. */}
            <div id="turnover-report-content" className="space-y-8">
                <section className="pb-8 border-b border-hairline">
                    <span className="t-eyebrow text-ink-faint">Turnover · {rotuloPeriodo}</span>

                    <div className="mt-5 flex flex-wrap items-center gap-x-14 gap-y-8">
                        <div>
                            <div className="font-display font-bold text-[64px] leading-none tracking-[-.03em] tabular-nums text-ink">
                                {taxa(metrics.turnoverRate)}<span className="text-ink-mute text-[34px]">%</span>
                            </div>
                            <p className="text-sm text-ink-mute mt-2.5">do quadro girou no período</p>
                        </div>

                        {/* a fórmula com os números do período no lugar das palavras */}
                        <div className="flex items-center gap-3 t-data text-[13px] text-ink-mute">
                            <div className="text-center">
                                <div className="px-2 pb-1.5">
                                    ({metrics.admissionsCount} + {metrics.terminationsCount}) ÷ 2
                                </div>
                                <div className="px-2 pt-1.5 border-t border-hairline-2">
                                    {metrics.headcount}
                                </div>
                            </div>
                            <span>× 100</span>
                        </div>
                    </div>

                    {/* a mesma faixa de totais que abre a Visão geral */}
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 mt-8">
                        {([['taxa de desligamento', `${taxa(metrics.terminationRate)}%`],
                           ['admissões', metrics.admissionsCount],
                           ['desligamentos', metrics.terminationsCount],
                           ['de quadro médio', metrics.headcount]] as const)
                          .map(([rotulo, valor], i) => (
                            <React.Fragment key={rotulo}>
                                {i > 0 && <div className="w-px h-4 bg-hairline-2" aria-hidden="true" />}
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-display font-bold text-[21px] tracking-tight tabular-nums text-ink">{valor}</span>
                                    <span className="text-[13px] text-ink-mute">{rotulo}</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </section>

                {/* Quanto tempo de casa tinha quem saiu — a distribuição é a
                    história aqui, então cada faixa carrega sua própria barra. */}
                <section>
                    <h3 className="t-eyebrow text-ink-faint mb-4">Tempo de casa de quem saiu</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border border-hairline rounded-lg overflow-hidden">
                        {([['até 90 dias', metrics.tenure90],
                           ['91 a 180 dias', metrics.tenure180],
                           ['181 a 365 dias', metrics.tenure365],
                           ['mais de 365 dias', metrics.tenureMoreThan365]] as const)
                          .map(([faixa, n]) => {
                            const parte = metrics.terminationsCount > 0 ? n / metrics.terminationsCount : 0;
                            return (
                                <div key={faixa} className="bg-canvas p-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-display font-bold text-[28px] leading-none tabular-nums text-ink">{n}</span>
                                        <span className="text-[13px] text-ink-mute">{Math.round(parte * 100)}%</span>
                                    </div>
                                    <p className="text-[13px] text-ink-mute mt-1.5">{faixa}</p>
                                    <div className="h-0.5 bg-hairline mt-3 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand rounded-full" style={{ width: `${parte * 100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>


            {/* As duas taxas contam a mesma história no mesmo período: separadas
                em dois painéis, ninguém consegue compará-las. */}
            <section className="border border-hairline rounded-lg bg-canvas p-6 h-80 flex flex-col">
                <div className="flex items-baseline gap-4 mb-4">
                    <h3 className="t-eyebrow text-ink-faint">As duas taxas, mês a mês</h3>
                    <div className="flex items-center gap-4 text-[12px] text-ink-mute">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 rounded-full" style={{ background: cor.brand }} />
                            turnover
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 rounded-full" style={{ background: cor.danger }} />
                            desligamento
                        </span>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={cor.brand} stopOpacity={0.16}/>
                                    <stop offset="95%" stopColor={cor.brand} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cor.hairline} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={eixo} />
                            <YAxis axisLine={false} tickLine={false} tick={eixo} unit="%" />
                            <RechartsTooltip contentStyle={painel} />
                            <Area type="monotone" dataKey="turnover" stroke={cor.brand} strokeWidth={2}
                                  fillOpacity={1} fill="url(#colorTurnover)" name="Turnover %" isAnimationActive={false} />
                            <Area type="monotone" dataKey="terminationRate" stroke={cor.danger} strokeWidth={2}
                                  fill="none" name="Desligamento %" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <section className="border border-hairline rounded-lg bg-canvas p-6 h-96 flex flex-col lg:col-span-2">
                    <div className="flex items-baseline gap-4 mb-4 flex-wrap">
                        <h3 className="t-eyebrow text-ink-faint">Quem entrou, quem saiu</h3>
                        <div className="flex items-center gap-4 text-[12px] text-ink-mute">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-xs" style={{ background: cor.ok }} />
                                admissões
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-xs" style={{ background: cor.danger }} />
                                desligamentos
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cor.hairline} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={eixo} />
                                <YAxis axisLine={false} tickLine={false} tick={eixo} />
                                <RechartsTooltip cursor={{ fill: cor.hairline, fillOpacity: .35 }} contentStyle={painel} />
                                <Bar dataKey="admissoes" name="Admissões" fill={cor.ok} radius={[2, 2, 0, 0]} barSize={20} isAnimationActive={false} />
                                <Bar dataKey="desligamentos" name="Desligamentos" fill={cor.danger} radius={[2, 2, 0, 0]} barSize={20} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="border border-hairline rounded-lg bg-canvas p-6 h-96 flex flex-col lg:col-span-3">
                    <h3 className="t-eyebrow text-ink-faint mb-4">Onde o turnover se concentra</h3>
                    <div className="flex-1 w-full min-h-0">

                         {ilhaChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ilhaChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={cor.hairline} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={eixo} unit="%" />
                                    <YAxis type="category" dataKey="name" width={170} axisLine={false} tickLine={false} tick={{ ...eixo, fill: cor.ink2, fontWeight: 500 }} />
                                    <RechartsTooltip 
                                        contentStyle={painel}
                                        formatter={(value: any, name: any, props: any) => [`${value}% Turnover`, `HC Médio: ${props.payload.headcount}`]}
                                    />
                                    <Bar dataKey="turnover" fill={cor.brand} radius={[0, 4, 4, 0]} barSize={15} name="Turnover %" isAnimationActive={false}>
                                         {ilhaChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index < 3 ? cor.brandHot : cor.brand} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-ink-faint">
                                 <AlertCircle size={24} className="mb-2 opacity-50"/>
                                 <p className="text-xs">Sem dados suficientes de HC para as ilhas selecionadas.</p>
                             </div>
                         )}
                    </div>
                </section>
            </div>

            {selectedMonth === -1 && (
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2"><CalendarDays size={16} className="text-brand"/> Detalhamento mensal</h3>
                    <Table.Card>
                        <Table.Toolbar
                            contagem={{ n: chartData.length, um: 'mês', varios: 'meses' }}
                        />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-ink-mute border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 border-b border-hairline">Mês</th>
                                    <th className="p-3 num border-b border-hairline">Ativos Início</th>
                                    <th className="p-3 num border-b border-hairline">Admissões</th>
                                    <th className="p-3 num border-b border-hairline">Desligamentos</th>
                                    <th className="p-3 num border-b border-hairline">Ativos Fim</th>
                                    <th className="p-3 num border-b border-hairline" title="Média de Movimentação = (Admissões + Desligamentos) / 2">Média Mov.</th>
                                    <th className="p-3 num border-b border-hairline" title="Headcount Médio = (Ativos Início + Ativos Fim) / 2">HC Médio</th>
                                    <th className="p-3 num border-b border-hairline">Turnover (%)</th>
                                    <th className="p-3 num border-b border-hairline">Taxa Deslig. (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {chartData.map((d, i) => (
                                    <tr key={i} className="hover:bg-canvas-soft/50">
                                        <td className="p-3 font-semibold text-ink">{d.name}</td>
                                        <td className="p-3 num">{d.activeAtStart}</td>
                                        <td className="p-3 num text-ok">{d.admissoes}</td>
                                        <td className="p-3 num text-danger">{d.desligamentos}</td>
                                        <td className="p-3 num">{d.activeAtEnd}</td>
                                        <td className="p-3 num">{taxa((d.admissoes + d.desligamentos) / 2)}</td>
                                        <td className="p-3 num">{d.avgHeadcount}</td>
                                        <td className="p-3 num">{taxa(d.turnover)}%</td>
                                        <td className="p-3 num">{taxa(d.terminationRate)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </Table.Card>
                </div>
            )}
            </div>
        </div>
    );
};
