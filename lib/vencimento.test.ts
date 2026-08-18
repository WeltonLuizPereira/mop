import { describe, expect, it } from 'vitest';
import { diasAteProximoMarco, porProximoMarco } from './vencimento';

describe('proximo marco do contrato', () => {
  it('conta pelo marco de 45 enquanto ele nao passou', () => {
    expect(diasAteProximoMarco(12, 57)).toBe(12);
    expect(diasAteProximoMarco(0, 45)).toBe(0);
  });

  it('passa para o marco de 90 quando o de 45 ja venceu', () => {
    expect(diasAteProximoMarco(-3, 42)).toBe(42);
  });

  it('poe na frente quem vence antes, olhando o marco que vale para cada um', () => {
    const lista = [
      { nome: 'noventa em 20', daysRemaining45: -8, daysRemaining90: 20 },
      { nome: 'quarenta e cinco em 5', daysRemaining45: 5, daysRemaining90: 50 },
      { nome: 'noventa em 60', daysRemaining45: -30, daysRemaining90: 60 },
    ];

    expect([...lista].sort(porProximoMarco).map(c => c.nome)).toEqual([
      'quarenta e cinco em 5', 'noventa em 20', 'noventa em 60',
    ]);
  });
});
