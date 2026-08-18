import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus, UserRole } from '../types';
import { DashboardPage } from './DashboardPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', ilhaId: 'i1', status: CollaboratorStatus.ATIVO },
      { matricula: '2', ilhaId: 'i1', status: CollaboratorStatus.FERIAS },
      { matricula: '3', ilhaId: 'i2', status: CollaboratorStatus.ATIVO },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i2', nome: 'Ilha 07 — Cobrança', clientId: 'c2', operationId: 'o2',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
    ])),
    getClients: vi.fn(async () => ([
      { id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE },
      { id: 'c2', nome: 'Enel', status: EntityStatus.ACTIVE },
    ])),
    getOperations: vi.fn(async () => ([
      { id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE },
      { id: 'o2', nome: 'Residencial', clientId: 'c2', status: EntityStatus.ACTIVE },
    ])),
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

  it('recorta o mapa pelo cliente escolhido no chip', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onNavigate={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    await user.selectOptions(screen.getByLabelText('Filtrar ilhas por cliente'), 'c2');

    expect(screen.getByText('Ilha 07 — Cobrança')).toBeInTheDocument();
    expect(screen.queryByText('Ilha 01 — SAC')).not.toBeInTheDocument();
  });

  it('abre em ordem alfabética e troca de ordem pelo chip', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onNavigate={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    const nomes = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    const chip = screen.getByLabelText('Ordenar as ilhas') as HTMLSelectElement;

    // a tela abre em A → Z; a ordem alfabética em si está provada em ilhaStats
    expect(chip.value).toBe('nome');
    expect(nomes()).toEqual(['Ilha 01 — SAC', 'Ilha 07 — Cobrança']);

    await user.selectOptions(chip, 'desc');
    expect(nomes()).toEqual(['Ilha 07 — Cobrança', 'Ilha 01 — SAC']);

    await user.selectOptions(chip, 'nome');
    expect(nomes()).toEqual(['Ilha 01 — SAC', 'Ilha 07 — Cobrança']);
  });

  it('não afirma tendência que não calculou', async () => {
    render(<DashboardPage currentUser={usuario} onNavigate={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');
    expect(screen.queryByText(/vs mês anterior/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+4%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/turnover mensal/i)).not.toBeInTheDocument();
  });
});
