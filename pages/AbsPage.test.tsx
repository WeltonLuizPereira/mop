import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbsPage } from './AbsPage';

vi.mock('../contexts/DataContext', () => ({
  useResource: () => ({ data: [] }),
}));

vi.mock('../services/abs', () => ({
  getAbsImportStatus: vi.fn(async () => ({ status: 'COMPLETED', finishedAt: '2026-09-30', maxWorkDate: '2026-09-29', rowsRead: 10, unmatchedCount: 0 })),
  getAbsMonth: vi.fn(async () => [{
    matricula: '123', collaboratorName: 'Ana Silva', supervisorName: 'Bia', ilhaName: 'Ilha 1', employmentStatus: 'ATIVO',
    justifiedAbsences: 1, unjustifiedAbsences: 1, totalAbsences: 2, presences: 8, absRate: 0.2,
    dailyStatuses: { '2026-09-01': 'P' },
  }]),
}));

describe('AbsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mantém a navegação horizontal acessível no topo da grade', async () => {
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');

    const top = screen.getByTestId('abs-scroll-top');
    const grid = screen.getByTestId('abs-grid-scroll');
    fireEvent.scroll(top, { target: { scrollLeft: 480 } });
    expect(grid.scrollLeft).toBe(480);
  });

  it('mostra indicadores consolidados e a quantidade de colaboradores', async () => {
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await waitFor(() => expect(screen.getByText('colaborador')).toBeInTheDocument());
    expect(screen.getByTestId('abs-metric-rate')).toHaveTextContent('20,00%');
    expect(screen.getByTestId('abs-metric-presences')).toHaveTextContent('8');
  });

  it('busca por nome ou matrícula sem nova consulta ao banco', async () => {
    const user = userEvent.setup();
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar nome ou matrícula' }), '999');
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
    expect(screen.getByText(/Nenhum colaborador corresponde/)).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox', { name: 'Buscar nome ou matrícula' }));
    await user.type(screen.getByRole('searchbox', { name: 'Buscar nome ou matrícula' }), '123');
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });

  it('mantém filtros recolhidos e mostra a data real da base', async () => {
    const user = userEvent.setup();
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');
    expect(screen.getByText('Atualizado até 29/09/2026')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cliente')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
  });

  it('abre os indicadores individuais ao clicar na linha do colaborador', async () => {
    const user = userEvent.setup();
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');
    await user.click(screen.getByRole('row', { name: 'Ver ABS de Ana Silva' }));
    const dialog = screen.getByRole('dialog', { name: 'Ana Silva' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Faltas justificadas')).toBeInTheDocument();
    expect(within(dialog).getByTestId('abs-detail-rate')).toHaveTextContent('20,00%');
    expect(within(dialog).getByText('2 faltas em 10 apontamentos')).toBeInTheDocument();
  });

  it('abre uma legenda visual para as nomenclaturas', async () => {
    const user = userEvent.setup();
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');
    await user.click(screen.getByRole('button', { name: 'Legenda' }));
    expect(screen.getByRole('dialog', { name: 'Legenda do ABS' })).toBeInTheDocument();
    expect(screen.getByText('Presença')).toBeInTheDocument();
    expect(screen.getByText('Falta justificada')).toBeInTheDocument();
  });
});
