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

  it('concorda o singular quando só uma ilha entrou na soma', () => {
    render(<GeralTile geral={geral({ ilhas: 1 })} />);
    expect(screen.getByText('1 ilha em operação')).toBeInTheDocument();
  });

  it('abre fechado, como os tiles de ilha', () => {
    render(<GeralTile geral={geral()} />);
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('revela PA contratada, ativos e a composição por status no hover', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral()} />);
    const card = screen.getByLabelText(/Geral Quality/);

    await user.hover(card);

    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('PA contratada')).toBeInTheDocument();
    expect(card.textContent).toContain('férias');
  });

  it('recolhe de volta quando o mouse sai', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral()} />);
    const card = screen.getByLabelText(/Geral Quality/);

    await user.hover(card);
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'false');

    await user.unhover(card);
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'true');
  });

  it('também abre no foco de teclado', () => {
    render(<GeralTile geral={geral()} />);
    fireEvent.focus(screen.getByLabelText(/Geral Quality/));
    expect(screen.getByTestId('geral-expand')).toHaveAttribute('aria-hidden', 'false');
  });

  it('não se anuncia como botão — é leitura, não leva a lugar nenhum', () => {
    render(<GeralTile geral={geral()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('avisa que a conta está incompleta quando alguma ilha não tem PA', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral({ semPa: 2 })} />);

    await user.hover(screen.getByLabelText(/Geral Quality/));

    expect(screen.getByText(/2 ilhas ainda sem PA definida/)).toBeInTheDocument();
    expect(screen.getByText(/mais alto do que é/)).toBeInTheDocument();
  });

  it('cala o aviso quando todas as ilhas já têm PA', async () => {
    const user = userEvent.setup();
    render(<GeralTile geral={geral({ semPa: 0 })} />);

    await user.hover(screen.getByLabelText(/Geral Quality/));

    expect(screen.queryByText(/sem PA definida/)).not.toBeInTheDocument();
  });

  it('mostra "—" quando nenhuma ilha tem PA contratada', () => {
    render(<GeralTile geral={geral({ paContratada: null, provimento: null, semPa: 16 })} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
