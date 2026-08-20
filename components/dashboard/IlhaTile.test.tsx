import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus } from '../../types';
import { IlhaTile } from './IlhaTile';
import type { IlhaStat } from '../../lib/ilhaStats';

const ilha = (overrides: Partial<IlhaStat> = {}): IlhaStat => ({
  id: 'i1', nome: 'Ilha 01 — SAC', cliente: 'Vivo', operacao: 'Móvel',
  total: 2, ativos: 1, paContratada: 2, provimento: 0.5,
  porStatus: [
    { status: CollaboratorStatus.ATIVO, count: 1 },
    { status: CollaboratorStatus.FERIAS, count: 1 },
  ],
  ...overrides,
});

describe('IlhaTile', () => {
  it('mostra o nome, o cliente/operação e o percentual de provimento fechado', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    expect(screen.getByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByText('Vivo · Móvel')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('não mostra PA Contratada, Ativos nem o detalhamento por status fechado', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('revela PA Contratada, Ativos e o detalhamento por status no hover', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByRole('button', { name: /Ilha 01 — SAC/ });

    await user.hover(card);

    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('PA contratada')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // PA contratada
    expect(card.textContent).toContain('1');
    expect(card.textContent).toContain('férias');
  });

  it('recolhe de volta quando o mouse sai', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByRole('button', { name: /Ilha 01 — SAC/ });

    await user.hover(card);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'false');

    await user.unhover(card);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('também expande no foco de teclado, não só no mouse', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByRole('button', { name: /Ilha 01 — SAC/ });

    fireEvent.focus(card);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'false');
  });

  it('mostra "—" e "sem PA" quando a ilha não tem PA Contratada no mês', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha({ paContratada: null, provimento: null })} onOpen={vi.fn()} />);

    expect(screen.getByText('—')).toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: /Ilha 01 — SAC/ }));
    expect(screen.getByText('sem PA')).toBeInTheDocument();
  });

  it('continua clicável em qualquer estado', async () => {
    const abrir = vi.fn();
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={abrir} />);

    await user.click(screen.getByRole('button', { name: /Ilha 01 — SAC/ }));
    expect(abrir).toHaveBeenCalled();
  });
});
