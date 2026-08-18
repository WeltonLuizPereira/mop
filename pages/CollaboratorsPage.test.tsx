import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus, UserRole } from '../types';
import { CollaboratorsPage } from './CollaboratorsPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '4127', nome: 'Adriana Lopes Ferreira', ilhaId: 'i1',
        supervisorId: 's1', status: CollaboratorStatus.ATIVO },
      // saiu em 2019: fica fora do período corrente, e só o "todos" o alcança
      { matricula: '2011', nome: 'Marcos Vieira Antunes', ilhaId: 'i1',
        supervisorId: 's1', status: CollaboratorStatus.DESLIGADO,
        dtEntradaProduto: '2018-01-10', dataFim: '2019-06-30' },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: ['s1'], status: EntityStatus.ACTIVE },
    ])),
    getClients: vi.fn(async () => ([{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }])),
    getSupervisors: vi.fn(async () => ([{ id: 's1', nome: 'Juliana Prado', coordinatorIds: [], status: EntityStatus.ACTIVE }])),
    getOperations: vi.fn(async () => ([{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }])),
    getCoordinators: vi.fn(async () => ([])),
  },
}));

const usuario = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com',
  role: UserRole.ADMIN, status: EntityStatus.ACTIVE };
const montar = () =>
  render(<CollaboratorsPage currentUser={usuario} onViewDetails={vi.fn()} onRefresh={vi.fn()} />);

describe('Colaboradores', () => {
  it('tem exatamente as cinco colunas definidas', async () => {
    montar();
    await screen.findByText('Adriana Lopes Ferreira');
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Cliente', 'Nome', 'Status', 'Supervisor', 'Ilha']);
  });

  it('preenche a linha com cliente, nome, status, supervisor e ilha', async () => {
    montar();
    const linha = (await screen.findByText('Adriana Lopes Ferreira')).closest('tr')!;
    expect(within(linha).getByRole('img')).toHaveAccessibleName('Vivo');
    expect(within(linha).getByText('Ativo')).toBeInTheDocument();
    expect(within(linha).getByText('Juliana Prado')).toBeInTheDocument();
    expect(within(linha).getByText('Ilha 01 — SAC')).toBeInTheDocument();
  });

  it('alcança quem saiu em outro ano quando o filtro de ano é "todos"', async () => {
    montar();
    await screen.findByText('Adriana Lopes Ferreira');
    expect(screen.queryByText('Marcos Vieira Antunes')).not.toBeInTheDocument();

    const ano = screen.getByRole('combobox', { name: /Ano/ });
    await userEvent.selectOptions(ano, within(ano).getByRole('option', { name: 'todos' }));

    expect(await screen.findByText('Marcos Vieira Antunes')).toBeInTheDocument();
  });

  it('cai no monograma quando o cliente não tem logo cadastrada', async () => {
    montar();
    const linha = (await screen.findByText('Adriana Lopes Ferreira')).closest('tr')!;
    expect(within(linha).getByText('V')).toBeInTheDocument();
  });
});
