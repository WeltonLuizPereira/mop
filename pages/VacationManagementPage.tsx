import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, History, Search, AlertTriangle } from 'lucide-react';
import { Collaborator, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, addDays, getInitials } from '../utils';
import { Button } from '../components/ui';

export const VacationManagementPage = ({ currentUser, onBack, onViewDetails }: any) => {
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
                  <p className="text-[13px] text-ink-mute">
                      <span className="t-data text-ink">{activeVacations.length}</span> em férias
                  </p>
              </div>
           </div>
           <div className="flex gap-4 border-b border-hairline">
               <button 
                   className={`pb-2 px-1 text-sm font-bold transition-colors ${activeTab === 'mapa' ? 'border-b-2 border-brand text-brand' : 'text-ink-mute hover:text-ink'}`}
                   onClick={() => setActiveTab('mapa')}
               >
                   Mapa de férias
               </button>
               <button 
                   className={`pb-2 px-1 text-sm font-bold transition-colors ${activeTab === 'historico' ? 'border-b-2 border-brand text-brand' : 'text-ink-mute hover:text-ink'}`}
                   onClick={() => setActiveTab('historico')}
               >
                   Histórico de férias
               </button>
           </div>

           <div>
              {activeTab === 'mapa' ? (
                <>
                    <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                        <Sun size={18} className="text-brand" />
                        Férias ativas e programadas
                    </h3>
                    <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
                        <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                            <thead>
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
                            <tbody className="divide-y divide-hairline">
                                {activeVacations.map(c => {
                                    const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                                    const daysUntil = getDaysUntilReturn(c.feriasFim);
                                    const isAlert = false;

                                    return (
                                        <tr key={c.matricula} className={`hover:bg-canvas-soft cursor-pointer transition-colors ${isAlert ? 'bg-danger/10 hover:bg-danger/15' : ''}`} onClick={() => onViewDetails && onViewDetails(c)}>
                                            <td className="p-4">
                                                 <div className="w-9 h-9 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-xs">
                                                    {getInitials(c.nome)}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-ink">{c.nome}</td>
                                            <td className="p-4">
                                                <span className="font-display text-xs tracking-[-.01em] text-ink-2">{ilhaName}</span>
                                            </td>
                                            <td className="p-4 dado text-ink-mute">{formatDateString(c.feriasInicio)}</td>
                                            <td className="p-4 dado text-ink-mute">{formatDateString(c.feriasFim)}</td>
                                            {/* a data de retorno é a que importa nesta tela, então ela fica
                                                em tinta cheia — verde aqui diria "deu certo", que não é o caso */}
                                            <td className="p-4 dado text-ink">
                                                {c.feriasFim ? addDays(c.feriasFim, 1) : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {isAlert ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-danger/15 text-danger text-xs font-bold animate-pulse">
                                                        <AlertTriangle size={12} />
                                                        Em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-ink-mute font-medium">
                                                        {daysUntil === 999 ? '-' : daysUntil < 0 ? 'Retornou' : `Em ${daysUntil} dias`}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activeVacations.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-ink-faint text-xs">
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
                        <h3 className="font-bold text-ink flex items-center gap-2">
                            <History size={18} className="text-ink-mute" />
                            Histórico de férias
                            <span className="bg-canvas-sunk text-ink-mute px-2 py-0.5 rounded-full text-xs font-bold">{filteredHistory.length}</span>
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar nome ou matrícula"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-hairline rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-brand focus:border-brand"
                                />
                            </div>
                            <select 
                                value={historyYear}
                                onChange={(e) => setHistoryYear(e.target.value)}
                                className="px-3 py-2 border border-hairline rounded-lg text-sm bg-canvas focus:ring-2 focus:ring-brand"
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
                                className="px-3 py-2 border border-hairline rounded-lg text-sm bg-canvas focus:ring-2 focus:ring-brand"
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
                    <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
                        <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                            <thead>
                                <tr>
                                    <th className="p-4 w-16"></th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Ilha</th>
                                    <th className="p-4">Início</th>
                                    <th className="p-4">Fim</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {filteredHistory.map(h => {
                                    const c = collabs.find(col => col.matricula === h.collaborator_matricula);
                                    const nome = c ? c.nome : 'Desconhecido';
                                    const ilhaName = c ? (ilhas.find(i => i.id === c.ilhaId)?.nome || '-') : '-';
                                    return (
                                        <tr key={h.id} className="hover:bg-canvas-soft transition-colors">
                                            <td className="p-4">
                                                <div className="w-9 h-9 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-xs">
                                                    {getInitials(nome)}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-ink">{nome}</td>
                                            <td className="p-4"><span className="font-display text-xs tracking-[-.01em] text-ink-2">{ilhaName}</span></td>
                                            <td className="p-4 dado">{formatDateString(h.start_date)}</td>
                                            <td className="p-4 dado">{formatDateString(h.end_date)}</td>
                                        </tr>
                                    );
                                })}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-ink-faint text-xs">
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
