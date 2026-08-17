import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './MultiSelect';

describe('MultiSelect', () => {
  it('abre um listbox multisseleção e seleciona a opção ativa pelo teclado', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelect label="Clientes" options={[{ value: 'vivo', label: 'Vivo' }]} value={[]} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Clientes' });
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');

    await user.keyboard('{ArrowDown} ');
    expect(onChange).toHaveBeenCalledWith(['vivo']);
    expect(screen.getByRole('status')).toHaveTextContent('Vivo selecionado');
  });

  it('ignora opções desabilitadas e fecha com Escape devolvendo foco ao gatilho', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelect label="Clientes" options={[{ value: 'vivo', label: 'Vivo', disabled: true }]} value={[]} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Clientes' });
    await user.click(trigger);
    await user.keyboard('{ArrowDown} ');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
