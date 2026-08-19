import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { SafraPage } from './SafraPage';

const pessoa = (
  matricula: string, nome: string, entrada: string,
  status: CollaboratorStatus = CollaboratorStatus.ATIVO, saida = '',
) => ({
  matricula, nome, dtEntradaProduto: entrada, status, dataFim: saida,
  clientId: 'c1', operationId: 'o1', ilhaId: 'i1', supervisorId: 's1', coordinatorId: 'k1',
});

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      // janeiro: duas turmas, uma saída com data e uma sem
      pessoa('1', 'Ana Lima', '2026-01-05'),
      pessoa('2', 'Bruno Sá', '2026-01-05', CollaboratorStatus.DESLIGADO, '2026-03-06'),
      pessoa('3', 'Carla Reis', '2026-01-19'),
      pessoa('4', 'Davi Melo', '2026-01-19', CollaboratorStatus.DESLIGADO),
      // março: ninguém saiu
      pessoa('5', 'Elis Prado', '2026-03-02'),
      // ano anterior, não entra
      pessoa('6', 'Fábio Cruz', '2025-06-01'),
    ])),
    getClients: vi.fn(async () => ([{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }])),
    getOperations: vi.fn(async () => ([{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }])),
    getIlhas: vi.fn(async () => ([{ id: 'i1', nome: 'Ilha 01', clientId: 'c1', operationId: 'o1', status: EntityStatus.ACTIVE }])),
    getSupervisors: vi.fn(async () => ([{ id: 's1', nome: 'Juliana Prado', coordinatorIds: [], status: EntityStatus.ACTIVE }])),
  },
}));

beforeAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 7, 20));
});
afterAll(() => vi.useRealTimers());

const abrirJaneiro = async (user: ReturnType<typeof userEvent.setup>) => {
  const linha = (await screen.findByText('Janeiro')).closest('tr')!;
  await user.click(within(linha).getByRole('button', { name: 'Ver turmas' }));
};

