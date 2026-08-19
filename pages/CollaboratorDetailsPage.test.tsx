import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Collaborator, CollaboratorStatus, EntityStatus, User, UserRole } from '../types';
import { CollaboratorDetailsPage } from './CollaboratorDetailsPage';

const getHistory = vi.fn();
const getVacationHistory = vi.fn();
const getIlhas = vi.fn();
const getOperations = vi.fn();
const getClients = vi.fn();
const getCoordinators = vi.fn();
const getSupervisors = vi.fn();
const saveCollaborator = vi.fn();
const addVacationHistory = vi.fn();
const addHistory = vi.fn();
const deleteCollaborator = vi.fn();
const scheduleTask = vi.fn();

vi.mock('../services/mockDb', () => ({
  db: {
    getHistory: (...args: unknown[]) => getHistory(...args),
    getVacationHistory: (...args: unknown[]) => getVacationHistory(...args),
    getIlhas: (...args: unknown[]) => getIlhas(...args),
    getOperations: (...args: unknown[]) => getOperations(...args),
    getClients: (...args: unknown[]) => getClients(...args),
    getCoordinators: (...args: unknown[]) => getCoordinators(...args),
    getSupervisors: (...args: unknown[]) => getSupervisors(...args),
    saveCollaborator: (...args: unknown[]) => saveCollaborator(...args),
    addVacationHistory: (...args: unknown[]) => addVacationHistory(...args),
    addHistory: (...args: unknown[]) => addHistory(...args),
    deleteCollaborator: (...args: unknown[]) => deleteCollaborator(...args),
    scheduleTask: (...args: unknown[]) => scheduleTask(...args),
  },
}));

const collab: Collaborator = {
  matricula: '4127',
  email: 'adriana@empresa.com',
  nome: 'Adriana Lopes Ferreira',
  email_vr: 'adriana.vr@empresa.com',
  senha: 'inicial123',
  ilhaId: 'i1',
  supervisorId: 's1',
  coordinatorId: 'co1',
  operationId: 'o1',
  clientId: 'c1',
  status: CollaboratorStatus.ATIVO,
  dtEntradaProduto: '2024-01-10',
  horarioEntrada: '08:00',
  horarioSaida: '17:00',
  dtNasc: '1990-05-20',
};

const admin: User = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com', role: UserRole.ADMIN, status: EntityStatus.ACTIVE };
const suporte: User = { ...admin, id: '2', role: UserRole.SUPPORT };
const visualizador: User = { ...admin, id: '3', role: UserRole.VIEWER };

const montar = (overrides: Partial<{ collab: Collaborator; onBack: () => void; currentUser: User; onRefresh: () => void }> = {}) =>
  render(
    <CollaboratorDetailsPage
      collab={overrides.collab ?? collab}
      onBack={overrides.onBack ?? vi.fn()}
      currentUser={overrides.currentUser ?? admin}
      onRefresh={overrides.onRefresh ?? vi.fn()}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getHistory.mockResolvedValue([]);
  getVacationHistory.mockResolvedValue([]);
  getIlhas.mockResolvedValue([
    { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1', coordinatorIds: ['co1'], supervisorIds: ['s1'], status: EntityStatus.ACTIVE },
  ]);
  getOperations.mockResolvedValue([{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }]);
  getClients.mockResolvedValue([{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }]);
  getCoordinators.mockResolvedValue([{ id: 'co1', nome: 'Marcos Rocha', status: EntityStatus.ACTIVE }]);
  getSupervisors.mockResolvedValue([{ id: 's1', nome: 'Juliana Prado', coordinatorIds: ['co1'], status: EntityStatus.ACTIVE }]);
  saveCollaborator.mockResolvedValue(undefined);
  addVacationHistory.mockResolvedValue(undefined);
  addHistory.mockResolvedValue(undefined);
  deleteCollaborator.mockResolvedValue(undefined);
  scheduleTask.mockResolvedValue(undefined);
});

