import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'todos', label: 'Todos', panelId: 'painel-todos' },
  { value: 'ativos', label: 'Ativos', panelId: 'painel-ativos', disabled: true },
  { value: 'afastados', label: 'Afastados', panelId: 'painel-afastados' },
] as const;

describe('SegmentedControl', () => {
  it('expõe seleção e relação com os painéis', () => {
    render(<SegmentedControl label="Situação" options={options} value="todos" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist', { name: 'Situação' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-controls', 'painel-todos');
    expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true');
  });

  it('navega com setas e ignora opções desabilitadas', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Situação" options={options} value="todos" onChange={onChange} />);
    const todos = screen.getByRole('tab', { name: 'Todos' });
    todos.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('afastados');
    expect(screen.getByRole('tab', { name: 'Afastados' })).toHaveFocus();
  });

  it('navega ao início e ao fim com Home e End', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Situação" options={options} value="afastados" onChange={onChange} />);
    const afastados = screen.getByRole('tab', { name: 'Afastados' });
    afastados.focus();
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('todos');
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('afastados');
  });
});
