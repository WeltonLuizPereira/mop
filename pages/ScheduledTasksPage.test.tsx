import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScheduledTasksPage } from './ScheduledTasksPage';

const mocks = vi.hoisted(() => ({
  getPendingTasks: vi.fn(),
  getCollaborators: vi.fn(),
  cancelTask: vi.fn(),
  cancelAllTasks: vi.fn(),
  updateTask: vi.fn(),
  addHistory: vi.fn(),
}));

vi.mock('../services/mockDb', () => ({ db: mocks }));

// Outro agente restila CollaboratorFormModal em paralelo (Task 4). Mockamos
// o componente inteiro para não depender de sua estrutura interna nem do seu
// estado de edição concorrente — só do contrato de props já estabelecido
// (initialData, onClose, onSave, onSchedule, initialScheduleDate).
vi.mock('../components/collaborators/CollaboratorFormModal', () => ({
  CollaboratorFormModal: (props: any) => (
    <div data-testid="mock-modal">
      <span data-testid="mock-initial-data">{JSON.stringify(props.initialData)}</span>
      <button onClick={() => props.onSchedule({ ...props.initialData, nome: props.initialData?.nome ?? 'Sem nome' }, '2026-09-01')}>
        Confirmar edição mock
      </button>
      <button onClick={props.onClose}>Fechar mock</button>
    </div>
  ),
}));

const flush = async () => {
  await act(async () => undefined);
  await act(async () => undefined);
};

const colaboradorExistente = { matricula: '10', nome: 'Larissa Tavares', email: 'l@q.com' };

const tarefaComColaboradorExistente = {
  id: 't1', matricula: '10', changes: { horarioEntrada: '08:00' },
  scheduled_date: '2026-08-20', status: 'PENDING' as const, created_by: 'Admin', created_at: '2026-08-01',
};

const tarefaComFallbackNovo = {
  id: 't2', matricula: '99', changes: { nome: 'Marcos Rocha' },
  scheduled_date: '2026-08-22', status: 'PENDING' as const, created_by: 'Admin', created_at: '2026-08-01',
};

const tarefaSemNomeResolvivel = {
  id: 't3', matricula: '77', changes: { horarioSaida: '18:00' },
  scheduled_date: '2026-08-25', status: 'PENDING' as const, created_by: 'Admin', created_at: '2026-08-01',
};

const tarefaComCincoChaves = {
  id: 't4', matricula: '10', changes: { nome: 'a', email: 'b', horarioEntrada: 'c', horarioSaida: 'd', dtNasc: 'e' },
  scheduled_date: '2026-08-19', status: 'PENDING' as const, created_by: 'Admin', created_at: '2026-08-01',
};

const tarefaComMaisDeCincoChaves = {
  id: 't5', matricula: '10',
  changes: { nome: 'a', email: 'b', horarioEntrada: 'c', horarioSaida: 'd', dtNasc: 'e', ilhaId: 'f' },
  scheduled_date: '2026-08-19', status: 'PENDING' as const, created_by: 'Admin', created_at: '2026-08-01',
};

