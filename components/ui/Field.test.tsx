import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Field', () => {
  it('associates the label, help text, and error with the control', () => {
    render(<Input label="Matrícula" hint="Somente números" error="Campo obrigatório" required />);
    const input = screen.getByRole('textbox', { name: 'Matrícula' });

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Somente números Campo obrigatório');
    expect(input).toBeRequired();
  });
});
