import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';
import { Select } from './Select';

describe('Field', () => {
  it('uses the important control-border utility for inputs and selects', () => {
    const { container } = render(
      <>
        <Input aria-label="MatrÃ­cula" />
        <Select aria-label="Status"><option>Ativo</option></Select>
      </>,
    );

    expect(container.querySelector('input')).toHaveClass('!border-[var(--control-border)]');
    expect(container.querySelector('select')).toHaveClass('!border-[var(--control-border)]');
  });

  it('associates the label, help text, and error with the control', () => {
    render(<Input label="Matrícula" hint="Somente números" error="Campo obrigatório" required />);
    const input = screen.getByRole('textbox', { name: 'Matrícula' });

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Somente números Campo obrigatório');
    expect(input).toBeRequired();
  });
});
