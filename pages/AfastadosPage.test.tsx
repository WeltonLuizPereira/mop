import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus } from '../types';
import { AfastadosPage } from './AfastadosPage';

const mocks = vi.hoisted(() => ({
  getCollaborators: vi.fn(),
  getIlhas: vi.fn(),
  getSupervisors: vi.fn(),
}));

vi.mock('../services/mockDb', () => ({ db: mocks }));

const flush = async () => {
  await act(async () => undefined);
  await act(async () => undefined);
};

const colaboradores = [
  { matricula: '1', nome: 'Fábio Nogueira', status: CollaboratorStatus.AFASTADO, dataAfastamento: '2026-08-01', ilhaId: 'i1', supervisorId: 's1' },
  { matricula: '2', nome: 'Gisele Prado', status: CollaboratorStatus.AFASTADO, dataAfastamento: '2026-07-15', ilhaId: 'i2', supervisorId: 's2' },
  { matricula: '3', nome: 'Helena Vidal', status: CollaboratorStatus.LICENCA_MATERNIDADE, dataAfastamento: '2026-06-01', ilhaId: 'i1', supervisorId: 's1' },
  { matricula: '4', nome: 'Igor Farias', status: CollaboratorStatus.ATIVO },
];

const ilhas = [{ id: 'i1', nome: 'Ilha 01 — SAC' }, { id: 'i2', nome: 'Ilha 02 — Vendas' }];
const supervisors = [{ id: 's1', nome: 'Juliana Prado' }, { id: 's2', nome: 'Marcos Lima' }];

describe('Afastados e licenças', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T12:00:00'));
    mocks.getCollaborators.mockReset().mockResolvedValue(colaboradores);
    mocks.getIlhas.mockReset().mockResolvedValue(ilhas);
    mocks.getSupervisors.mockReset().mockResolvedValue(supervisors);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra contagem real por categoria no resumo', async () => {
    const { container } = render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    const resumo = container.querySelector('[aria-label="Resumo da lista"]');
    expect(resumo).toHaveTextContent('Afastamento médico/INSS');
    expect(resumo).toHaveTextContent('Licença maternidade');
    const valores = resumo!.querySelectorAll('dd');
    expect(Array.from(valores).map(v => v.textContent)).toEqual(['2', '1']);
  });

  it('lista somente afastados e licença maternidade', async () => {
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    expect(screen.queryByText('Igor Farias')).not.toBeInTheDocument();
    expect(screen.getByText('Fábio Nogueira')).toBeInTheDocument();
    expect(screen.getByText('Helena Vidal')).toBeInTheDocument();
  });

  it('define as colunas nome, status, data início, ilha e supervisor', async () => {
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Nome', 'Status', 'Data início', 'Ilha', 'Supervisor']);
  });

  it('preenche ilha e supervisor a partir dos cadastros relacionados', async () => {
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    const linha = screen.getByText('Fábio Nogueira').closest('tr')!;
    expect(within(linha).getByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(within(linha).getByText('Juliana Prado')).toBeInTheDocument();
  });

  it('abre detalhes por clique, Enter e Espaço', async () => {
    const onViewDetails = vi.fn();
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={onViewDetails} />);
    await flush();
    const linha = screen.getByText('Fábio Nogueira').closest('tr')!;
    fireEvent.click(linha);
    fireEvent.keyDown(linha, { key: 'Enter' });
    fireEvent.keyDown(linha, { key: ' ' });
    expect(onViewDetails).toHaveBeenCalledTimes(3);
  });

  it('mostra estado vazio quando não há afastados', async () => {
    mocks.getCollaborators.mockResolvedValue([colaboradores[3]]);
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    expect(screen.getByRole('region', { name: /nenhum colaborador afastado/i })).toBeInTheDocument();
  });

  it('mostra estado de carregamento enquanto busca os dados', async () => {
    mocks.getCollaborators.mockReturnValue(new Promise(() => undefined));
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('mostra erro e permite tentar novamente', async () => {
    mocks.getCollaborators.mockRejectedValueOnce(new Error('falhou'));
    render(<AfastadosPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    mocks.getCollaborators.mockResolvedValueOnce(colaboradores);
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    await flush();
    expect(screen.getByText('Fábio Nogueira')).toBeInTheDocument();
  });
});
