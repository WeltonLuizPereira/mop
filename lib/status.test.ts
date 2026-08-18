import { describe, expect, it } from 'vitest';
import { CollaboratorStatus } from '../types';
import { normalizarStatus } from './status';

describe('normalizarStatus', () => {
  it('devolve o próprio status quando já está canônico', () => {
    Object.values(CollaboratorStatus).forEach(s => {
      expect(normalizarStatus(s)).toBe(s);
    });
  });

  it('reconhece o mesmo estado escrito sem acento, em caixa mista ou com sobra', () => {
    expect(normalizarStatus('Ferias')).toBe(CollaboratorStatus.FERIAS);
    expect(normalizarStatus('férias')).toBe(CollaboratorStatus.FERIAS);
    expect(normalizarStatus('  FÉRIAS  ')).toBe(CollaboratorStatus.FERIAS);
    expect(normalizarStatus('licenca maternidade')).toBe(CollaboratorStatus.LICENCA_MATERNIDADE);
    expect(normalizarStatus('AVISO  PREVIO')).toBe(CollaboratorStatus.AVISO_PREVIO);
  });

  it('devolve null para o que não é status de colaborador', () => {
    expect(normalizarStatus('')).toBeNull();
    expect(normalizarStatus(undefined)).toBeNull();
    expect(normalizarStatus('EM GOZO')).toBeNull();
  });
});
