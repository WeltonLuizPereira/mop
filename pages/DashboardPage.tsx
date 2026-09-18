import React, { useCallback, useEffect, useState } from 'react';
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
  const [erroProvimento, setErroProvimento] = useState(false);
  const [cliente, setCliente] = useState('');
  const [operacao, setOperacao] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

  const carregarProvimento = useCallback(async () => {
    setCarregandoProvimento(true);
    setErroProvimento(false);
    try {
      const prov = await db.getProvimento(referenciaDoMes(new Date()));
      setProvimentos(prov);
    } catch {
      setErroProvimento(true);
    } finally {
      setCarregandoProvimento(false);
    }
  }, []);

  useEffect(() => { void carregarProvimento(); }, [carregarProvimento]);

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

  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const _dataExtenso = formatter.format(new Date());
  const dataExtenso = _dataExtenso.charAt(0).toUpperCase() + _dataExtenso.slice(1);
  const ausentes = totais.ferias + totais.aviso + totais.afastados;

  const carregando = carregandoProvimento || [collaboratorsResource, ilhasResource, clientsResource, operationsResource]
    .some(resource => resource.loading && !resource.data);

  if (carregando) {
    return <p className="text-sm text-ink-mute py-20 text-center">Carregando o mapa…</p>;
  }

  if (erroProvimento) {
    return (
      <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-9">
        <header className="mb-7">
          <h1 className="t-display-lg text-ink">Operação em perspectiva.</h1>
          <p className="mt-2 text-sm text-ink-mute">Pessoas, capacidade e movimentos de hoje.</p>
        </header>
        <section role="alert" className="border-y border-hairline py-6 text-sm text-ink">
          <p>Não foi possível carregar o provimento.</p>
          <button
            type="button"
            onClick={carregarProvimento}
            className="mt-3 min-h-11 rounded-sm border border-hairline-2 px-3 text-sm font-semibold text-ink hover:bg-canvas-soft"
          >
            Tentar novamente
          </button>
        </section>
      </div>
    );
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
      <header className="mb-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="t-display-lg text-ink font-bold tracking-tight">Operação em perspectiva.</h1>
          <p className="mt-2 text-[15px] text-ink-mute">Uma leitura direta das pessoas, capacidades e movimentos de hoje.</p>
        </div>
        <p className="text-[13px] text-ink-faint font-medium mb-1">{dataExtenso}</p>
      </header>

      <div className="mb-12 flex flex-col md:flex-row rounded-tile overflow-hidden shadow-sm border border-hairline">
        {/* Bloco 1: Panorama da operação */}
        <div 
          className="text-white p-8 md:w-[45%] flex flex-col justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(120deg, #ff4f10, #ff7b29)' }}
        >
          {/* Efeito do Q (Anel sutil ao fundo como no mockup) */}
          <div className="absolute right-[-75px] top-[-110px] w-[270px] h-[270px] rounded-full border-[55px] border-[#ffffff20] pointer-events-none" />

          <p className="text-[11px] font-medium opacity-90 mb-5 relative z-10">Panorama da operação</p>
          <div className="font-display font-bold text-[58px] leading-none tracking-tight mb-2 relative z-10">
            {totais.ativos.toLocaleString('pt-BR')}
          </div>
          <p className="text-[12px] opacity-90 relative z-10">
            colaboradores ativos em {geral.ilhas} {geral.ilhas === 1 ? 'ilha' : 'ilhas'}
          </p>
        </div>

        {/* Bloco 2: Provimento geral */}
        <div className="bg-canvas-soft border-t md:border-t-0 md:border-l border-hairline p-8 md:w-[27.5%] flex flex-col justify-between">
          <p className="text-[13px] text-ink-mute mb-8">Provimento geral</p>
          <div>
            <div className="font-display font-bold text-[40px] leading-none tracking-tight text-ink mb-1">
              {geral.provimento === null ? '—' : `${Math.round(geral.provimento * 100)}%`}
            </div>
            {geral.provimento !== null && geral.provimento < 0.8 ? (
              <p className="text-[13px] font-medium text-brand-text">↓ Abaixo da meta de 80%</p>
            ) : (
              <p className="text-[13px] font-medium text-ok">
                PA contratada: {geral.paContratada === null ? '—' : geral.paContratada.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Bloco 3: Movimentos próximos */}
        <div className="bg-canvas-soft border-t md:border-t-0 md:border-l border-hairline p-8 md:w-[27.5%] flex flex-col justify-between">
          <p className="text-[13px] text-ink-mute mb-8">Movimentos próximos</p>
          <div>
            <div className="font-display font-bold text-[40px] leading-none tracking-tight text-ink mb-1">
              {ausentes.toLocaleString('pt-BR')}
            </div>
            <p className="text-[13px] font-medium text-ink-faint">
              {totais.ferias > 0 && `${totais.ferias} férias `}
              {totais.aviso > 0 && `· ${totais.aviso} aviso `}
              {totais.afastados > 0 && `· ${totais.afastados} afastados`}
              {ausentes === 0 && 'nenhum'}
            </p>
          </div>
        </div>
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
