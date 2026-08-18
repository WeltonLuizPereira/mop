import React, { useCallback, useEffect, useState } from 'react';
import { HistoryLog } from '../types';
import { db } from '../services/mockDb';
import { Button, EmptyState, InlineNotice, LoadingState, MetricStrip, PageToolbar, Table, Tag } from '../components/ui';

// A cor reforça a leitura, mas o texto do próprio Tag já comunica o tipo —
// nenhum estado depende só da cor (spec §10).
const CLASSE_POR_TIPO: Record<HistoryLog['type'], string> = {
  create: 'text-ok',
  delete: 'text-danger',
  update: '',
  import: '',
};

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [falhouCarga, setFalhouCarga] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setFalhouCarga(false);
      // A ordenação já acontece em services/mockDb.ts (o formato de data
      // PT-BR não ordena corretamente no SQL); a página só exibe o que
      // recebe, sem reordenar.
      setLogs(await db.getHistory());
    } catch {
      setFalhouCarga(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <PageToolbar description="Consulte as últimas alterações realizadas no sistema." />

      {isLoading ? (
        <div className="rounded-lg border border-hairline bg-canvas-soft"><LoadingState label="Carregando histórico" /></div>
      ) : falhouCarga ? (
        <InlineNotice
          tone="error"
          title="Falha ao carregar histórico"
          action={<Button variant="secondary" size="sm" onClick={() => void load()}>Tentar de novo</Button>}
        >
          Não foi possível consultar o histórico de atividades.
        </InlineNotice>
      ) : (
        <>
          <div className="rounded-lg border border-hairline">
            <div className="flex items-center gap-3 bg-canvas-soft p-3">
              <MetricStrip
                label="Resumo da lista"
                items={[{ label: logs.length === 1 ? 'registro' : 'registros', value: logs.length }]}
              />
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas-soft">
              <EmptyState
                title="Nenhum registro no histórico"
                description="As próximas alterações realizadas no sistema aparecerão aqui."
              />
            </div>
          ) : (
            <Table label="Histórico de atividades">
              <Table.Head>
                <Table.Th>Data/hora</Table.Th>
                <Table.Th>Usuário</Table.Th>
                <Table.Th>Ação</Table.Th>
                <Table.Th>Alvo</Table.Th>
                <Table.Th>Detalhes</Table.Th>
              </Table.Head>
              <Table.Body>
                {logs.map(log => (
                  <tr key={log.id}>
                    <Table.Td className="t-data text-ink-mute">{log.date}</Table.Td>
                    <Table.Td className="font-medium">{log.user}</Table.Td>
                    <Table.Td><Tag className={CLASSE_POR_TIPO[log.type]}>{log.action}</Tag></Table.Td>
                    <Table.Td className="font-medium text-ink">{log.target}</Table.Td>
                    <Table.Td className="text-ink-mute">{log.details || '-'}</Table.Td>
                  </tr>
                ))}
              </Table.Body>
            </Table>
          )}
        </>
      )}
    </div>
  );
};
