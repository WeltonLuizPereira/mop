import {
  CollaboratorStatus, type Client, type Collaborator, type Ilha, type Operation, type Provimento,
} from '../types';
import { normalizarStatus } from './status';

export interface IlhaStat {
  id: string;
  nome: string;
  cliente: string;
  operacao: string;
  /** Quadro da ilha, sem os desligados. */
  total: number;
  /** Quantos, dentro do quadro, estão ATIVO. */
  ativos: number;
  /** PA Contratada do mês vigente; `null` quando a ilha não tem linha (ou ela é 0). */
  paContratada: number | null;
  /** Ativos ÷ PA Contratada; `null` quando `paContratada` é `null`. */
  provimento: number | null;
  porStatus: Array<{ status: CollaboratorStatus; count: number }>;
}

/** Ordem fixa dos status nos pontos do tile. */
const ORDEM = [
  CollaboratorStatus.ATIVO,
  CollaboratorStatus.FERIAS,
  CollaboratorStatus.AFASTADO,
  CollaboratorStatus.LICENCA_MATERNIDADE,
  CollaboratorStatus.AVISO_PREVIO,
  CollaboratorStatus.REALOCADO,
];

/** `nome` põe as ilhas em ordem alfabética; `asc`/`desc` ordenam pelo
 *  provimento, crescente ou decrescente. */
export type Ordem = 'nome' | 'asc' | 'desc';

export function computeIlhaStats(
  ilhas: Ilha[], collabs: Collaborator[], clients: Client[], operations: Operation[],
  provimentoDoMes: Provimento[], ordem: Ordem = 'nome',
): IlhaStat[] {
  const nomeCliente = new Map(clients.map(c => [c.id, c.nome]));
  const nomeOperacao = new Map(operations.map(o => [o.id, o.nome]));
  const paPorIlha = new Map(provimentoDoMes.map(p => [p.ilhaId, p.paContratada]));

  return ilhas
    .map(ilha => {
      // O status vem do banco como texto livre; sem normalizar, "Ferias" some
      // da contagem aqui e vira ponto cinza na tabela — as duas telas
      // discordariam sobre a mesma pessoa.
      const daIlha = collabs
        .filter(c => c.ilhaId === ilha.id)
        .map(c => ({ colaborador: c, status: normalizarStatus(c.status) }));

      // Desligado não é quadro: quem saiu não entra no denominador.
      const doQuadro = daIlha.filter(c => c.status !== CollaboratorStatus.DESLIGADO);
      const ativos = doQuadro.filter(c => c.status === CollaboratorStatus.ATIVO).length;

      // 0 e ausência de linha significam a mesma coisa: nenhum dos dois é
      // uma meta válida pra dividir por ela.
      const paContratada = paPorIlha.get(ilha.id) || null;
      const provimento = paContratada ? ativos / paContratada : null;

      return {
        id: ilha.id,
        nome: ilha.nome,
        cliente: nomeCliente.get(ilha.clientId) ?? '—',
        operacao: nomeOperacao.get(ilha.operationId) ?? '—',
        total: doQuadro.length,
        ativos,
        paContratada,
        provimento,
        porStatus: ORDEM
          .map(status => ({ status, count: doQuadro.filter(c => c.status === status).length }))
          .filter(s => s.count > 0),
      };
    })
    .sort((a, b) => {
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');

      // Ilha vazia ou sem PA Contratada não tem provimento para comparar —
      // as duas ficam por último, sem empurrar pra baixo quem de fato mede mal.
      const aSemDado = a.total === 0 || a.provimento === null;
      const bSemDado = b.total === 0 || b.provimento === null;
      if (aSemDado !== bSemDado) return aSemDado ? 1 : -1;
      if (aSemDado && bSemDado) return 0;
      const delta = (a.provimento as number) - (b.provimento as number);
      return ordem === 'asc' ? delta : -delta;
    });
}

export function totaisGerais(collabs: Collaborator[]) {
  const status = collabs.map(c => normalizarStatus(c.status));
  const contar = (s: CollaboratorStatus) => status.filter(atual => atual === s).length;
  return {
    ativos: contar(CollaboratorStatus.ATIVO),
    ferias: contar(CollaboratorStatus.FERIAS),
    aviso: contar(CollaboratorStatus.AVISO_PREVIO),
    afastados: contar(CollaboratorStatus.AFASTADO),
  };
}