describe('Tarefas agendadas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T12:00:00'));
    mocks.getPendingTasks.mockReset().mockResolvedValue([tarefaComColaboradorExistente]);
    mocks.getCollaborators.mockReset().mockResolvedValue([colaboradorExistente]);
    mocks.cancelTask.mockReset().mockResolvedValue(undefined);
    mocks.cancelAllTasks.mockReset().mockResolvedValue(undefined);
    mocks.updateTask.mockReset().mockResolvedValue(undefined);
    mocks.addHistory.mockReset().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('mostra o nome do colaborador quando encontrado', async () => {
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.getByText('Larissa Tavares')).toBeInTheDocument();
  });

  it('usa o nome das alterações com sufixo (Novo) quando o colaborador ainda não existe', async () => {
    mocks.getPendingTasks.mockResolvedValue([tarefaComFallbackNovo]);
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.getByText('Marcos Rocha (Novo)')).toBeInTheDocument();
  });

  it('mostra reticências quando o nome não pode ser resolvido', async () => {
    mocks.getPendingTasks.mockResolvedValue([tarefaSemNomeResolvivel]);
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('resume até cinco alterações como a lista de chaves', async () => {
    mocks.getPendingTasks.mockResolvedValue([tarefaComCincoChaves]);
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.getByText('nome, email, horarioEntrada, horarioSaida, dtNasc')).toBeInTheDocument();
  });

  it('resume como "Alteração completa (cadastro)" quando há mais de cinco chaves', async () => {
    mocks.getPendingTasks.mockResolvedValue([tarefaComMaisDeCincoChaves]);
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.getByText('Alteração completa (cadastro)')).toBeInTheDocument();
  });

  it('define as colunas da tabela', async () => {
    render(<ScheduledTasksPage />);
    await flush();
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Data programada', 'Matrícula', 'Colaborador', 'Resumo alterações', 'Criado por', 'Ações']);
  });

  it('cancela uma tarefa individualmente após confirmação', async () => {
    render(<ScheduledTasksPage />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await flush();
    expect(window.confirm).toHaveBeenCalled();
    expect(mocks.cancelTask).toHaveBeenCalledWith('t1');
    expect(mocks.getPendingTasks).toHaveBeenCalledTimes(2);
  });

  it('não cancela a tarefa quando a confirmação é recusada', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ScheduledTasksPage />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await flush();
    expect(mocks.cancelTask).not.toHaveBeenCalled();
  });

  it('cancela todas as tarefas após confirmação, quando existem tarefas pendentes', async () => {
    render(<ScheduledTasksPage />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /excluir todas/i }));
    await flush();
    expect(mocks.cancelAllTasks).toHaveBeenCalledTimes(1);
  });

  it('oculta o botão de excluir todas e mostra o estado vazio quando não há tarefas', async () => {
    mocks.getPendingTasks.mockResolvedValue([]);
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.queryByRole('button', { name: /excluir todas/i })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /nenhuma tarefa pendente/i })).toBeInTheDocument();
  });

  it('mostra a contagem real de tarefas pendentes no resumo', async () => {
    const { container } = render(<ScheduledTasksPage />);
    await flush();
    const resumo = container.querySelector('[aria-label="Resumo da lista"]');
    expect(resumo).toHaveTextContent('1');
  });

  it('abre o formulário de edição com os dados existentes mesclados', async () => {
    render(<ScheduledTasksPage />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await flush();
    const modal = screen.getByTestId('mock-initial-data');
    const dados = JSON.parse(modal.textContent || '{}');
    expect(dados.nome).toBe('Larissa Tavares');
    expect(dados.horarioEntrada).toBe('08:00');
  });

  it('grava histórico com usuário Sistema ao confirmar a edição e recarrega a lista', async () => {
    render(<ScheduledTasksPage />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /confirmar edição mock/i }));
    await flush();

    expect(mocks.updateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ nome: 'Larissa Tavares' }), '2026-09-01');
    expect(mocks.addHistory).toHaveBeenCalledWith(expect.objectContaining({
      action: 'Edição de Tarefa Agendada',
      target: 'Larissa Tavares',
      user: 'Sistema',
      type: 'update',
    }));
    expect(mocks.addHistory.mock.calls[0][0].date).toContain('2026');
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    expect(mocks.getPendingTasks).toHaveBeenCalledTimes(2);
  });

  it('mostra alerta quando falha ao excluir todas as tarefas', async () => {
    mocks.cancelAllTasks.mockRejectedValue(new Error('falha de rede'));
    render(<ScheduledTasksPage />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /excluir todas/i }));
    await flush();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('falha de rede'));
  });

  it('mostra estado de carregamento enquanto busca as tarefas', () => {
    mocks.getPendingTasks.mockReturnValue(new Promise(() => undefined));
    render(<ScheduledTasksPage />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('mostra erro e permite tentar novamente', async () => {
    mocks.getPendingTasks.mockRejectedValueOnce(new Error('falhou'));
    render(<ScheduledTasksPage />);
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    mocks.getPendingTasks.mockResolvedValueOnce([tarefaComColaboradorExistente]);
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    await flush();
    expect(screen.getByText('Larissa Tavares')).toBeInTheDocument();
  });
});
