import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('mantém a ação de limpar indisponível sem filtros ativos', () => {
    render(<FilterBar hasActiveFilters={false} onClear={vi.fn()}><input aria-label="Cliente" /></FilterBar>);
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeDisabled();
  });

  it('limpa os filtros ativos', async () => {
    const onClear = vi.fn();
    render(<FilterBar hasActiveFilters onClear={onClear}><input aria-label="Cliente" /></FilterBar>);
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
