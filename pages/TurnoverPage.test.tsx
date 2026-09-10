import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { DataProvider } from '../contexts/DataContext';
import { createAppData } from '../data/appData';
import { db } from '../services/mockDb';
import { TurnoverPage } from './TurnoverPage';
import { DesligadosPage } from './DesligadosPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => [{ matricula: '1', nome: 'Ana', status: CollaboratorStatus.DESLIGADO, dataFim: '2026-09-01', ilhaId: 'i1', clientId: 'c1', operationId: 'o1', supervisorId: 's1', coordinatorId: 'co1' }]),
    getClients: vi.fn(async () => [{ id: 'c1', nome: 'Cliente', status: EntityStatus.ACTIVE }]),
    getOperations: vi.fn(async () => [{ id: 'o1', nome: 'OperaÃ§Ã£o', clientId: 'c1', status: EntityStatus.ACTIVE }]),
    getIlhas: vi.fn(async () => [{ id: 'i1', nome: 'Ilha', status: EntityStatus.ACTIVE }]),
    getSupervisors: vi.fn(async () => [{ id: 's1', nome: 'Supervisora', status: EntityStatus.ACTIVE }]),
    getCoordinators: vi.fn(async () => [{ id: 'co1', nome: 'Coordenadora', status: EntityStatus.ACTIVE }]),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('cache entre telas analÃ­ticas', () => {
  it('reutiliza os recursos ao navegar de Turnover para Desligados', async () => {
    const store = createAppData(db as any);
    const Harness = () => {
      const [tela, setTela] = useState<'turnover' | 'desligados'>('turnover');
      return <>
        <button onClick={() => setTela('desligados')}>Abrir desligados</button>
        {tela === 'turnover'
          ? <TurnoverPage />
          : <DesligadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />}
      </>;
    };
    render(<DataProvider store={store}><Harness /></DataProvider>);
    await waitFor(() => expect(db.getCollaborators).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('button', { name: 'Abrir desligados' }));
    await waitFor(() => expect(db.getCoordinators).toHaveBeenCalledTimes(1));

    for (const method of ['getCollaborators', 'getClients', 'getOperations', 'getIlhas', 'getSupervisors', 'getCoordinators'] as const) {
      expect(db[method]).toHaveBeenCalledTimes(1);
    }
  });
});
