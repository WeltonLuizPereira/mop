import React, { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Collaborator, Ilha } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import {
  Button, ChipSelect, Table, Carregando, FalhaAoCarregar, ListaVazia,
} from '../components/ui';
import { useAppData, useResource } from '../contexts/DataContext';

export const BirthdaysPage = ({ onBack }: any) => {
  const store = useAppData();
  const collabResource = useResource('collaborators');
  const ilhaResource = useResource('ilhas');
  const collabs = collabResource.data ?? [];
  const ilhas = ilhaResource.data ?? [];
  const [month, setMonth] = useState(new Date().getMonth());

  const carregando = [collabResource, ilhaResource].some(r => r.loading && !r.data);
  const falhou = [collabResource, ilhaResource].some(r => r.error && !r.data);

  const carregar = useCallback(async () => {
      await Promise.all([store.collaborators.invalidate(), store.ilhas.invalidate()]);
  }, [store]);

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
           <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>
           </div>

           <Table.Card>
                <Table.Toolbar
                    contagem={{ n: filtered.length, um: 'aniversariante', varios: 'aniversariantes' }}
                    chips={
                        <ChipSelect rotulo="Mês" aria-label="Mês de referência" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </ChipSelect>
                    }
                />
                {carregando ? (
                    <Carregando o_que="os aniversariantes" />
                ) : falhou ? (
                    <FalhaAoCarregar mensagem="Não foi possível carregar os aniversariantes." aoTentar={carregar} />
                ) : filtered.length === 0 ? (
                    <ListaVazia titulo="Nenhum aniversariante neste mês">
                        Escolha outro mês no filtro acima.
                    </ListaVazia>
                ) : (
                <Table label="Aniversariantes do mês">
                     <Table.Head>
                         <Table.Th className="w-24 text-center">Dia</Table.Th>
                         <Table.Th>Nome</Table.Th>
                         <Table.Th>Ilha</Table.Th>
                         <Table.Th>Data completa</Table.Th>
                     </Table.Head>
                     <tbody className="">
                         {filtered.map(c => {
                             const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                             const day = c.dtNasc ? c.dtNasc.split('-')[2] : '--';
                             return (
                                 <tr key={c.matricula} className="hover:bg-canvas-soft">
                                     <td className="p-4">
                                        <span className="mx-auto w-10 h-10 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-2 flex items-center justify-center font-bold text-lg">
                                            {day}
                                        </span>
                                     </td>
                                     <td className="p-4 font-medium text-ink">{c.nome}</td>
                                     <td className="p-4"><span className="font-display text-xs tracking-[-.01em] text-ink-2">{ilhaName}</span></td>
                                     <td className="p-4 dado">{formatDateString(c.dtNasc)}</td>
                                 </tr>
                             )
                         })}
                     </tbody>
                </Table>
                )}
           </Table.Card>
      </div>
  )
}

