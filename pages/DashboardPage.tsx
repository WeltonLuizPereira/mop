import React, { useState, useEffect } from 'react';
import { EntityStatus, User, type Client, type Collaborator, type Ilha, type Operation, type Provimento } from '../types';
import { db } from '../services/mockDb';
import { computeIlhaStats, consolidarIlhas, totaisGerais, type Ordem } from '../lib/ilhaStats';
import { referenciaDoMes } from '../lib/provimentoStats';
import { IlhaTile } from '../components/dashboard/IlhaTile';
import { GeralTile } from '../components/dashboard/GeralTile';
import { ChipSelect } from '../components/ui';
import { useResource } from '../contexts/DataContext';

export const DashboardPage: React.FC<{ currentUser: User, onAbrirIlha: (ilhaId: string) => void }> = ({ onAbrirIlha }) => {
  const collaboratorsResource = useResource('collaborators');
  const ilhasResource = useResource('ilhas');
  const clientsResource = useResource('clients');
  const operationsResource = useResource('operations');
  const collabs = collaboratorsResource.data ?? [];
  const ilhas = ilhasResource.data ?? [];
  const clients = clientsResource.data ?? [];
  const operations = operationsResource.data ?? [];
  const [provimentos, setProvimentos] = useState<Provimento[]>([]);
  const [carregandoProvimento, setCarregandoProvimento] = useState(true);
  const [cliente, setCliente] = useState('');
  const [operacao, setOperacao] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

  useEffect(() => {
    const load = async () => {
      const prov = await db.getProvimento(referenciaDoMes(new Date()));
      setProvimentos(prov);
      setCarregandoProvimento(false);
    };
    load();
  }, []);

  // Ilha inativa não está em operação: ela sai do mapa, mas continua no
  // cadastro para o histórico não perder a referência.
  const emOperacao = ilhas.filter(i => i.status === EntityStatus.ACTIVE);
  const recortadas = emOperacao
    .filter(i => !cliente || i.clientId === cliente)
    .filter(i => !operacao || i.operationId === operacao);

  // as operações oferecidas seguem o cliente escolhido — combinação
  // impossível não deve nem aparecer na lista
  const operacoesDoCliente = operations.filter(o => !cliente || o.clientId === cliente);

  const stats = computeIlhaStats(recortadas, collabs, clients, operations, provimentos, ordem);

  // Tudo na tela responde pelo mesmo recorte: a faixa de números, o card
  // consolidado e os tiles. Números de alcances diferentes lado a lado se
  // contradizem — o provimento da faixa e o do card são a mesma conta, feita
  // uma vez só, sobre as ilhas que estão à vista.
  const geral = consolidarIlhas(stats);
  const visiveis = new Set(recortadas.map(i => i.id));
  const totais = totaisGerais(collabs.filter(c => visiveis.has(c.ilhaId)));

  // A faixa segue a ordem em que a pergunta é feita: quanto foi contratado,
  // quanto está de pé, o que isso dá — e só depois onde está o resto do
  // quadro. Os três primeiros são uma conta só, lida da esquerda para a
  // direita; os outros três explicam quem não está no numerador.
  const numeros = [
    {
      rotulo: 'PA contratada',
      valor: geral.paContratada === null ? '—' : geral.paContratada.toLocaleString('pt-BR'),
      aceso: false,
    },
    { rotulo: 'ativos', valor: totais.ativos.toLocaleString('pt-BR'), aceso: false },
    {
      rotulo: 'provimento geral',
      valor: geral.provimento === null ? '—' : `${Math.round(geral.provimento * 100)}%`,
      // é o único número da faixa que tem limiar: abaixo de 80% ele acende no
      // mesmo quente que o anel dos cards usa para dizer a mesma coisa
      aceso: geral.provimento !== null && geral.provimento < 0.8,
    },
    { rotulo: 'em férias', valor: totais.ferias.toLocaleString('pt-BR'), aceso: false },
    { rotulo: 'em aviso prévio', valor: totais.aviso.toLocaleString('pt-BR'), aceso: false },
    { rotulo: 'afastados', valor: totais.afastados.toLocaleString('pt-BR'), aceso: false },
  ];

  const carregando = carregandoProvimento || [collaboratorsResource, ilhasResource, clientsResource, operationsResource]
    .some(resource => resource.loading && !resource.data);

  if (carregando) {
    return <p className="text-sm text-ink-mute py-20 text-center">Carregando o mapa…</p>;
  }

  if (emOperacao.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="t-display-md text-ink">
          {ilhas.length === 0 ? 'Nenhuma ilha cadastrada ainda.' : 'Nenhuma ilha ativa no momento.'}
        </p>
        <p className="text-sm text-ink-mute mt-2">
          {ilhas.length === 0
            ? 'Cadastre a primeira em Cadastros › Ilhas para ver o mapa.'
            : 'O mapa mostra só as ilhas ativas. Reative uma em Cadastros › Ilhas.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-9">
      <header className="mb-7">
        <h1 className="t-display-lg text-ink">Operação em perspectiva.</h1>
        <p className="mt-2 text-sm text-ink-mute">Pessoas, capacidade e movimentos de hoje.</p>
      </header>
      <div
        role="group"
        aria-label="Resumo do quadro"
        className="mb-8 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-hairline py-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        {numeros.map(({ rotulo, valor, aceso }) => (
          <div key={rotulo} className="flex flex-col gap-0.5">
            <strong
              className={`font-display text-[21px] font-bold tracking-tight tabular-nums
                          ${aceso ? 'text-brand-hot' : 'text-ink'}`}
            >
              {valor}
            </strong>
            <span className="text-[13px] text-ink-mute">{rotulo}</span>
          </div>
        ))}
      </div>

      <section aria-labelledby="ilhas-title">
        <div className="mb-3.5 flex flex-wrap items-end gap-3">
          <h2 id="ilhas-title" className="t-eyebrow mr-auto text-ink-faint">Ilhas em operação</h2>
        <ChipSelect
          rotulo="Cliente"
          value={cliente}
          // trocar de cliente zera a operação: a anterior é de outro cliente
          onChange={e => { setCliente(e.target.value); setOperacao(''); }}
          aria-label="Filtrar ilhas por cliente"
        >
          <option value="">todos</option>
          {clients.filter(c => c.status === EntityStatus.ACTIVE).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </ChipSelect>
        <ChipSelect
          rotulo="Operação"
          value={operacao}
          onChange={e => setOperacao(e.target.value)}
          aria-label="Filtrar ilhas por operação"
        >
          <option value="">todas</option>
          {operacoesDoCliente.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </ChipSelect>
        <ChipSelect
          rotulo="Ordenar"
          value={ordem}
          onChange={e => setOrdem(e.target.value as Ordem)}
          aria-label="Ordenar as ilhas"
        >
          <option value="nome">A → Z</option>
          <option value="asc">provimento ↑</option>
          <option value="desc">provimento ↓</option>
        </ChipSelect>
        </div>

      {stats.length === 0 ? (
        <p className="text-sm text-ink-mute py-16 text-center">
          Nenhuma ilha ativa nesse recorte. Volte o cliente ou a operação para todos.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {/* fora do sort de propósito: o consolidado abre o mapa em qualquer
              ordenação, porque é o número que enquadra todos os outros */}
          <GeralTile geral={geral} />
          {stats.map(ilha => (
            <IlhaTile key={ilha.id} ilha={ilha} onOpen={() => onAbrirIlha(ilha.id)} />
          ))}
        </div>
      )}
      </section>
    </div>
  );
};
