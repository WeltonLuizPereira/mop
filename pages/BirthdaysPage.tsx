import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Collaborator, Ilha } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Button, EmptyState, InlineNotice, LoadingState, MetricStrip, PageToolbar, Select, Table } from '../components/ui';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export interface BirthdaysPageProps {
  onBack?: () => void;
}

export const BirthdaysPage: React.FC<BirthdaysPageProps> = ({ onBack }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(true);
  const [falhouCarga, setFalhouCarga] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setFalhouCarga(false);
      const [colabs, ilhasList] = await Promise.all([db.getCollaborators(), db.getIlhas()]);
      setCollabs(colabs);
      setIlhas(ilhasList);
    } catch {
      setFalhouCarga(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = collabs
    .filter(c => {
      if (!c.dtNasc) return false;
      const m = parseInt(c.dtNasc.split('-')[1]) - 1;
      return m === month;
    })
    .sort((a, b) => {
      const dayA = parseInt(a.dtNasc.split('-')[2]);
      const dayB = parseInt(b.dtNasc.split('-')[2]);
      return dayA - dayB;
    });

  return (
    <div className="flex flex-col gap-5">
      <PageToolbar
        description="Consulte quem faz aniversário no mês selecionado."
        filters={(
          <div className="flex flex-wrap items-end gap-2" aria-label="Referência do mês">
            <span className="t-eyebrow mb-2.5 mr-1 text-ink-faint">Mês</span>
            <Select
              aria-label="Mês de referência"
              className="w-auto min-w-40"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
            >
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </Select>
          </div>
        )}
        actions={onBack && (
          <Button variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" size={16} /> Voltar</Button>
        )}
      />

      {isLoading ? (
        <div className="rounded-lg border border-hairline bg-canvas-soft"><LoadingState label="Carregando aniversariantes" /></div>
      ) : falhouCarga ? (
        <InlineNotice
          tone="error"
          title="Falha ao carregar aniversariantes"
          action={<Button variant="secondary" size="sm" onClick={() => void load()}>Tentar de novo</Button>}
        >
          Não foi possível consultar os aniversariantes.
        </InlineNotice>
      ) : (
        <>
          <div className="rounded-lg border border-hairline">
            <div className="flex items-center gap-3 bg-canvas-soft p-3">
              <MetricStrip
                label="Resumo da lista"
                items={[{ label: filtered.length === 1 ? 'aniversariante' : 'aniversariantes', value: filtered.length }]}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas-soft">
              <EmptyState
                title="Nenhum aniversariante neste mês"
                description={`Não há registros de aniversário em ${MESES[month]}.`}
              />
            </div>
          ) : (
            <Table label="Aniversariantes">
              <Table.Head>
                <Table.Th>Dia</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Ilha</Table.Th>
                <Table.Th>Data completa</Table.Th>
              </Table.Head>
              <Table.Body>
                {filtered.map(c => {
                  const ilhaName = ilhas.find(i => i.id === c.ilhaId)?.nome ?? '—';
                  const day = c.dtNasc ? c.dtNasc.split('-')[2] : '--';
                  return (
                    <tr key={c.matricula}>
                      <Table.Td className="t-data">{day}</Table.Td>
                      <Table.Td className="font-medium text-ink">{c.nome}</Table.Td>
                      <Table.Td>{ilhaName}</Table.Td>
                      <Table.Td className="t-data">{formatDateString(c.dtNasc)}</Table.Td>
                    </tr>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </>
      )}
    </div>
  );
};
