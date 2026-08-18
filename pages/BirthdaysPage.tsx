import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Collaborator, Ilha } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Button, ChipSelect } from '../components/ui';

export const BirthdaysPage = ({ onBack }: any) => {
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
              </div>
              <ChipSelect rotulo="Mês" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </ChipSelect>
           </div>
           
           <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
                <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                     <thead>
                         <tr>
                             <th className="p-4 w-24 text-center">Dia</th>
                             <th className="p-4">Nome</th>
                             <th className="p-4">Ilha</th>
                             <th className="p-4">Data Completa</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-hairline">
                         {filtered.map(c => {
                             const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                             const day = c.dtNasc ? c.dtNasc.split('-')[2] : '--';
                             return (
                                 <tr key={c.matricula} className="hover:bg-canvas-soft">
                                     <td className="p-4 flex justify-center">
                                        <div className="w-10 h-10 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-2 flex items-center justify-center font-bold text-lg">
                                            {day}
                                        </div>
                                     </td>
                                     <td className="p-4 font-medium text-ink">{c.nome}</td>
                                     <td className="p-4"><span className="font-display text-xs tracking-[-.01em] text-ink-2">{ilhaName}</span></td>
                                     <td className="p-4 dado">{formatDateString(c.dtNasc)}</td>
                                 </tr>
                             )
                         })}
                         {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-ink-faint">Nenhum aniversariante neste mês.</td></tr>}
                     </tbody>
                </table>
           </div>
      </div>
  )
}

