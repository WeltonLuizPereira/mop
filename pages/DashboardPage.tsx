import React, { useState, useEffect } from 'react';
import { User, type Client, type Collaborator, type Ilha, type Operation } from '../types';
import { db } from '../services/mockDb';
import { computeIlhaStats, totaisGerais, type Ordem } from '../lib/ilhaStats';
import { IlhaTile } from '../components/dashboard/IlhaTile';
import { ChipSelect } from '../components/ui';

export const DashboardPage: React.FC<{ currentUser: User, onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [cliente, setCliente] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

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

  const doCliente = cliente ? ilhas.filter(i => i.clientId === cliente) : ilhas;
  const stats = computeIlhaStats(doCliente, collabs, clients, operations, ordem);
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

      <div className="flex items-center flex-wrap gap-3.5 mb-3.5">
        <h2 className="t-eyebrow text-ink-faint flex-1">Ilhas em operação</h2>
        <ChipSelect
          rotulo="Cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          aria-label="Filtrar ilhas por cliente"
        >
          <option value="">todos</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </ChipSelect>
        <ChipSelect
          rotulo="Ordenar"
          value={ordem}
          onChange={e => setOrdem(e.target.value as Ordem)}
          aria-label="Ordenar as ilhas"
        >
          <option value="nome">A → Z</option>
          <option value="asc">em operação ↑</option>
          <option value="desc">em operação ↓</option>
        </ChipSelect>
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-ink-mute py-16 text-center">
          Nenhuma ilha desse cliente. Escolha outro cliente ou volte para todos.
        </p>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(286px, 1fr))' }}>
          {stats.map(ilha => (
            <IlhaTile key={ilha.id} ilha={ilha} onOpen={() => onNavigate('collaborators')} />
          ))}
        </div>
      )}
    </div>
  );
};
