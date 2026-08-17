import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('keeps aria-busy true when a caller supplies false during loading', () => {
    render(<Button loading aria-busy={false}>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-busy', 'true');
  });

  it('blocks the action and announces progress while loading', () => {
    render(<Button loading>Salvar</Button>);
    const button = screen.getByRole('button', { name: 'Salvar' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('dispara o clique', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar alterações</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('não dispara quando desabilitado', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Salvar alterações</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('usa texto quase-preto sobre o laranja, nunca branco', () => {
    render(<Button variant="primary">Entrar</Button>);
    expect(screen.getByRole('button').className).toContain('text-on-brand');
    expect(screen.getByRole('button').className).not.toContain('text-white');
  });

  it('é do tipo button por padrão, para não enviar formulário sem querer', () => {
    render(<Button>Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
