import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Collaborator, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Badge, Button, EmptyState, InlineNotice, LoadingState, MetricStrip, PageToolbar, Table, Tag } from '../components/ui';

export interface AvisoPrevioPageProps {
  onBack?: () => void;
  onViewDetails?: (collaborator: Collaborator) => void;
}

export const AvisoPrevioPage: React.FC<AvisoPrevioPageProps> = ({ onBack, onViewDetails }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [falhouCarga, setFalhouCarga] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setFalhouCarga(false);
      setCollabs(await db.getCollaborators());
    } catch {
      setFalhouCarga(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = collabs
    .filter(c => c.status === CollaboratorStatus.AVISO_PREVIO)
    .map(c => {
      let daysLeft = 0;
      if (c.dataFim) {
        const parts = c.dataFim.split('-');
        const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      }
      return { ...c, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="flex flex-col gap-5">
      <PageToolbar
        description="Acompanhe os colaboradores em aviso prévio e o prazo restante de cada um."
        actions={onBack && (
          <Button variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" size={16} /> Voltar</Button>
        )}
      />

      {isLoading ? (
        <div className="rounded-lg border border-hairline bg-canvas-soft"><LoadingState label="Carregando aviso prévio" /></div>
      ) : falhouCarga ? (
        <InlineNotice
          tone="error"
          title="Falha ao carregar aviso prévio"
          action={<Button variant="secondary" size="sm" onClick={() => void load()}>Tentar de novo</Button>}
        >
          Não foi possível consultar os colaboradores em aviso prévio.
        </InlineNotice>
      ) : (
        <>
          <div className="rounded-lg border border-hairline">
            <div className="flex items-center gap-3 bg-canvas-soft p-3">
              <MetricStrip label="Resumo da lista" items={[{ label: 'em aviso prévio', value: filtered.length }]} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas-soft">
              <EmptyState
                title="Nenhum colaborador em aviso prévio"
                description="Não há avisos prévios em andamento no momento."
              />
            </div>
          ) : (
            <Table label="Aviso prévio">
              <Table.Head>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Data final</Table.Th>
                <Table.Th>Dias restantes</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Head>
              <Table.Body>
                {filtered.map(c => (
                  <Table.Row
                    key={c.matricula}
                    activationLabel={`Abrir detalhes de ${c.nome}`}
                    onActivate={() => onViewDetails?.(c)}
                  >
                    <Table.Td className="font-medium text-ink">{c.nome}</Table.Td>
                    <Table.Td className="t-data">{formatDateString(c.dataFim)}</Table.Td>
                    <Table.Td>
                      <Tag className={c.daysLeft <= 5 ? 'text-danger' : c.daysLeft <= 15 ? 'text-brand-text' : ''}>
                        {c.daysLeft} dias
                      </Tag>
                    </Table.Td>
                    <Table.Td><Badge status={c.status} /></Table.Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </>
      )}
    </div>
  );
};