describe('Safra', () => {
  it('lista uma safra por mês de entrada do ano, sem os meses vazios', async () => {
    render(<SafraPage />);
    expect(await screen.findByText('Janeiro')).toBeInTheDocument();
    expect(screen.getByText('Março')).toBeInTheDocument();
    expect(screen.queryByText('Fevereiro')).not.toBeInTheDocument();
  });

  it('não traz quem entrou em outro ano', async () => {
    render(<SafraPage />);
    await screen.findByText('Janeiro');
    // 4 de janeiro + 1 de março; Fábio entrou em 2025 e fica de fora
    expect(screen.getByText('5', { selector: '.t-data' })).toBeInTheDocument();
  });

  it('conta as turmas do mês pelas datas distintas de entrada', async () => {
    render(<SafraPage />);
    const linha = (await screen.findByText('Janeiro')).closest('tr')!;
    const celulas = [...linha.querySelectorAll('td')].map(c => c.textContent?.trim());
    // entraram = 4 (2 turmas de 2), turmas = 2
    expect(celulas[1]).toBe('4');
    expect(celulas[2]).toBe('2');
  });

  it('mostra sobre quantas saídas a média foi feita', async () => {
    render(<SafraPage />);
    const linha = (await screen.findByText('Janeiro')).closest('tr')!;
    // só a saída de Bruno tem data: 60 dias, base 1
    expect(within(linha).getByText('60 dias')).toBeInTheDocument();
    expect(within(linha).getByText('em 1 saída')).toBeInTheDocument();
  });

  it('não inventa média quando ninguém saiu', async () => {
    render(<SafraPage />);
    const linha = (await screen.findByText('Março')).closest('tr')!;
    expect(within(linha).getByText('— ninguém saiu')).toBeInTheDocument();
  });

  it('avisa quando há saída sem data, em vez de omitir', async () => {
    render(<SafraPage />);
    await screen.findByText('Janeiro');
    expect(screen.getByText(/sem data de saída/)).toBeInTheDocument();
  });

  it('marca a safra que ainda não teve tempo de perder ninguém', async () => {
    render(<SafraPage />);
    await screen.findByText('Janeiro');
    const janeiro = screen.getByText('Janeiro').closest('tr')!;
    const marco = screen.getByText('Março').closest('tr')!;
    // janeiro tem 7 meses; março tem 5 — nenhuma das duas é jovem
    expect(within(janeiro).queryByText('Safra jovem')).not.toBeInTheDocument();
    expect(within(marco).queryByText('Safra jovem')).not.toBeInTheDocument();
  });

  it('abre a safra e mostra as turmas com as pessoas de cada uma', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    await abrirJaneiro(user);

    expect(screen.getByText('da safra continua na casa')).toBeInTheDocument();
    expect(screen.getByText('Turma de 05/01/2026')).toBeInTheDocument();
    expect(screen.getByText('Turma de 19/01/2026')).toBeInTheDocument();
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('Davi Melo')).toBeInTheDocument();
  });

  it('mostra a data de entrada e a de saída de cada pessoa', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    await abrirJaneiro(user);

    const bruno = screen.getByText('Bruno Sá').closest('tr')!;
    expect(within(bruno).getByText('05/01/2026')).toBeInTheDocument();
    expect(within(bruno).getByText('06/03/2026')).toBeInTheDocument();
    expect(within(bruno).getByText('60 dias')).toBeInTheDocument();

    // quem ficou não tem saída
    const ana = screen.getByText('Ana Lima').closest('tr')!;
    expect(within(ana).getByText('05/01/2026')).toBeInTheDocument();
    expect(within(ana).getByText('—')).toBeInTheDocument();

    // Davi saiu, mas ninguém datou — dizer isso vale mais que um traço mudo
    const davi = screen.getByText('Davi Melo').closest('tr')!;
    expect(within(davi).getByText('sem data')).toBeInTheDocument();
  });

  it('as colunas da turma são nome, status, entrada e saída', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    await abrirJaneiro(user);

    const cabecalhos = screen.getAllByRole('columnheader').map(c => c.textContent?.trim());
    expect(cabecalhos.slice(0, 4)).toEqual(['Nome', 'Status', 'Entrada', 'Saída']);
  });

  it('o recorte por turma só aparece quando há mais de uma', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    await abrirJaneiro(user);

    const grupo = screen.getByRole('group', { name: 'Recortar os gráficos por turma' });
    expect(within(grupo).getByRole('button', { name: /Todas as turmas/ })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(grupo).getByRole('button', { name: /Turma de 19\/01/ }));
    expect(within(grupo).getByRole('button', { name: /Turma de 19\/01/ })).toHaveAttribute('aria-pressed', 'true');

    // os cartões continuam mostrando as duas turmas: o recorte é dos gráficos
    expect(screen.getByText('Turma de 05/01/2026')).toBeInTheDocument();
    expect(screen.getByText('Turma de 19/01/2026')).toBeInTheDocument();
  });

  it('a safra de uma turma só não oferece recorte', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    const linha = (await screen.findByText('Março')).closest('tr')!;
    await user.click(within(linha).getByRole('button', { name: 'Ver turmas' }));

    expect(screen.queryByRole('group', { name: 'Recortar os gráficos por turma' })).not.toBeInTheDocument();
  });

  it('volta para a lista de safras', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    await abrirJaneiro(user);

    await user.click(screen.getByRole('button', { name: /Todas as safras/ }));
    expect(screen.getByText('Março')).toBeInTheDocument();
    expect(screen.queryByText('da safra continua na casa')).not.toBeInTheDocument();
  });

  it('avisa quando o recorte não tem ninguém, em vez de mostrar tabela vazia', async () => {
    const user = userEvent.setup();
    render(<SafraPage />);
    await screen.findByText('Janeiro');

    await user.selectOptions(screen.getByLabelText('Ordenar as safras por ano'), '2024');
    expect(screen.getByText(/Ninguém entrou em 2024/)).toBeInTheDocument();
  });
});
