import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus, UserRole } from '../types';
import { CollaboratorsPage } from './CollaboratorsPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '4127', nome: 'Adriana Lopes Ferreira', ilhaId: 'i1',
        supervisorId: 's1', status: CollaboratorStatus.ATIVO },
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
const montar = (onViewDetails = vi.fn(), currentUser = usuario) =>
  render(<CollaboratorsPage currentUser={currentUser} onViewDetails={onViewDetails} onRefresh={vi.fn()} />);

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

  it('cai no monograma quando o cliente não tem logo cadastrada', async () => {
    montar();
    const linha = (await screen.findByText('Adriana Lopes Ferreira')).closest('tr')!;
    expect(within(linha).getByText('V')).toBeInTheDocument();
  });

  it('abre o detalhe por clique, Enter e Espaço', async () => {
    const onViewDetails = vi.fn();
    montar(onViewDetails);
    const linha = (await screen.findByText('Adriana Lopes Ferreira')).closest('tr')!;
    fireEvent.click(linha);
    fireEvent.keyDown(linha, { key: 'Enter' });
    fireEvent.keyDown(linha, { key: ' ' });
    expect(onViewDetails).toHaveBeenCalledTimes(3);
  });

  it('preserva exportação e permissão de cadastro', async () => {
    montar();
    await screen.findByText('Adriana Lopes Ferreira');
    expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /novo cadastro/i })).toBeInTheDocument();
  });

  it('não oferece novo cadastro ao visualizador', async () => {
    montar(vi.fn(), { ...usuario, role: UserRole.VIEWER });
    await screen.findByText('Adriana Lopes Ferreira');
    expect(screen.queryByRole('button', { name: /novo cadastro/i })).not.toBeInTheDocument();
  });

  it('mantém a busca disponível quando nenhum resultado corresponde ao termo', async () => {
    montar();
    await screen.findByText('Adriana Lopes Ferreira');
    const search = screen.getByRole('textbox', { name: 'Buscar colaboradores' });
    await userEvent.type(search, 'inexistente');
    expect(screen.getByRole('textbox', { name: 'Buscar colaboradores' })).toHaveValue('inexistente');
    expect(screen.getByRole('region', { name: 'Nenhum colaborador encontrado' })).toBeInTheDocument();
  });
});
