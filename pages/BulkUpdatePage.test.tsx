import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Client, Collaborator, CollaboratorStatus, Coordinator, EntityStatus, Ilha, Operation, Supervisor, User, UserRole } from '../types';
import { BulkUpdatePage } from './BulkUpdatePage';

const getCollaborators = vi.fn();
const getClients = vi.fn();
const getOperations = vi.fn();
const getIlhas = vi.fn();
const getSupervisors = vi.fn();
const getCoordinators = vi.fn();

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: (...args: unknown[]) => getCollaborators(...args),
    getClients: (...args: unknown[]) => getClients(...args),
    getOperations: (...args: unknown[]) => getOperations(...args),
    getIlhas: (...args: unknown[]) => getIlhas(...args),
    getSupervisors: (...args: unknown[]) => getSupervisors(...args),
    getCoordinators: (...args: unknown[]) => getCoordinators(...args),
  },
}));

const admin: User = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com', role: UserRole.ADMIN, status: EntityStatus.ACTIVE };

const clients: Client[] = [{ id: 'c1', nome: 'Cliente X', status: EntityStatus.ACTIVE }];
const operations: Operation[] = [{ id: 'o1', nome: 'Operação X', clientId: 'c1', status: EntityStatus.ACTIVE }];
const ilhas: Ilha[] = [{ id: 'i1', nome: 'Ilha X', clientId: 'c1', operationId: 'o1', coordinatorIds: ['co1'], supervisorIds: ['s1'], status: EntityStatus.ACTIVE }];
const coordinators: Coordinator[] = [
  { id: 'co1', nome: 'Ana Coordenadora', status: EntityStatus.ACTIVE },
  { id: 'co2', nome: 'Bruno Coordenador', status: EntityStatus.ACTIVE },
];
const supervisors: Supervisor[] = [
  { id: 's1', nome: 'Sara Supervisora', coordinatorIds: ['co1'], status: EntityStatus.ACTIVE },
  { id: 's2', nome: 'Sergio Supervisor', coordinatorIds: ['co2'], status: EntityStatus.ACTIVE },
];

const baseCollab = {
  email: 'x@empresa.com',
  ilhaId: 'i1',
  operationId: 'o1',
  clientId: 'c1',
  status: CollaboratorStatus.ATIVO,
  dtEntradaProduto: '2024-01-10',
  horarioEntrada: '08:00',
  horarioSaida: '17:00',
  dtNasc: '1990-05-20',
};

const collaborators: Collaborator[] = [
  { ...baseCollab, matricula: '1', nome: 'Colaborador Um', coordinatorId: 'co1', supervisorId: 's1' },
  { ...baseCollab, matricula: '2', nome: 'Colaborador Dois', coordinatorId: 'co2', supervisorId: 's2' },
];

// Os rótulos "Coordenador" e "Supervisor" também aparecem como <option> dentro
// do select "Campo" do painel "O que alterar" — getByText pegaria os dois.
// Isolar pelo <label> real evita essa ambiguidade.
const selectByLabel = (container: HTMLElement, labelText: string): HTMLSelectElement => {
  const label = Array.from(container.querySelectorAll('label')).find(l => l.textContent === labelText);
  if (!label) throw new Error(`Label "${labelText}" não encontrado`);
  return label.parentElement!.querySelector('select') as HTMLSelectElement;
};

const optionLabels = (select: HTMLSelectElement) =>
  Array.from(select.options).map(o => o.textContent);

describe('BulkUpdatePage — filtros', () => {
  beforeEach(() => {
    getCollaborators.mockResolvedValue(collaborators);
    getClients.mockResolvedValue(clients);
    getOperations.mockResolvedValue(operations);
    getIlhas.mockResolvedValue(ilhas);
    getSupervisors.mockResolvedValue(supervisors);
    getCoordinators.mockResolvedValue(coordinators);
  });

  it('mostra os filtros de Coordenador e Supervisor e filtra a lista por eles', async () => {
    const { container } = render(<BulkUpdatePage currentUser={admin} onRefresh={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('2 colaboradores encontrados')).toBeInTheDocument());

    const coordenadorSelect = selectByLabel(container, 'Coordenador');
    const supervisorSelect = selectByLabel(container, 'Supervisor');

    // as opções vêm de db.getCoordinators()/getSupervisors()
    expect(optionLabels(coordenadorSelect)).toEqual(['Todos', 'Ana Coordenadora', 'Bruno Coordenador']);
    expect(optionLabels(supervisorSelect)).toEqual(['Todos', 'Sara Supervisora', 'Sergio Supervisor']);

    const user = userEvent.setup();
    await user.selectOptions(coordenadorSelect, 'co1');

    // filtra a tabela para o colaborador do coordenador selecionado
    await waitFor(() => expect(screen.getByText('1 colaboradores encontrados')).toBeInTheDocument());
    expect(screen.getByText('Colaborador Um')).toBeInTheDocument();
    expect(screen.queryByText('Colaborador Dois')).not.toBeInTheDocument();

    // e a lista de Supervisores em cascata só mostra quem responde a esse coordenador
    expect(optionLabels(supervisorSelect)).toEqual(['Todos', 'Sara Supervisora']);

    // limpar o Coordenador não perde a seleção de Supervisor nem quebra o filtro
    await user.selectOptions(coordenadorSelect, '');
    await user.selectOptions(supervisorSelect, 's1');
    await waitFor(() => expect(screen.getByText('1 colaboradores encontrados')).toBeInTheDocument());
    expect(screen.getByText('Colaborador Um')).toBeInTheDocument();
  });
});
