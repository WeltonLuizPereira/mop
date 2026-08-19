import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntityStatus, UserRole } from '../types';
import { CrudPage } from './CrudPage';

vi.mock('../services/mockDb', () => ({
  db: { addHistory: vi.fn(async () => {}) },
}));

const admin = { id: '1', matricula: '1', nome: 'Admin', email: 'a@a.com', role: UserRole.ADMIN, status: EntityStatus.ACTIVE };
const viewer = { ...admin, id: '2', role: UserRole.VIEWER };

const clienteA = { id: 'a', nome: 'Cliente A', status: EntityStatus.ACTIVE, clientId: 'x1', operationId: 'op1' };
const clienteB = { id: 'b', nome: 'Cliente B', status: EntityStatus.ACTIVE, clientId: 'x2', operationId: 'op2' };

const schema = [
  { key: 'nome', label: 'Nome', type: 'text' as const },
  { key: 'clientId', label: 'Cliente', type: 'select' as const, options: [{ value: 'x1', label: 'Empresa X' }, { value: 'x2', label: 'Empresa Y' }] },
  { key: 'operationId', label: 'Operação', type: 'select' as const, options: [{ value: 'op1', label: 'Operação 1' }, { value: 'op2', label: 'Operação 2' }] },
  { key: 'tags', label: 'Marcas', type: 'multiselect' as const, options: [{ value: 't1', label: 'Tag 1' }, { value: 't2', label: 'Tag 2' }] },
];

const baseProps = { title: 'Clientes', singular: 'cliente', schema, onRefresh: vi.fn() };

describe('CrudPage', () => {
  it('anuncia carregamento e não mostra vazio enquanto a promessa está pendente', () => {
    const pending = new Promise<any[]>(() => {});
    render(<CrudPage {...baseProps} data={pending} onSave={vi.fn()} onDelete={vi.fn()} currentUser={admin} />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando cadastros');
    expect(screen.queryByText('Nenhum registro encontrado')).not.toBeInTheDocument();
  });

  it('ordena por nome e nomeia o botão de editar com o nome do item', () => {
    render(<CrudPage {...baseProps} data={[clienteB, clienteA]} onSave={vi.fn()} onDelete={vi.fn()} currentUser={admin} />);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Cliente A');
    expect(screen.getByRole('button', { name: 'Editar Cliente A' })).toBeVisible();
  });

  it('filtra a lista pela busca', async () => {
    const user = userEvent.setup();
    render(<CrudPage {...baseProps} data={[clienteA, clienteB]} onSave={vi.fn()} onDelete={vi.fn()} currentUser={admin} />);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar Clientes' }), 'Cliente A');
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.queryByText('Cliente B')).not.toBeInTheDocument();
  });

  it('mostra erro com ação de tentar novamente que aciona onRefresh', async () => {
    const onRefresh = vi.fn();
    const rejected = Promise.reject(new Error('falhou'));
    rejected.catch(() => {});
    render(<CrudPage {...baseProps} data={rejected} onSave={vi.fn()} onDelete={vi.fn()} currentUser={admin} onRefresh={onRefresh} />);
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' });
    fireEvent.click(retry);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('não oferece mutações para quem não é administrador', () => {
    render(<CrudPage {...baseProps} data={[clienteA]} onSave={vi.fn()} onDelete={vi.fn()} currentUser={viewer} />);
    expect(screen.queryByRole('button', { name: /^novo\b/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
  });

  it('gera um id novo ao criar um registro', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CrudPage {...baseProps} data={[]} onSave={onSave} onDelete={vi.fn()} currentUser={admin} />);
    await user.click(screen.getAllByRole('button', { name: /^novo\b/i })[0]);
    await user.type(screen.getByLabelText('Nome'), 'Cliente Novo');
    await user.selectOptions(screen.getByLabelText('Cliente'), 'x1');
    await user.selectOptions(screen.getByLabelText('Operação'), 'op1');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload.id).toBeTruthy();
    expect(payload.nome).toBe('Cliente Novo');
  });

  it('preserva o id ao editar um registro existente', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CrudPage {...baseProps} data={[clienteA]} onSave={onSave} onDelete={vi.fn()} currentUser={admin} />);
    await user.click(screen.getByRole('button', { name: 'Editar Cliente A' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].id).toBe('a');
  });

  it('limpa a operação ao trocar o cliente', async () => {
    const user = userEvent.setup();
    render(<CrudPage {...baseProps} data={[clienteA]} onSave={vi.fn()} onDelete={vi.fn()} currentUser={admin} />);
    await user.click(screen.getByRole('button', { name: 'Editar Cliente A' }));
    expect(screen.getByLabelText('Operação')).toHaveValue('op1');
    await user.selectOptions(screen.getByLabelText('Cliente'), 'x2');
    expect(screen.getByLabelText('Operação')).toHaveValue('');
  });

  it('permite selecionar múltiplas marcas ao salvar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CrudPage {...baseProps} data={[]} onSave={onSave} onDelete={vi.fn()} currentUser={admin} />);
    await user.click(screen.getAllByRole('button', { name: /^novo\b/i })[0]);
    await user.type(screen.getByLabelText('Nome'), 'Cliente X');
    await user.selectOptions(screen.getByLabelText('Cliente'), 'x1');
    await user.selectOptions(screen.getByLabelText('Operação'), 'op1');
    // as marcas são caixas de seleção dentro do próprio formulário
    await user.click(screen.getByRole('checkbox', { name: 'Tag 1' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave.mock.calls[0][0].tags).toEqual(['t1']);
  });

  it('confirma a exclusão em um modal antes de remover', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<CrudPage {...baseProps} data={[clienteA]} onSave={vi.fn()} onDelete={onDelete} currentUser={admin} />);
    await user.click(screen.getByRole('button', { name: 'Excluir Cliente A' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onDelete).toHaveBeenCalledWith('a');
  });
});
