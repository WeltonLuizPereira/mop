import React, { useEffect, useState } from 'react';
import type { Collaborator, Ilha, Operation, Supervisor } from '../types';
import { db } from '../services/mockDb';
import { distribuir, doQuadro } from '../lib/distribuicaoStats';
import { DistribuicaoCard } from '../components/dashboard/DistribuicaoCard';

/** Por qual cadastro a lista de colaboradores será recortada no clique. */
export type CampoLista = 'operacao' | 'ilha' | 'supervisor';

interface DistribuicaoPageProps {
  onAbrirLista: (campo: CampoLista, id: string) => void;
}

export const DistribuicaoPage: React.FC<DistribuicaoPageProps> = ({ onAbrirLista }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [c, op, i, s] = await Promise.all([
        db.getCollaborators(),
        db.getOperations(),
        db.getIlhas(),
        db.getSupervisors(),
      ]);
      setCollabs(c);
      setOperations(op);
      setIlhas(i);
      setSupervisors(s);
      setCarregando(false);
    };
    load();
  }, []);

  if (carregando) {
    return <p className="text-sm text-ink-mute py-20 text-center">Carregando a distribuição…</p>;
  }

  const base = doQuadro(collabs).length;

  const porOperacao = distribuir(collabs, c => c.operationId, operations, 'Sem operação definida');
  const porIlha = distribuir(collabs, c => c.ilhaId, ilhas, 'Sem ilha definida');
  const porSupervisor = distribuir(collabs, c => c.supervisorId, supervisors, 'Sem supervisor definido');

  return (
    <div>
      <div className="mb-6">
        <p className="flex items-baseline gap-1.5">
          <span className="font-display font-bold text-[21px] tracking-tight tabular-nums text-ink">
            {base.toLocaleString('pt-BR')}
          </span>
          <span className="text-[13px] text-ink-mute">
            {base === 1 ? 'pessoa no quadro' : 'pessoas no quadro'}
          </span>
        </p>
        {/* Dizer a base evita a pergunta que todo percentual de tela levanta:
            porcentagem de quê. Desligado fica fora, como no mapa de ilhas. */}
        <p className="text-xs text-ink-faint mt-1">
          Base de todos os percentuais desta tela. Desligados ficam de fora.
        </p>
      </div>

      <h2 className="t-eyebrow text-ink-faint mb-3.5">Distribuição</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DistribuicaoCard
          titulo="Por operação"
          unidade={{ um: 'operação', varios: 'operações' }}
          acento="operacao"
          fatias={porOperacao}
          onAbrir={id => onAbrirLista('operacao', id)}
        />
        <DistribuicaoCard
          titulo="Por ilha"
          unidade={{ um: 'ilha', varios: 'ilhas' }}
          acento="ilha"
          fatias={porIlha}
          onAbrir={id => onAbrirLista('ilha', id)}
        />
        <DistribuicaoCard
          titulo="Por supervisor"
          unidade={{ um: 'supervisor', varios: 'supervisores' }}
          acento="supervisor"
          fatias={porSupervisor}
          onAbrir={id => onAbrirLista('supervisor', id)}
        />
      </div>
    </div>
  );
};
