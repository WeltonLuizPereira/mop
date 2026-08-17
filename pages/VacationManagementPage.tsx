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
