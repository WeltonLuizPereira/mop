import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntityStatus, UserRole, type User } from '../../types';
import { Sidebar } from './Sidebar';

const usuario = (role: UserRole): User => ({
  id: '1', matricula: '3924', nome: 'Welton Pereira',
  email: 'w@q.com', role, status: EntityStatus.ACTIVE,
});

const montar = (role: UserRole, pagina = 'dashboard') =>
  render(
    <Sidebar
      currentUser={usuario(role)}
      currentPage={pagina}
      onNavigate={vi.fn()}
      onLogout={vi.fn()}
    />,
  );

describe('Sidebar', () => {
  it('mostra os cadastros ao administrador', () => {
    montar(UserRole.ADMIN);
    expect(screen.getByText('Ilhas')).toBeInTheDocument();
    expect(screen.getByText('Cadastros')).toBeInTheDocument();
  });

  it('esconde cadastros e o próprio rótulo do grupo do visualizador', () => {
    montar(UserRole.VIEWER);
    expect(screen.queryByText('Ilhas')).not.toBeInTheDocument();
    expect(screen.queryByText('Cadastros')).not.toBeInTheDocument();
  });

  it('marca a página atual para tecnologia assistiva', () => {
    montar(UserRole.ADMIN, 'collaborators');
    expect(screen.getByRole('button', { name: /colaboradores/i }))
      .toHaveAttribute('aria-current', 'page');
  });

  it('identifica quem está logado', () => {
    montar(UserRole.ADMIN);
    expect(screen.getByText('Welton Pereira')).toBeInTheDocument();
  });
});
