import { describe, expect, it } from 'vitest';
import { CollaboratorStatus, EntityStatus, type Provimento } from '../types';
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
const pa = (ilhaId: string, paContratada: number): Provimento =>
  ({ id: `p-${ilhaId}`, ilhaId, referencia: '2026-08-01', paContratada });

describe('computeIlhaStats', () => {
  it('conta o quadro e os ativos, sem contar desligado', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.DESLIGADO),
    ], clients, operations, []);
    expect(i1.total).toBe(3);
    expect(i1.ativos).toBe(2);
  });

  it('calcula provimento como ativos sobre PA Contratada', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.AFASTADO),
    ], clients, operations, [pa('i1', 4)]);
    expect(i1.paContratada).toBe(4);
    expect(i1.provimento).toBeCloseTo(0.5);
  });

  it('provimento fica nulo quando não há PA Contratada cadastrada', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
    ], clients, operations, []);
    expect(i1.paContratada).toBeNull();
    expect(i1.provimento).toBeNull();
  });

  it('provimento fica nulo quando a PA Contratada é zero, sem dividir por zero', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
    ], clients, operations, [pa('i1', 0)]);
    expect(i1.provimento).toBeNull();
    expect(Number.isNaN(i1.provimento as any)).toBe(false);
  });

  it('devolve total e ativos 0 para ilha vazia, sem dividir por zero', () => {
    const [, i2] = computeIlhaStats(ilhas, [colab('1', 'i1', CollaboratorStatus.ATIVO)], clients, operations, []);
    expect(i2.total).toBe(0);
    expect(i2.ativos).toBe(0);
    expect(i2.provimento).toBeNull();
  });

  it('resolve cliente e operação da ilha', () => {
    const [i1] = computeIlhaStats(ilhas, [], clients, operations, []);
    expect(i1.cliente).toBe('Vivo');
    expect(i1.operacao).toBe('Móvel');
  });

  it('agrupa a contagem por status, omitindo os zerados', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.FERIAS),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
    ], clients, operations, []);
    expect(i1.porStatus).toEqual([
      { status: CollaboratorStatus.ATIVO, count: 1 },
      { status: CollaboratorStatus.FERIAS, count: 2 },
    ]);
  });

  it('ordena por nome quando ninguém pede outra ordem', () => {
    const foraDeOrdem = [ilhas[1], ilhas[0]];
    const r = computeIlhaStats(foraDeOrdem, [], clients, operations, []);
    expect(r.map(i => i.nome)).toEqual(['Ilha 01', 'Ilha 02']);
  });

  it('ordena da ilha mais crítica para a mais tranquila', () => {
    const r = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.FERIAS),
    ], clients, operations, [pa('i1', 1), pa('i2', 2)], 'asc');
    // i1: 1/1 = 100%; i2: 1/2 = 50% — 50% é mais crítico, vem primeiro em 'asc'
    expect(r.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('inverte a ordem quando a pessoa pede decrescente', () => {
    const r = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.FERIAS),
    ], clients, operations, [pa('i1', 1), pa('i2', 2)], 'desc');
    expect(r.map(i => i.id)).toEqual(['i1', 'i2']);
  });

  it('conta quem está com o status escrito fora do padrão', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', 'Ativo' as CollaboratorStatus),
      colab('2', 'i1', 'FERIAS' as CollaboratorStatus),
    ], clients, operations, [pa('i1', 2)]);
    expect(i1.total).toBe(2);
    expect(i1.provimento).toBe(0.5);
    expect(i1.porStatus).toEqual([
      { status: CollaboratorStatus.ATIVO, count: 1 },
      { status: CollaboratorStatus.FERIAS, count: 1 },
    ]);
  });

  it('mantém a ilha vazia no fim nas duas direções', () => {
    const colabs = [colab('1', 'i1', CollaboratorStatus.ATIVO)];
    const provimento = [pa('i1', 1)];
    expect(computeIlhaStats(ilhas, colabs, clients, operations, provimento, 'asc').at(-1)!.id).toBe('i2');
    expect(computeIlhaStats(ilhas, colabs, clients, operations, provimento, 'desc').at(-1)!.id).toBe('i2');
  });

  it('manda pro fim a ilha com gente mas sem PA Contratada, mesmo tendo gente de sobra', () => {
    // i2 tem mais gente que i1, mas sem PA não há o que comparar — vai pro fim mesmo assim
    const colabs = [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.ATIVO),
    ];
    const r = computeIlhaStats(ilhas, colabs, clients, operations, [pa('i1', 1)], 'asc');
    expect(r.at(-1)!.id).toBe('i2');
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
