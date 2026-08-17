import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('nomeia o estado vazio e oferece a próxima ação', () => {
    render(<EmptyState title="Nenhum colaborador" description="Cadastre o primeiro." action={<button>Cadastrar</button>} />);
    expect(screen.getByRole('region', { name: 'Nenhum colaborador' })).toBeInTheDocument();
    expect(screen.getByText('Cadastre o primeiro.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument();
  });
});
