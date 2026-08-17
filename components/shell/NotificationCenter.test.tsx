import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenter } from './NotificationCenter';

const mocks = vi.hoisted(() => ({
  getCollaborators: vi.fn(),
  getHistory: vi.fn(),
}));

vi.mock('../../services/mockDb', () => ({ db: mocks }));

describe('NotificationCenter', () => {
  beforeEach(() => {
    mocks.getCollaborators.mockReset().mockResolvedValue([]);
    mocks.getHistory.mockReset().mockResolvedValue([]);
  });

  it('nomeia o botão e o painel e apresenta o estado vazio', async () => {
    render(<NotificationCenter />);
    const trigger = screen.getByRole('button', { name: 'Notificações' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Central de notificações' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma pendência urgente para hoje.')).toBeInTheDocument();
  });

  it('mostra carregamento enquanto a consulta está pendente', async () => {
    mocks.getCollaborators.mockReturnValue(new Promise(() => undefined));
    render(<NotificationCenter />);
    await userEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    expect(screen.getByRole('status', { name: 'Carregando notificações' })).toHaveAttribute('aria-busy', 'true');
  });

  it('comunica falha da consulta', async () => {
    mocks.getCollaborators.mockRejectedValue(new Error('indisponível'));
    render(<NotificationCenter />);
    await userEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as notificações.');
  });

  it('fecha com Escape e devolve o foco ao botão', async () => {
    render(<NotificationCenter />);
    const trigger = screen.getByRole('button', { name: 'Notificações' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog', { name: 'Central de notificações' });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('não rouba foco de interações externas enquanto está fechado', async () => {
    render(<><button type="button">Ação externa</button><NotificationCenter /></>);
    await act(async () => undefined);
    const externalAction = screen.getByRole('button', { name: 'Ação externa' });
    externalAction.focus();
    fireEvent.mouseDown(externalAction);
    expect(externalAction).toHaveFocus();
  });

  it('atualiza a consulta a cada minuto', async () => {
    vi.useFakeTimers();
    try {
      render(<NotificationCenter />);
      await act(async () => undefined);
      expect(mocks.getCollaborators).toHaveBeenCalledTimes(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
      expect(mocks.getCollaborators).toHaveBeenCalledTimes(2);
      expect(mocks.getHistory).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
