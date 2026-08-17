import { describe, expect, it } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { computeIlhaStats, totaisGerais } from './ilhaStats';

const clients = [{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }];
const operations = [{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }];
const ilhas = [
  { id: 'i1', nome: 'Ilha 01', clientId: 'c1', operationId: 'o1',
    coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
  { id: 'i2', nome: 'Ilha 02', clientId: 'c1', operationId: 'o1',
    coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
];
const colab = (matricula: string, ilhaId: string, status: CollaboratorStatus) =>
  ({ matricula, ilhaId, status } as any);

describe('computeIlhaStats', () => {
  it('mede em operação como ativos sobre o total da ilha', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.AFASTADO),
    ], clients, operations);
    expect(i1.total).toBe(4);
    expect(i1.emOperacao).toBeCloseTo(0.5);
  });

  it('não conta desligado no total da ilha — quem saiu não é quadro', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.DESLIGADO),
    ], clients, operations);
    expect(i1.total).toBe(1);
    expect(i1.emOperacao).toBe(1);
  });

  it('devolve 0 para ilha vazia, sem dividir por zero', () => {
    const [, i2] = computeIlhaStats(ilhas, [colab('1', 'i1', CollaboratorStatus.ATIVO)], clients, operations);
    expect(i2.total).toBe(0);
    expect(i2.emOperacao).toBe(0);
    expect(Number.isNaN(i2.emOperacao)).toBe(false);
  });

  it('resolve cliente e operação da ilha', () => {
    const [i1] = computeIlhaStats(ilhas, [], clients, operations);
    expect(i1.cliente).toBe('Vivo');
    expect(i1.operacao).toBe('Móvel');
  });

  it('agrupa a contagem por status, omitindo os zerados', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.FERIAS),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
    ], clients, operations);
    expect(i1.porStatus).toEqual([
      { status: CollaboratorStatus.ATIVO, count: 1 },
      { status: CollaboratorStatus.FERIAS, count: 2 },
    ]);
  });

  it('ordena da ilha mais crítica para a mais tranquila', () => {
    const r = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.FERIAS),
    ], clients, operations);
    expect(r.map(i => i.id)).toEqual(['i2', 'i1']);
  });
});

describe('totaisGerais', () => {
  it('conta cada estado do quadro', () => {
    const t = totaisGerais([
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.AVISO_PREVIO),
      colab('5', 'i1', CollaboratorStatus.AFASTADO),
      colab('6', 'i1', CollaboratorStatus.DESLIGADO),
    ]);
    expect(t).toEqual({ ativos: 2, ferias: 1, aviso: 1, afastados: 1 });
  });
});
