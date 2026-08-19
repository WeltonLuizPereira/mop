import { describe, expect, it } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { distribuir, doQuadro } from './distribuicaoStats';

const operacoes = [
  { id: 'o1', nome: 'Cobrança', status: EntityStatus.ACTIVE },
  { id: 'o2', nome: 'Suporte', status: EntityStatus.ACTIVE },
  { id: 'o3', nome: 'Encerrada', status: EntityStatus.INACTIVE },
];

const colab = (matricula: string, operationId: string, status: CollaboratorStatus) =>
  ({ matricula, operationId, status } as any);

const porOperacao = (c: any) => c.operationId;

describe('distribuir', () => {
  it('conta as pessoas de cada item e a fatia sobre o quadro', () => {
    const fatias = distribuir([
      colab('1', 'o1', CollaboratorStatus.ATIVO),
      colab('2', 'o1', CollaboratorStatus.FERIAS),
      colab('3', 'o1', CollaboratorStatus.ATIVO),
      colab('4', 'o2', CollaboratorStatus.ATIVO),
    ], porOperacao, operacoes, 'Sem operação');

    expect(fatias.map(f => [f.nome, f.total])).toEqual([['Cobrança', 3], ['Suporte', 1]]);
    expect(fatias[0].fatia).toBeCloseTo(0.75);
    expect(fatias[1].fatia).toBeCloseTo(0.25);
  });

  it('não conta desligado — quem saiu não é quadro', () => {
    const fatias = distribuir([
      colab('1', 'o1', CollaboratorStatus.ATIVO),
      colab('2', 'o1', CollaboratorStatus.DESLIGADO),
    ], porOperacao, operacoes, 'Sem operação');

    expect(fatias[0].total).toBe(1);
    expect(fatias[0].fatia).toBe(1);
  });

  it('normaliza o status antes de descartar o desligado', () => {
    const fatias = distribuir([
      colab('1', 'o1', CollaboratorStatus.ATIVO),
      colab('2', 'o1', 'Desligado ' as CollaboratorStatus),
    ], porOperacao, operacoes, 'Sem operação');

    expect(fatias[0].total).toBe(1);
  });

  it('ordena do maior para o menor e desempata pelo nome', () => {
    const fatias = distribuir([
      colab('1', 'o2', CollaboratorStatus.ATIVO),
      colab('2', 'o1', CollaboratorStatus.ATIVO),
    ], porOperacao, operacoes, 'Sem operação');

    expect(fatias.map(f => f.nome)).toEqual(['Cobrança', 'Suporte']);
  });

  it('mostra o item cadastrado que está sem ninguém', () => {
    const fatias = distribuir(
      [colab('1', 'o1', CollaboratorStatus.ATIVO)],
      porOperacao, operacoes, 'Sem operação',
    );

    const vazio = fatias.find(f => f.nome === 'Suporte');
    expect(vazio).toMatchObject({ total: 0, fatia: 0 });
  });

  it('junta em uma linha quem está sem vínculo ou apontado para item inativo', () => {
    const fatias = distribuir([
      colab('1', 'o1', CollaboratorStatus.ATIVO),
      colab('2', '', CollaboratorStatus.ATIVO),
      colab('3', 'o3', CollaboratorStatus.ATIVO),
    ], porOperacao, operacoes, 'Sem operação');

    const sem = fatias.find(f => f.nome === 'Sem operação');
    expect(sem).toMatchObject({ id: '', total: 2 });
    // a linha existe justamente para as fatias somarem 100%
    expect(fatias.reduce((s, f) => s + f.fatia, 0)).toBeCloseTo(1);
  });

  it('omite a linha de sem vínculo quando todo mundo está alocado', () => {
    const fatias = distribuir(
      [colab('1', 'o1', CollaboratorStatus.ATIVO)],
      porOperacao, operacoes, 'Sem operação',
    );

    expect(fatias.some(f => f.nome === 'Sem operação')).toBe(false);
  });

  it('devolve 0 em vez de dividir por zero quando o quadro está vazio', () => {
    const fatias = distribuir([], porOperacao, operacoes, 'Sem operação');

    expect(fatias.every(f => f.fatia === 0)).toBe(true);
    expect(fatias.some(f => Number.isNaN(f.fatia))).toBe(false);
  });
});

describe('doQuadro', () => {
  it('deixa de fora só o desligado', () => {
    const quadro = doQuadro([
      colab('1', 'o1', CollaboratorStatus.ATIVO),
      colab('2', 'o1', CollaboratorStatus.FERIAS),
      colab('3', 'o1', CollaboratorStatus.AVISO_PREVIO),
      colab('4', 'o1', CollaboratorStatus.DESLIGADO),
    ]);

    expect(quadro.map(c => c.matricula)).toEqual(['1', '2', '3']);
  });
});
