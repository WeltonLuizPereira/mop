import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { EntityStatus, UserRole, type User } from '../../types';
import { AppShell } from './AppShell';

vi.mock('./NotificationCenter', () => ({ NotificationCenter: () => null }));

const currentUser: User = {
  id: '1', matricula: '3924', nome: 'Welton Pereira', email: 'w@q.com',
  role: UserRole.ADMIN, status: EntityStatus.ACTIVE,
};

const montar = () => render(
  <ThemeProvider>
    <AppShell currentUser={currentUser} currentPage="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()}>
      <button type="button">Conteúdo</button>
    </AppShell>
  </ThemeProvider>,
);

describe('AppShell', () => {
  it('oferece atalho direto para o conteúdo principal', () => {
    montar();
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' }))
      .toHaveAttribute('href', '#conteudo-principal');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo-principal');
  });

  it('torna o fundo inerte enquanto a gaveta móvel está aberta', async () => {
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('dialog', { name: 'Menu principal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('inert');
  });

  it('fecha a gaveta com Escape e devolve o foco ao gatilho', async () => {
    montar();
    const trigger = screen.getByRole('button', { name: 'Abrir menu' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu principal' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
