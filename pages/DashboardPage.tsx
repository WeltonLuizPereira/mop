import React, { useState, useEffect } from 'react';
import { User, type Client, type Collaborator, type Ilha, type Operation } from '../types';
import { db } from '../services/mockDb';
import { computeIlhaStats, totaisGerais } from '../lib/ilhaStats';
import { IlhaTile } from '../components/dashboard/IlhaTile';

export const DashboardPage: React.FC<{ currentUser: User, onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [c, i, cli, op] = await Promise.all([
        db.getCollaborators(),
        db.getIlhas(),
        db.getClients(),
        db.getOperations(),
      ]);
      setCollabs(c);
      setIlhas(i);
      setClients(cli);
      setOperations(op);
      setCarregando(false);
    };
    load();
  }, []);

  const stats = computeIlhaStats(ilhas, collabs, clients, operations);
  const totais = totaisGerais(collabs);

  if (carregando) {
    return <p className="text-sm text-ink-mute py-20 text-center">Carregando o mapa…</p>;
  }

  if (ilhas.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="t-display-md text-ink">Nenhuma ilha cadastrada ainda.</p>
        <p className="text-sm text-ink-mute mt-2">
          Cadastre a primeira em Cadastros › Ilhas para ver o mapa.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 mb-6">
        {([['ativos', totais.ativos], ['em férias', totais.ferias],
           ['em aviso prévio', totais.aviso], ['afastados', totais.afastados]] as const)
          .map(([rotulo, n], i) => (
          <React.Fragment key={rotulo}>
            {i > 0 && <div className="w-px h-4 bg-hairline-2" aria-hidden="true" />}
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[21px] tracking-tight tabular-nums text-ink">
                {n.toLocaleString('pt-BR')}
              </span>
              <span className="text-[13px] text-ink-mute">{rotulo}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <h2 className="t-eyebrow text-ink-faint mb-3.5">Ilhas em operação</h2>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(286px, 1fr))' }}>
        {stats.map(ilha => (
          <IlhaTile key={ilha.id} ilha={ilha} onOpen={() => onNavigate('collaborators')} />
        ))}
      </div>
    </div>
  );
};
