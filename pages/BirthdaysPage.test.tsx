import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BirthdaysPage } from './BirthdaysPage';

const mocks = vi.hoisted(() => ({
  getCollaborators: vi.fn(),
  getIlhas: vi.fn(),
}));

vi.mock('../services/mockDb', () => ({ db: mocks }));

const flush = async () => {
  await act(async () => undefined);
  await act(async () => undefined);
};

const colaboradores = [
  { matricula: '1', nome: 'Beatriz Alves', ilhaId: 'i1', dtNasc: '1990-08-20' },
  { matricula: '2', nome: 'Carlos Souza', ilhaId: 'i1', dtNasc: '1985-08-05' },
  { matricula: '3', nome: 'Diego Lima', ilhaId: 'i2', dtNasc: '1992-07-30' },
  { matricula: '4', nome: 'Eduarda Nunes', ilhaId: 'i2', dtNasc: '1988-12-25' },
];

const ilhas = [
  { id: 'i1', nome: 'Ilha 01 — SAC' },
  { id: 'i2', nome: 'Ilha 02 — Vendas' },
];

const linhasDoCorpo = () => screen.getAllByRole('row').slice(1);

describe('Aniversariantes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T12:00:00'));
    mocks.getCollaborators.mockReset().mockResolvedValue(colaboradores);
    mocks.getIlhas.mockReset().mockResolvedValue(ilhas);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filtra agosto e ordena por dia', async () => {
    render(<BirthdaysPage onBack={vi.fn()} />);
    await flush();
    const nomes = linhasDoCorpo().map(row => within(row).getAllByRole('cell')[1].textContent);
    expect(nomes).toEqual(['Carlos Souza', 'Beatriz Alves']);
    expect(screen.queryByText('Diego Lima')).not.toBeInTheDocument();
    expect(screen.queryByText('Eduarda Nunes')).not.toBeInTheDocument();
  });

  it('define as colunas dia, nome, ilha e data completa', async () => {
    render(<BirthdaysPage onBack={vi.fn()} />);
    await flush();
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Dia', 'Nome', 'Ilha', 'Data completa']);
  });

  it('permite trocar o mês e mostrar os aniversariantes correspondentes', async () => {
    render(<BirthdaysPage onBack={vi.fn()} />);
    await flush();
    fireEvent.change(screen.getByLabelText('Mês de referência'), { target: { value: '11' } });
    await flush();
    expect(screen.getByText('Eduarda Nunes')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Souza')).not.toBeInTheDocument();
  });

  it('mostra estado vazio quando não há aniversariantes no mês selecionado', async () => {
    render(<BirthdaysPage onBack={vi.fn()} />);
    await flush();
    fireEvent.change(screen.getByLabelText('Mês de referência'), { target: { value: '0' } });
    await flush();
    expect(screen.getByRole('region', { name: /nenhum aniversariante/i })).toBeInTheDocument();
  });

  it('mostra a contagem real de aniversariantes no resumo', async () => {
    const { container } = render(<BirthdaysPage onBack={vi.fn()} />);
    await flush();
    const resumo = container.querySelector('[aria-label="Resumo da lista"]');
    expect(resumo).toHaveTextContent('2');
  });

  it('aciona voltar ao clicar no botão', async () => {
    const onBack = vi.fn();
    render(<BirthdaysPage onBack={onBack} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('mostra estado de carregamento enquanto busca os aniversariantes', async () => {
    mocks.getCollaborators.mockReturnValue(new Promise(() => undefined));
    render(<BirthdaysPage onBack={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('mostra erro e permite tentar novamente', async () => {
    mocks.getCollaborators.mockRejectedValueOnce(new Error('falhou'));
    render(<BirthdaysPage onBack={vi.fn()} />);
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    mocks.getCollaborators.mockResolvedValueOnce(colaboradores);
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    await flush();
    expect(screen.getByText('Carlos Souza')).toBeInTheDocument();
  });
});
