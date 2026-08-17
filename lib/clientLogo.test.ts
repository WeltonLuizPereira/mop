import { describe, expect, it } from 'vitest';
import { EntityStatus } from '../types';
import { resolveClient } from './clientLogo';

const clients = [
  { id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE, logo: 'https://x/vivo.svg' },
  { id: 'c2', nome: 'Enel', status: EntityStatus.ACTIVE },
];
const ilhas = [
  { id: 'i1', nome: 'Ilha 01', clientId: 'c1', operationId: 'o1',
    coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
];

describe('resolveClient', () => {
  it('chega ao cliente pela ilha do colaborador', () => {
    expect(resolveClient({ ilhaId: 'i1' } as any, ilhas, clients)?.nome).toBe('Vivo');
  });

  it('usa o clientId do próprio colaborador quando a ilha não resolve', () => {
    expect(resolveClient({ ilhaId: 'x', clientId: 'c2' } as any, ilhas, clients)?.nome).toBe('Enel');
  });

  it('devolve indefinido quando não há como resolver', () => {
    expect(resolveClient({ ilhaId: 'x' } as any, ilhas, clients)).toBeUndefined();
  });
});
