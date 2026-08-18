import {
  CollaboratorStatus, type Client, type Collaborator, type Ilha, type Operation,
} from '../types';
import { normalizarStatus } from './status';

export interface IlhaStat {
  id: string;
  nome: string;
  cliente: string;
  operacao: string;
  /** Quadro da ilha, sem os desligados. */
  total: number;
  /** ATIVO ÷ total. 0 quando a ilha está vazia. */
  emOperacao: number;
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

/** `nome` põe as ilhas em ordem alfabética; `asc`/`desc` ordenam pela fatia
 *  em operação, crescente ou decrescente. */
export type Ordem = 'nome' | 'asc' | 'desc';

export function computeIlhaStats(
  ilhas: Ilha[], collabs: Collaborator[], clients: Client[], operations: Operation[],
  ordem: Ordem = 'nome',
): IlhaStat[] {
  const nomeCliente = new Map(clients.map(c => [c.id, c.nome]));
  const nomeOperacao = new Map(operations.map(o => [o.id, o.nome]));

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

      return {
        id: ilha.id,
        nome: ilha.nome,
        cliente: nomeCliente.get(ilha.clientId) ?? '—',
        operacao: nomeOperacao.get(ilha.operationId) ?? '—',
        total: doQuadro.length,
        emOperacao: doQuadro.length === 0 ? 0 : ativos / doQuadro.length,
        porStatus: ORDEM
          .map(status => ({ status, count: doQuadro.filter(c => c.status === status).length }))
          .filter(s => s.count > 0),
      };
    })
    .sort((a, b) => {
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');

      // Ilha vazia marca 0%, mas 0% de ninguém não é crise — é ilha sem gente.
      // Deixá-la subir empurraria para baixo justamente as ilhas com problema
      // real, que é o que a tela existe para mostrar primeiro.
      const aVazia = a.total === 0;
      const bVazia = b.total === 0;
      if (aVazia !== bVazia) return aVazia ? 1 : -1;
      const delta = a.emOperacao - b.emOperacao;
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
