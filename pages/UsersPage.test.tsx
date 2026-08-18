import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntityStatus, UserRole } from '../types';
import { UsersPage } from './UsersPage';

const usuarioExistente = { id: 'u1', matricula: '100', nome: 'Beatriz Souza', email: 'bia@q.com', role: UserRole.SUPPORT, status: EntityStatus.ACTIVE };

vi.mock('../services/mockDb', () => ({
  db: {
    getUsers: vi.fn(async () => ([{ id: 'u1', matricula: '100', nome: 'Beatriz Souza', email: 'bia@q.com', role: UserRole.SUPPORT, status: EntityStatus.ACTIVE }])),
    addUser: vi.fn(async () => {}),
    updateUser: vi.fn(async () => {}),
    deleteUser: vi.fn(async () => {}),
    addHistory: vi.fn(async () => {}),
  },
}));

const admin = { id: '1', matricula: '1', nome: 'Admin', email: 'a@a.com', role: UserRole.ADMIN, status: EntityStatus.ACTIVE };
const montar = (currentUser = admin) => render(<UsersPage currentUser={currentUser} onRefresh={vi.fn()} />);

describe('UsersPage', () => {
  it('lista usuários com as colunas Nome, Status e Função', async () => {
    montar();
    await screen.findByText('Beatriz Souza');
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Nome', 'Status', 'Função', 'Ações']);
  });

  it('mostra a função traduzida na linha do usuário', async () => {
    montar();
    const linha = (await screen.findByText('Beatriz Souza')).closest('tr')!;
    expect(within(linha).getByText('Suporte')).toBeInTheDocument();
  });

  it('abre o formulário de novo usuário com todos os campos do cadastro', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Beatriz Souza');
    await user.click(screen.getByRole('button', { name: /^novo$/i }));
    expect(screen.getByLabelText('Matrícula')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Função')).toBeInTheDocument();
  });

  it('oferece as sete funções de usuário no seletor', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Beatriz Souza');
    await user.click(screen.getByRole('button', { name: /^novo$/i }));
    const opcoes = within(screen.getByLabelText('Função')).getAllByRole('option').map(o => o.textContent);
    expect(opcoes).toEqual(['Selecione...', 'Admin', 'Gerente', 'Coordenador', 'Supervisor', 'RH', 'Visualizador', 'Suporte']);
  });

  it('cria um novo usuário chamando db.addUser', async () => {
    const { db } = await import('../services/mockDb');
    const user = userEvent.setup();
    montar();
    await screen.findByText('Beatriz Souza');
    await user.click(screen.getByRole('button', { name: /^novo$/i }));
    fireEvent.change(screen.getByLabelText('Matrícula'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Carlos Lima' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carlos@q.com' } });
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.selectOptions(screen.getByLabelText('Função'), UserRole.VIEWER);
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(db.addUser).toHaveBeenCalledTimes(1));
    expect(db.updateUser).not.toHaveBeenCalled();
    const salvo = (db.addUser as any).mock.calls[0][0];
    expect(salvo.nome).toBe('Carlos Lima');
    expect(salvo.id).toBeTruthy();
  });

  it('edita um usuário existente chamando db.updateUser com o mesmo id', async () => {
    const { db } = await import('../services/mockDb');
    const user = userEvent.setup();
    montar();
    await screen.findByText('Beatriz Souza');
    await user.click(screen.getByRole('button', { name: 'Editar Beatriz Souza' }));
    await user.clear(screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Beatriz Souza Lima');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(db.updateUser).toHaveBeenCalledTimes(1));
    expect(db.addUser).not.toHaveBeenCalled();
    expect((db.updateUser as any).mock.calls[0][0]).toMatchObject({ id: usuarioExistente.id, nome: 'Beatriz Souza Lima' });
  });

  it('exclui um usuário existente após confirmação', async () => {
    const { db } = await import('../services/mockDb');
    const user = userEvent.setup();
    montar();
    await screen.findByText('Beatriz Souza');
    await user.click(screen.getByRole('button', { name: 'Excluir Beatriz Souza' }));
    await user.click(screen.getByRole('button', { name: 'Excluir', exact: true }));
    await waitFor(() => expect(db.deleteUser).toHaveBeenCalledWith('u1'));
  });

  it('não permite mutações para quem não é administrador', async () => {
    montar({ ...admin, role: UserRole.VIEWER });
    await screen.findByText('Beatriz Souza');
    expect(screen.queryByRole('button', { name: /^novo$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
  });
});
