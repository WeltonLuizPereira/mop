import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbsPage } from './AbsPage';
import { getAbsImportStatus, getAbsMonth } from '../services/abs';

const resources = vi.hoisted(() => ({
  clients: [{ id: 'c1', nome: 'Cliente 1', status: 'ATIVO' }, { id: 'c2', nome: 'Cliente 2', status: 'ATIVO' }],
  operations: [
    { id: 'o1', nome: 'Operação 1', clientId: 'c1', status: 'ATIVO' },
    { id: 'o2', nome: 'Operação 2', clientId: 'c1', status: 'ATIVO' },
    { id: 'o3', nome: 'Operação 3', clientId: 'c2', status: 'ATIVO' },
  ],
  coordinators: [
    { id: 'co1', nome: 'Coord 1', status: 'ATIVO' },
    { id: 'co2', nome: 'Coord 2', status: 'ATIVO' },
    { id: 'co3', nome: 'Coord 3', status: 'ATIVO' },
  ],
  supervisors: [
    { id: 's1', nome: 'Super 1', coordinatorIds: ['co1'], status: 'ATIVO' },
    { id: 's2', nome: 'Super 2', coordinatorIds: ['co2'], status: 'ATIVO' },
    { id: 's3', nome: 'Super inativo', coordinatorIds: ['co3'], status: 'INATIVO' },
  ],
  ilhas: [
    { id: 'i1', nome: 'Ilha 1', clientId: 'c1', operationId: 'o1', coordinatorIds: ['co1'], supervisorIds: ['s1'], status: 'ATIVO' },
    { id: 'i2', nome: 'Ilha 2', clientId: 'c1', operationId: 'o1', coordinatorIds: ['co2'], supervisorIds: ['s2'], status: 'ATIVO' },
    { id: 'i3', nome: 'Ilha 3', clientId: 'c1', operationId: 'o2', coordinatorIds: ['co1'], supervisorIds: ['s1'], status: 'ATIVO' },
    { id: 'i4', nome: 'Ilha 4', clientId: 'c2', operationId: 'o3', coordinatorIds: ['co3'], supervisorIds: ['s3'], status: 'ATIVO' },
  ],
  collaborators: [
    { matricula: '1', nome: 'Ana', clientId: 'c1', operationId: 'o1', coordinatorId: 'co1', supervisorId: 's1', ilhaId: 'i1', status: 'ATIVO' },
    { matricula: '2', nome: 'Bia', clientId: 'c1', operationId: 'o1', coordinatorId: 'co2', supervisorId: 's2', ilhaId: 'i2', status: 'ATIVO' },
    { matricula: '3', nome: 'Caio', clientId: 'c1', operationId: 'o2', coordinatorId: 'co1', supervisorId: 's1', ilhaId: 'i3', status: 'ATIVO' },
    { matricula: '4', nome: 'Dani', clientId: 'c2', operationId: 'o3', coordinatorId: 'co3', supervisorId: 's3', ilhaId: 'i4', status: 'ATIVO' },
  ],
}));

