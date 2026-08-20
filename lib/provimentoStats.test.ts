import { describe, expect, it } from 'vitest';
import { EntityStatus } from '../types';
import { provimentoParaAutoCadastro, referenciaDoMes } from './provimentoStats';

describe('referenciaDoMes', () => {
  it('trunca a data no dia 1 do mês, em YYYY-MM-01', () => {
    expect(referenciaDoMes(new Date(2026, 7, 20))).toBe('2026-08-01');
  });

  it('preenche mês e ano corretamente na virada do ano', () => {
    expect(referenciaDoMes(new Date(2026, 0, 5))).toBe('2026-01-01');
    expect(referenciaDoMes(new Date(2025, 11, 31))).toBe('2025-12-01');
  });
});

const ilha = (id: string) => ({
  id, nome: `Ilha ${id}`, clientId: 'c1', operationId: 'o1',
  coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE,
});

describe('provimentoParaAutoCadastro', () => {
  it('copia a referência mais recente anterior ao mês vigente', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [
        { id: 'p1', ilhaId: 'i1', referencia: '2026-06-01', paContratada: 8 },
        { id: 'p2', ilhaId: 'i1', referencia: '2026-07-01', paContratada: 10 },
      ],
      '2026-08-01',
    );
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 10 }]);
  });

  it('atravessa um mês pulado: usa a última referência que existir, não só a anterior', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [{ id: 'p1', ilhaId: 'i1', referencia: '2026-05-01', paContratada: 6 }],
      '2026-08-01', // junho e julho não têm registro
    );
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 6 }]);
  });

  it('entra com 0 quando a ilha não tem nenhum histórico', () => {
    const resultado = provimentoParaAutoCadastro([ilha('i1')], [], '2026-08-01');
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 0 }]);
  });

  it('não repete ilha que já tem linha no mês vigente', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [{ id: 'p1', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 12 }],
      '2026-08-01',
    );
    expect(resultado).toEqual([]);
  });

  it('ignora referências futuras ao decidir a "mais recente"', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [
        { id: 'p1', ilhaId: 'i1', referencia: '2026-07-01', paContratada: 10 },
        { id: 'p2', ilhaId: 'i1', referencia: '2026-09-01', paContratada: 99 },
      ],
      '2026-08-01',
    );
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 10 }]);
  });

  it('trata cada ilha de forma independente', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1'), ilha('i2')],
      [{ id: 'p1', ilhaId: 'i1', referencia: '2026-07-01', paContratada: 10 }],
      '2026-08-01',
    );
    expect(resultado).toEqual(expect.arrayContaining([
      { ilhaId: 'i1', paContratada: 10 },
      { ilhaId: 'i2', paContratada: 0 },
    ]));
    expect(resultado).toHaveLength(2);
  });
});
