import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus } from '../types';
import { AvisoPrevioPage } from './AvisoPrevioPage';

const mocks = vi.hoisted(() => ({
  getCollaborators: vi.fn(),
}));

vi.mock('../services/mockDb', () => ({ db: mocks }));

const flush = async () => {
  await act(async () => undefined);
  await act(async () => undefined);
};

const colaboradores = [
  { matricula: '1', nome: 'Amanda Reis', status: CollaboratorStatus.AVISO_PREVIO, dataFim: '2026-08-25' }, // 8 dias
  { matricula: '2', nome: 'Bruno Castro', status: CollaboratorStatus.AVISO_PREVIO, dataFim: '2026-08-18' }, // 1 dia
  { matricula: '3', nome: 'Camila Dias', status: CollaboratorStatus.AVISO_PREVIO, dataFim: '2026-08-20' }, // 3 dias
  { matricula: '4', nome: 'Douglas Melo', status: CollaboratorStatus.ATIVO },
];

const linhasDoCorpo = () => screen.getAllByRole('row').slice(1);

describe('Aviso prévio', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T12:00:00'));
    mocks.getCollaborators.mockReset().mockResolvedValue(colaboradores);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ordena por menor prazo restante', async () => {
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    const nomes = linhasDoCorpo().map(row => within(row).getAllByRole('cell')[0].textContent);
    expect(nomes).toEqual(['Bruno Castro', 'Camila Dias', 'Amanda Reis']);
  });

  it('lista somente quem está em aviso prévio', async () => {
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    expect(screen.queryByText('Douglas Melo')).not.toBeInTheDocument();
  });

  it('define as colunas nome, data final, dias restantes e status', async () => {
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos).toEqual(['Nome', 'Data final', 'Dias restantes', 'Status']);
  });

  it('abre detalhes por clique, Enter e Espaço', async () => {
    const onViewDetails = vi.fn();
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={onViewDetails} />);
    await flush();
    const linha = screen.getByText('Bruno Castro').closest('tr')!;
    fireEvent.click(linha);
    fireEvent.keyDown(linha, { key: 'Enter' });
    fireEvent.keyDown(linha, { key: ' ' });
    expect(onViewDetails).toHaveBeenCalledTimes(3);
  });

  it('mostra a contagem real no resumo', async () => {
    const { container } = render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    const resumo = container.querySelector('[aria-label="Resumo da lista"]');
    expect(resumo).toHaveTextContent('3');
  });

  it('mostra estado vazio quando ninguém está em aviso prévio', async () => {
    mocks.getCollaborators.mockResolvedValue([colaboradores[3]]);
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    expect(screen.getByRole('region', { name: /nenhum colaborador em aviso prévio/i })).toBeInTheDocument();
  });

  it('mostra estado de carregamento enquanto busca os dados', async () => {
    mocks.getCollaborators.mockReturnValue(new Promise(() => undefined));
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('mostra erro e permite tentar novamente', async () => {
    mocks.getCollaborators.mockRejectedValueOnce(new Error('falhou'));
    render(<AvisoPrevioPage onBack={vi.fn()} onViewDetails={vi.fn()} />);
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    mocks.getCollaborators.mockResolvedValueOnce(colaboradores);
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    await flush();
    expect(screen.getByText('Bruno Castro')).toBeInTheDocument();
  });
});
