import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CollaboratorStatus } from '../../types';
import { GeralTile } from './GeralTile';
import type { ConsolidadoStat } from '../../lib/ilhaStats';

const geral = (overrides: Partial<ConsolidadoStat> = {}): ConsolidadoStat => ({
  ilhas: 16, semPa: 0, total: 111, ativos: 105, paContratada: 142, provimento: 105 / 142,
  porStatus: [
    { status: CollaboratorStatus.ATIVO, count: 105 },
    { status: CollaboratorStatus.FERIAS, count: 3 },
  ],
  ...overrides,
});

describe('GeralTile', () => {
  it('mostra o título, quantas ilhas somou e o provimento geral fechado', () => {
    render(<GeralTile geral={geral()} />);
    expect(screen.getByText('GERAL QUALITY')).toBeInTheDocument();
    expect(screen.getByText('16 ilhas em operação')).toBeInTheDocument();
    expect(screen.getByText('74%')).toBeInTheDocument();
  });

  it('nomeia o consolidado abaixo da meta além de destacá-lo por cor', () => {
    render(<GeralTile geral={geral()} />);

    expect(screen.getByText('Abaixo da meta de 80%')).toBeVisible();
  });

  it('usa a função tipográfica de dado para o percentual consolidado', () => {
    render(<GeralTile geral={geral()} />);

    expect(screen.getByText('74%')).toHaveClass('t-data');
  });

  it('concorda o singular quando só uma ilha entrou na soma', () => {
    render(<GeralTile geral={geral({ ilhas: 1 })} />);
    expect(screen.getByText('1 ilha em operação')).toBeInTheDocument();
  });

  it('abre fechado, como os tiles de ilha', () => {
    render(<GeralTile geral={geral()} />);
    const card = screen.getByText('GERAL QUALITY').closest('article');
    const botao = screen.getByRole('button', { name: /Ver detalhes consolidados/ });
    const detalhes = screen.getByTestId('geral-expand');
    expect(card).not.toHaveAttribute('aria-expanded');
    expect(card).not.toHaveAttribute('tabindex');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveAttribute('aria-controls', detalhes.id);
    expect(detalhes).toHaveAttribute('aria-hidden', 'true');
  });

  it('revela PA contratada, ativos e a composição por status no hover', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral()} />);
    const card = screen.getByText('GERAL QUALITY').closest('article');

    await user.hover(card!);

    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('PA contratada')).toBeInTheDocument();
    expect(card!.textContent).toContain('férias');
  });

  it('recolhe de volta quando o mouse sai', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral()} />);
    const card = screen.getByText('GERAL QUALITY').closest('article');

    await user.hover(card!);
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'false');

    await user.unhover(card!);
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('também abre no foco do controle de detalhes', () => {
    render(<GeralTile geral={geral()} />);
    const botao = screen.getByRole('button', { name: /Ver detalhes consolidados/ });
    fireEvent.focus(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'false');
  });

  it('mantém o cartão estrutural e delega a expansão ao botão de detalhes', () => {
    render(<GeralTile geral={geral()} />);
    const card = screen.getByText('GERAL QUALITY').closest('article');
    expect(card).not.toHaveAttribute('role');
    expect(screen.getByRole('button', { name: /Ver detalhes consolidados/ })).toBeInTheDocument();
  });

  it('abre e recolhe detalhes no toque pelo controle explícito', async () => {
    render(<GeralTile geral={geral()} />);
    const botao = screen.getByRole('button', { name: /Ver detalhes consolidados/ });

    fireEvent.pointerDown(botao, { pointerType: 'touch' });
    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');

    fireEvent.pointerDown(botao, { pointerType: 'touch' });
    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });

  it('mantém os detalhes abertos quando o mouse sai enquanto o controle tem foco', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral()} />);
    const card = screen.getByText('GERAL QUALITY').closest('article');
    const botao = screen.getByRole('button', { name: /Ver detalhes consolidados/ });

    await user.tab();
    await user.unhover(card!);

    expect(botao).toHaveAttribute('aria-expanded', 'true');
  });

  it('recolhe os detalhes quando o foco de teclado sai do cartão', async () => {
    const user = userEvent.setup();
    render(<><GeralTile geral={geral()} /><button type="button">Depois</button></>);

    await user.tab();
    await user.tab();

    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('avisa que a conta está incompleta quando alguma ilha não tem PA', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral({ semPa: 2 })} />);

    await user.hover(screen.getByText('GERAL QUALITY').closest('article')!);

    expect(screen.getByText(/2 ilhas ainda sem PA definida/)).toBeInTheDocument();
    expect(screen.getByText(/mais alto do que é/)).toBeInTheDocument();
  });

  it('cala o aviso quando todas as ilhas já têm PA', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral({ semPa: 0 })} />);

    await user.hover(screen.getByText('GERAL QUALITY').closest('article')!);

    expect(screen.queryByText(/sem PA definida/)).not.toBeInTheDocument();
  });

  it('mostra "—" quando nenhuma ilha tem PA contratada', () => {
    render(<GeralTile geral={geral({ paContratada: null, provimento: null, semPa: 16 })} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
