import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataProvider } from './contexts/DataContext';
import { createAppData } from './data/appData';
import { db } from './services/mockDb';
import App from './App';

vi.mock('./services/mockDb', () => ({ db: {
  getCollaborators: vi.fn(async () => []), getClients: vi.fn(async () => []),
  getOperations: vi.fn(async () => []), getIlhas: vi.fn(async () => []),
  getCoordinators: vi.fn(async () => []), getSupervisors: vi.fn(async () => []),
  processDueTasks: vi.fn(async () => undefined), ensureProvimentoMesAtual: vi.fn(async () => undefined),
  checkVacationReturns: vi.fn(async () => undefined), checkAvisoPrevioEnds: vi.fn(async () => undefined),
} }));

vi.mock('./pages/LoginPage', () => ({ LoginPage: ({ onLogin }: any) =>
  <button onClick={() => onLogin({ id: '1', nome: 'Welton', role: 'ADMIN' })}>Entrar</button> }));
vi.mock('./components/shell/AppShell', () => ({ AppShell: ({ children, onNavigate }: any) => <>
  <button onClick={() => onNavigate('collaborators')}>Colaboradores</button>{children}
</> }));
vi.mock('./pages/DashboardPage', () => ({ DashboardPage: () => <div>Dashboard</div> }));
vi.mock('./pages/CollaboratorsPage', () => ({ CollaboratorsPage: ({ onRefresh }: any) => <>
  <input aria-label="Busca local" defaultValue="" />
  <button onClick={onRefresh}>Salvar alteraÃ§Ã£o</button>
</> }));

describe('App', () => {
  it('preserva o estado local ao invalidar somente o recurso alterado', async () => {
    const store = createAppData(db as any);
    await Promise.all([store.collaborators.refresh(), store.clients.refresh()]);
    render(<DataProvider store={store}><App /></DataProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await user.click(screen.getByRole('button', { name: 'Colaboradores' }));
    const busca = screen.getByRole('textbox', { name: 'Busca local' });
    await user.type(busca, 'Ana');
    await user.click(screen.getByRole('button', { name: /Salvar/ }));

    expect(busca).toHaveValue('Ana');
    await waitFor(() => expect(db.getCollaborators).toHaveBeenCalledTimes(2));
    expect(db.getClients).toHaveBeenCalledTimes(1);
  });
});
