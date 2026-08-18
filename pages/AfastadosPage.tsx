import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Collaborator, Supervisor, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Badge, Button, EmptyState, InlineNotice, LoadingState, MetricStrip, PageToolbar, Table } from '../components/ui';

export interface AfastadosPageProps {
  onBack?: () => void;
  onViewDetails?: (collaborator: Collaborator) => void;
}

export const AfastadosPage: React.FC<AfastadosPageProps> = ({ onBack, onViewDetails }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [falhouCarga, setFalhouCarga] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setFalhouCarga(false);
      const [colabs, ilhasList, supers] = await Promise.all([
        db.getCollaborators(), db.getIlhas(), db.getSupervisors(),
      ]);
      setCollabs(colabs);
      setIlhas(ilhasList);
      setSupervisors(supers);
    } catch {
      setFalhouCarga(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = collabs.filter(c =>
    c.status === CollaboratorStatus.AFASTADO || c.status === CollaboratorStatus.LICENCA_MATERNIDADE
  );
  const countAfastado = filtered.filter(c => c.status === CollaboratorStatus.AFASTADO).length;
  const countLicenca = filtered.filter(c => c.status === CollaboratorStatus.LICENCA_MATERNIDADE).length;

  return (
    <div className="flex flex-col gap-5">
      <PageToolbar
        description="Acompanhe quem está afastado ou em licença maternidade."
        actions={onBack && (
          <Button variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" size={16} /> Voltar</Button>
        )}
      />

      {isLoading ? (
        <div className="rounded-lg border border-hairline bg-canvas-soft"><LoadingState label="Carregando afastados" /></div>
      ) : falhouCarga ? (
        <InlineNotice
          tone="error"
          title="Falha ao carregar afastados"
          action={<Button variant="secondary" size="sm" onClick={() => void load()}>Tentar de novo</Button>}
        >
          Não foi possível consultar os afastamentos.
        </InlineNotice>
      ) : (
        <>
          <div className="rounded-lg border border-hairline">
            <div className="flex items-center gap-3 bg-canvas-soft p-3">
              <MetricStrip
                label="Resumo da lista"
                items={[
                  { label: 'Afastamento médico/INSS', value: countAfastado },
                  { label: 'Licença maternidade', value: countLicenca },
                ]}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas-soft">
              <EmptyState
                title="Nenhum colaborador afastado"
                description="Não há afastamentos ou licenças em andamento no momento."
              />
            </div>
          ) : (
            <Table label="Afastados e licenças">
              <Table.Head>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Data início</Table.Th>
                <Table.Th>Ilha</Table.Th>
                <Table.Th>Supervisor</Table.Th>
              </Table.Head>
              <Table.Body>
                {filtered.map(c => {
                  const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome ?? '—';
                  const sup = supervisors.find(s => s.id === c.supervisorId)?.nome ?? '—';
                  return (
                    <Table.Row
                      key={c.matricula}
                      activationLabel={`Abrir detalhes de ${c.nome}`}
                      onActivate={() => onViewDetails?.(c)}
                    >
                      <Table.Td className="font-medium text-ink">{c.nome}</Table.Td>
                      <Table.Td><Badge status={c.status} /></Table.Td>
                      <Table.Td className="t-data">{formatDateString(c.dataAfastamento)}</Table.Td>
                      <Table.Td>{ilha}</Table.Td>
                      <Table.Td>{sup}</Table.Td>
                    </Table.Row>
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
