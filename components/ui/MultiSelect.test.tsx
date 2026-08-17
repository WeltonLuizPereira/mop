import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';
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

  it('permite buscar termos com espaço e usar setas sem alterar a seleção', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MultiSelect label="Clientes" options={[{ value: 'vivo-premium', label: 'Vivo Premium' }]} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Clientes' }));
    await user.keyboard('{ArrowDown}');
    const search = screen.getByRole('textbox', { name: 'Buscar em Clientes' });
    await user.click(search);
    expect(fireEvent.keyDown(search, { key: ' ' })).toBe(true);
    await user.type(search, 'Vivo Premium');
    expect(fireEvent.keyDown(search, { key: 'ArrowDown' })).toBe(true);
    expect(fireEvent.keyDown(search, { key: 'ArrowUp' })).toBe(true);

    expect(search).toHaveValue('Vivo Premium');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fecha apenas o listbox no primeiro Escape dentro de um Modal', async () => {
    const user = userEvent.setup();
    const closeModal = vi.fn();

    render(<Modal open onClose={closeModal} title="Filtrar clientes"><MultiSelect label="Clientes" options={[{ value: 'vivo', label: 'Vivo' }]} value={[]} onChange={vi.fn()} /></Modal>);

    const trigger = screen.getByRole('button', { name: 'Clientes' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Filtrar clientes' })).toBeVisible();
    expect(trigger).toHaveFocus();
    expect(closeModal).not.toHaveBeenCalled();
  });
});