vi.mock('../contexts/DataContext', () => ({
  useResource: (name: keyof typeof resources) => ({ data: resources[name] ?? [] }),
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

  it('abre no mes anterior no dia 1 porque o dia vigente ainda nao vale em D-1', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-01T13:00:00Z'));
    try {
      render(<AbsPage currentUser={{} as never} />);
      await waitFor(() => expect(getAbsMonth).toHaveBeenCalledWith(expect.objectContaining({ month: '2026-09' })));
    } finally {
      vi.useRealTimers();
    }
  });

  it('abre no mes vigente quando a base ja possui o D-1 valido', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-02T13:00:00Z'));
    vi.mocked(getAbsImportStatus)
      .mockResolvedValueOnce({ status: 'COMPLETED', finishedAt: '2026-10-02', maxWorkDate: '2026-10-01', rowsRead: 10, unmatchedCount: 0 })
      .mockResolvedValueOnce({ status: 'COMPLETED', finishedAt: '2026-10-02', maxWorkDate: '2026-10-01', rowsRead: 10, unmatchedCount: 0 });
    try {
      render(<AbsPage currentUser={{} as never} />);
      await waitFor(() => expect(getAbsMonth).toHaveBeenCalledWith(expect.objectContaining({ month: '2026-10' })));
    } finally {
      vi.useRealTimers();
    }
  });

  it('mantém a navegação horizontal acessível no topo da grade', async () => {
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');

    const top = screen.getByTestId('abs-scroll-top');
    const grid = screen.getByTestId('abs-grid-scroll');
    fireEvent.scroll(top, { target: { scrollLeft: 480 } });
    expect(grid.scrollLeft).toBe(480);
  });

  it('mantem matricula e colaborador visiveis durante a rolagem horizontal', async () => {
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');

    expect(screen.getByTestId('abs-attendance-table')).toHaveStyle({ overflow: 'visible' });
    expect(screen.getByRole('columnheader', { name: 'Matrícula' })).toHaveClass('sticky', 'left-0');
    expect(screen.getByRole('columnheader', { name: 'Colaborador' })).toHaveClass('sticky', 'left-24');
    expect(screen.getByText('Ana Silva').closest('td')).toHaveClass('sticky', 'left-24', 'abs-sticky-edge');
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

  it('cruza todos os filtros pela base MOP e remove entidades inativas', async () => {
    const user = userEvent.setup();
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Ana Silva');
    await user.click(screen.getByRole('button', { name: 'Filtros' }));

    expect(screen.getByLabelText('Operação')).toBeEnabled();
    expect(screen.getByLabelText('Coordenador')).toBeEnabled();
    expect(screen.getByLabelText('Supervisor')).toBeEnabled();
    expect(screen.getByLabelText('Ilha')).toBeEnabled();

    expect(within(screen.getByLabelText('Supervisor')).queryByRole('option', { name: 'Super inativo' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Ilha'), 'i1');
    expect(within(screen.getByLabelText('Cliente')).queryByRole('option', { name: 'Cliente 2' })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Operação')).queryByRole('option', { name: 'Operação 2' })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Coordenador')).queryByRole('option', { name: 'Coord 2' })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Supervisor')).queryByRole('option', { name: 'Super 2' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Ilha'), '');
    await user.selectOptions(screen.getByLabelText('Supervisor'), 's1');
    expect(within(screen.getByLabelText('Ilha')).getByRole('option', { name: 'Ilha 1' })).toBeInTheDocument();
    expect(within(screen.getByLabelText('Ilha')).getByRole('option', { name: 'Ilha 3' })).toBeInTheDocument();
    expect(within(screen.getByLabelText('Ilha')).queryByRole('option', { name: 'Ilha 2' })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Cliente')).queryByRole('option', { name: 'Cliente 2' })).not.toBeInTheDocument();
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

  it('ordena as colunas de identificação e indicadores em três estados', async () => {
    vi.mocked(getAbsMonth).mockResolvedValueOnce([
      {
        matricula: '20', collaboratorName: 'Bruna', supervisorName: 'Carlos', ilhaName: 'Ilha 2', employmentStatus: 'ATIVO',
        justifiedAbsences: 2, unjustifiedAbsences: 0, totalAbsences: 2, presences: 6, absRate: 0.25, dailyStatuses: {},
      },
      {
        matricula: '3', collaboratorName: 'Ana', supervisorName: 'Bia', ilhaName: 'Ilha 1', employmentStatus: 'ATIVO',
        justifiedAbsences: 0, unjustifiedAbsences: 1, totalAbsences: 1, presences: 9, absRate: 0.1, dailyStatuses: {},
      },
    ]);
    const user = userEvent.setup();
    render(<AbsPage currentUser={{} as never} initialMonth="2026-09" />);
    await screen.findByText('Bruna');

    const dataRows = () => screen.getAllByRole('row').slice(1);
    expect(dataRows()[0]).toHaveAccessibleName('Ver ABS de Bruna');

    await user.click(screen.getByRole('button', { name: 'Ordenar por Matrícula' }));
    expect(dataRows()[0]).toHaveAccessibleName('Ver ABS de Ana');

    await user.click(screen.getByRole('button', { name: 'Ordenar por Matrícula, crescente' }));
    expect(dataRows()[0]).toHaveAccessibleName('Ver ABS de Bruna');

    await user.click(screen.getByRole('button', { name: 'Ordenar por Matrícula, decrescente' }));
    expect(dataRows()[0]).toHaveAccessibleName('Ver ABS de Bruna');
  });
});
