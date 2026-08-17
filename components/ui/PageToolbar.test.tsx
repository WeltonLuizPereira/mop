import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageToolbar } from './PageToolbar';

describe('PageToolbar', () => {
  it('organiza descrição, filtros e ações sem criar outro título de página', () => {
    render(
      <PageToolbar
        description="Consulte e gerencie a equipe."
        filters={<button type="button">Agosto de 2026</button>}
        actions={<button type="button">Exportar</button>}
      />,
    );

    expect(screen.getByText('Consulte e gerencie a equipe.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agosto de 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
