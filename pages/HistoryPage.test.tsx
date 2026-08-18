import { act, render, screen, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryPage } from './HistoryPage';

const mocks = vi.hoisted(() => ({
  getHistory: vi.fn(),
}));

vi.mock('../services/mockDb', () => ({ db: mocks }));

const flush = async () => {
  await act(async () => undefined);
  await act(async () => undefined);
};

// Ordem deliberadamente não-cronológica: a página não deve reordenar, apenas
// exibir exatamente o que o banco devolveu (a ordenação já acontece em
// services/mockDb.ts).
const logs = [
  { id: '3', action: 'Exclusão', target: 'Zeta', user: 'Ana', date: '17/08/2026 09:00:00', type: 'delete' as const, details: 'removido' },
  { id: '1', action: 'Criação', target: 'Alpha', user: 'Bia', date: '17/08/2026 08:00:00', type: 'create' as const, details: 'criado' },
  { id: '2', action: 'Atualização', target: 'Beta', user: 'Caio', date: '17/08/2026 08:30:00', type: 'update' as const, details: undefined },
];

const linhasDoCorpo = () => screen.getAllByRole('row').slice(1);

describe('Histórico', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T12:00:00'));
    mocks.getHistory.mockReset().mockResolvedValue(logs);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra estado de carregamento enquanto busca o histórico', () => {
    mocks.getHistory.mockReturnValue(new Promise(() => undefined));
    render(<HistoryPage />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('preserva a ordem devolvida pelo banco, sem reordenar', async () => {
    render(<HistoryPage />);
    await flush();
    const alvos = linhasDoCorpo().map(row => within(row).getAllByRole('cell')[3].textContent);
    expect(alvos).toEqual(['Zeta', 'Alpha', 'Beta']);
  });

  it('define as colunas data/hora, usuário, ação, alvo e detalhes', async () => {
    render(<HistoryPage />);
    await flush();
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Data/hora', 'Usuário', 'Ação', 'Alvo', 'Detalhes']);
  });

  it('usa hífen quando o registro não tem detalhes', async () => {
    render(<HistoryPage />);
    await flush();
    const linha = screen.getByText('Beta').closest('tr')!;
    expect(within(linha).getByText('-')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há registros', async () => {
    mocks.getHistory.mockResolvedValue([]);
    render(<HistoryPage />);
    await flush();
    expect(screen.getByRole('region', { name: /nenhum registro no histórico/i })).toBeInTheDocument();
  });

  it('mostra a contagem real de registros no resumo', async () => {
    const { container } = render(<HistoryPage />);
    await flush();
    const resumo = container.querySelector('[aria-label="Resumo da lista"]');
    expect(resumo).toHaveTextContent('3');
  });

  it('mostra erro e permite tentar novamente', async () => {
    mocks.getHistory.mockRejectedValueOnce(new Error('falhou'));
    render(<HistoryPage />);
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    mocks.getHistory.mockResolvedValueOnce(logs);
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    await flush();
    expect(screen.getByText('Zeta')).toBeInTheDocument();
  });
});
