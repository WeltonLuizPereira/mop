import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus, UserRole } from '../types';
import { DashboardPage } from './DashboardPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', ilhaId: 'i1', status: CollaboratorStatus.ATIVO },
      { matricula: '2', ilhaId: 'i1', status: CollaboratorStatus.FERIAS },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
    ])),
    getClients: vi.fn(async () => ([{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }])),
    getOperations: vi.fn(async () => ([{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }])),
  },
}));

const usuario = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com',
  role: UserRole.ADMIN, status: EntityStatus.ACTIVE };

describe('Visão geral', () => {
  it('mostra cada ilha como um tile com o percentual em operação', async () => {
    render(<DashboardPage currentUser={usuario} onNavigate={vi.fn()} />);
    expect(await screen.findByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('não afirma tendência que não calculou', async () => {
    render(<DashboardPage currentUser={usuario} onNavigate={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');
    expect(screen.queryByText(/vs mês anterior/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+4%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/turnover mensal/i)).not.toBeInTheDocument();
  });
});