describe('Detalhe do colaborador', () => {
  it('organiza o conteúdo nas sete seções de definição', async () => {
    montar();
    for (const name of ['Dados pessoais', 'Contrato', 'Alocação', 'Jornada', 'Dados de acesso', 'Férias', 'Histórico de alterações']) {
      expect(await screen.findByRole('heading', { name })).toBeVisible();
    }
  });

  it('usa Tag neutra, não Badge, para férias programadas', async () => {
    montar({ collab: { ...collab, status: CollaboratorStatus.ATIVO, feriasInicio: '2026-09-01', feriasFim: '2026-09-10' } });
    const programado = await screen.findByText('Programado');
    expect(programado).not.toHaveAttribute('data-dot');
  });

  it('usa Tag neutra "Em gozo" quando o status é férias', async () => {
    montar({ collab: { ...collab, status: CollaboratorStatus.FERIAS, feriasInicio: '2026-08-01', feriasFim: '2026-08-20' } });
    const emGozo = await screen.findByText('Em gozo');
    expect(emGozo).not.toHaveAttribute('data-dot');
  });

  it('resolve cliente, operação, ilha, coordenador e supervisor pelos ids do colaborador', async () => {
    montar();
    expect(await screen.findByText('Vivo')).toBeInTheDocument();
    expect(screen.getByText('Móvel')).toBeInTheDocument();
    expect(screen.getByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByText('Marcos Rocha')).toBeInTheDocument();
    expect(screen.getByText('Juliana Prado')).toBeInTheDocument();
  });

  it('permite editar e excluir para ADMIN', async () => {
    montar({ currentUser: admin });
    expect(await screen.findByRole('button', { name: /editar cadastro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir colaborador' })).toBeInTheDocument();
  });

  it('permite editar mas não excluir para SUPORTE', async () => {
    montar({ currentUser: suporte });
    expect(await screen.findByRole('button', { name: /editar cadastro/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir colaborador' })).not.toBeInTheDocument();
  });

  it('não oferece edição nem exclusão para outros perfis', async () => {
    montar({ currentUser: visualizador });
    await screen.findByRole('heading', { name: 'Dados pessoais' });
    expect(screen.queryByRole('button', { name: /editar cadastro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir colaborador' })).not.toBeInTheDocument();
  });

  it('filtra o histórico por nome ou matrícula do colaborador', async () => {
    getHistory.mockResolvedValue([
      { id: 'h1', action: 'Atualização do cadastro', target: collab.nome, user: 'Welton', date: '01/01/2026 10:00:00', type: 'update', details: 'Email: alterado' },
      { id: 'h2', action: 'Agendamento de tarefa futura', target: 'Outra Pessoa', user: 'Welton', date: '02/01/2026 10:00:00', type: 'create', details: `Alteração agendada para a matrícula ${collab.matricula}` },
      { id: 'h3', action: 'Ação de outra pessoa', target: 'Outra Pessoa', user: 'Welton', date: '03/01/2026 10:00:00', type: 'update', details: 'nada a ver com este colaborador' },
    ]);
    montar();
    expect(await screen.findByText('Atualização do cadastro')).toBeInTheDocument();
    expect(screen.getByText('Agendamento de tarefa futura')).toBeInTheDocument();
    expect(screen.queryByText('Ação de outra pessoa')).not.toBeInTheDocument();
  });

  it('busca o histórico de férias pela matrícula do colaborador', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Férias' });
    expect(getVacationHistory).toHaveBeenCalledWith(collab.matricula);
  });

  it('grava histórico ao salvar uma edição de cadastro', async () => {
    // CollaboratorFormModal é markup legado fora do escopo desta tarefa: não
    // expõe role="dialog", então localizamos o botão "Salvar" diretamente.
    const onRefresh = vi.fn();
    montar({ onRefresh });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /editar cadastro/i }));
    await user.click(await screen.findByRole('button', { name: 'Salvar' }));
    expect(saveCollaborator).toHaveBeenCalledWith(expect.objectContaining({ matricula: collab.matricula }));
    expect(addHistory).toHaveBeenCalledWith(expect.objectContaining({ action: 'Atualização Colaborador', target: collab.nome }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('só exclui depois de confirmar no modal, e cancelar não exclui', async () => {
    const onBack = vi.fn();
    const onRefresh = vi.fn();
    montar({ onBack, onRefresh });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Excluir colaborador' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(deleteCollaborator).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir colaborador' }));
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }));
    expect(deleteCollaborator).toHaveBeenCalledWith(collab.matricula);
    expect(onRefresh).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it('não introduz um segundo h1 concorrente na página', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Dados pessoais' });
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  });
});
