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

  it('nomeia a condição abaixo da meta além de destacá-la por cor', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);

    expect(screen.getByText('Abaixo da meta de 80%')).toBeVisible();
  });

  it('usa a função tipográfica de dado para o percentual', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);

    expect(screen.getByText('50%')).toHaveClass('t-data');
  });

  it('não mostra PA Contratada, Ativos nem o detalhamento por status fechado', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('revela PA Contratada, Ativos e o detalhamento por status no hover', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByText('Ilha 01 — SAC').closest('article');

    await user.hover(card!);

    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('PA contratada')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // PA contratada
    expect(card!.textContent).toContain('1');
    expect(card!.textContent).toContain('férias');
  });

  it('recolhe de volta quando o mouse sai', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByText('Ilha 01 — SAC').closest('article');

    await user.hover(card!);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'false');

    await user.unhover(card!);
    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('expõe detalhes pelo controle no foco de teclado, sem transformar o cartão em botão', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const navegacao = screen.getByRole('button', { name: /Abrir Ilha 01 — SAC/ });
    const detalhes = screen.getByRole('button', { name: /Ver detalhes de Ilha 01 — SAC/ });
    const regiao = screen.getByTestId('ilha-expand');

    expect(navegacao.closest('article')).not.toHaveAttribute('role');
    expect(detalhes).toHaveAttribute('aria-expanded', 'false');
    expect(detalhes).toHaveAttribute('aria-controls', regiao.id);
    fireEvent.focus(detalhes);
    expect(detalhes).toHaveAttribute('aria-expanded', 'true');
    expect(regiao).toHaveAttribute('aria-hidden', 'false');
    expect(regiao.closest('button')).toBeNull();
    expect(screen.getByText('PA contratada')).toBeVisible();
    expect(screen.getByText(/Por status/i)).toBeVisible();
  });

  it('abre e recolhe detalhes no toque sem disparar a navegação da ilha', async () => {
    const abrir = vi.fn();
    render(<IlhaTile ilha={ilha()} onOpen={abrir} />);
    const detalhes = screen.getByRole('button', { name: /Ver detalhes de Ilha 01 — SAC/ });

    fireEvent.pointerDown(detalhes, { pointerType: 'touch' });
    fireEvent.click(detalhes);
    expect(detalhes).toHaveAttribute('aria-expanded', 'true');
    expect(abrir).not.toHaveBeenCalled();

    fireEvent.pointerDown(detalhes, { pointerType: 'touch' });
    fireEvent.click(detalhes);
    expect(detalhes).toHaveAttribute('aria-expanded', 'false');
    expect(abrir).not.toHaveBeenCalled();
  });

  it('mantém os detalhes abertos quando o mouse sai enquanto o controle tem foco', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByText('Ilha 01 — SAC').closest('article');
    const detalhes = screen.getByRole('button', { name: /Ver detalhes de Ilha 01 — SAC/ });

    await user.tab();
    await user.tab();
    await user.unhover(card!);

    expect(detalhes).toHaveAttribute('aria-expanded', 'true');
  });

  it('recolhe os detalhes quando o foco de teclado sai do cartão', async () => {
    const user = userEvent.setup();
    render(<><IlhaTile ilha={ilha()} onOpen={vi.fn()} /><button type="button">Depois</button></>);

    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByTestId('ilha-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('mostra "—" e "sem PA" quando a ilha não tem PA Contratada no mês', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha({ paContratada: null, provimento: null })} onOpen={vi.fn()} />);

    expect(screen.getByText('—')).toBeInTheDocument();

    await user.hover(screen.getByText('Ilha 01 — SAC').closest('article')!);
    expect(screen.getByText('sem PA')).toBeInTheDocument();
  });

  it('continua clicável em qualquer estado', async () => {
    const abrir = vi.fn();
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={abrir} />);

    await user.click(screen.getByRole('button', { name: /Abrir Ilha 01 — SAC/ }));
    expect(abrir).toHaveBeenCalled();
  });
});
