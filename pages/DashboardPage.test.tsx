import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus, UserRole } from '../types';
import { DashboardPage } from './DashboardPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', ilhaId: 'i1', status: CollaboratorStatus.ATIVO },
      { matricula: '2', ilhaId: 'i1', status: CollaboratorStatus.FERIAS },
      { matricula: '3', ilhaId: 'i2', status: CollaboratorStatus.ATIVO },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i2', nome: 'Ilha 07 — Cobrança', clientId: 'c2', operationId: 'o2',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i3', nome: 'Ilha 02 — Desativada', clientId: 'c1', operationId: 'o3',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.INACTIVE },
    ])),
    getClients: vi.fn(async () => ([
      { id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE },
      { id: 'c2', nome: 'Enel', status: EntityStatus.ACTIVE },
    ])),
    getOperations: vi.fn(async () => ([
      { id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE },
      { id: 'o2', nome: 'Residencial', clientId: 'c2', status: EntityStatus.ACTIVE },
      { id: 'o3', nome: 'Fibra', clientId: 'c1', status: EntityStatus.ACTIVE },
    ])),
    getProvimento: vi.fn(async () => ([
      { id: 'p-i1', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 2 },
      { id: 'p-i2', ilhaId: 'i2', referencia: '2026-08-01', paContratada: 1 },
    ])),
  },
}));

const usuario = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com',
  role: UserRole.ADMIN, status: EntityStatus.ACTIVE };

describe('Visão geral', () => {
  it('mostra cada ilha como um tile com o percentual em operação', async () => {
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    expect(await screen.findByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('deixa a ilha inativa fora do mapa', async () => {
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');
    expect(screen.queryByText('Ilha 02 — Desativada')).not.toBeInTheDocument();
  });

  it('recorta o mapa pela operação escolhida no chip', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    await user.selectOptions(screen.getByLabelText('Filtrar ilhas por operação'), 'o2');

    expect(screen.getByText('Ilha 07 — Cobrança')).toBeInTheDocument();
    expect(screen.queryByText('Ilha 01 — SAC')).not.toBeInTheDocument();
  });

  it('só oferece as operações do cliente escolhido e zera a anterior', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    const operacao = screen.getByLabelText('Filtrar ilhas por operação') as HTMLSelectElement;
    await user.selectOptions(operacao, 'o2');
    await user.selectOptions(screen.getByLabelText('Filtrar ilhas por cliente'), 'c1');

    // a operação do cliente antigo não pode continuar valendo
    expect(operacao.value).toBe('');
    const oferecidas = [...operacao.options].map(o => o.textContent);
    expect(oferecidas).toEqual(['todas', 'Móvel', 'Fibra']);
  });

  it('recorta o mapa pelo cliente escolhido no chip', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    await user.selectOptions(screen.getByLabelText('Filtrar ilhas por cliente'), 'c2');

    expect(screen.getByText('Ilha 07 — Cobrança')).toBeInTheDocument();
    expect(screen.queryByText('Ilha 01 — SAC')).not.toBeInTheDocument();
  });

  it('abre em ordem alfabética e troca de ordem pelo chip', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    const nomes = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    const chip = screen.getByLabelText('Ordenar as ilhas') as HTMLSelectElement;

    // a tela abre em A → Z; a ordem alfabética em si está provada em ilhaStats.
    // o consolidado abre a lista em qualquer ordenação — ele não entra no sort
    expect(chip.value).toBe('nome');
    expect(nomes()).toEqual(['GERAL QUALITY', 'Ilha 01 — SAC', 'Ilha 07 — Cobrança']);

    await user.selectOptions(chip, 'desc');
    expect(nomes()).toEqual(['GERAL QUALITY', 'Ilha 07 — Cobrança', 'Ilha 01 — SAC']);

    await user.selectOptions(chip, 'nome');
    expect(nomes()).toEqual(['GERAL QUALITY', 'Ilha 01 — SAC', 'Ilha 07 — Cobrança']);
  });

  it('o tile leva para a lista recortada pela ilha clicada', async () => {
    const user = userEvent.setup();
    const abrir = vi.fn();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={abrir} />);
    await screen.findByText('Ilha 07 — Cobrança');

    await user.click(screen.getByRole('button', { name: /Ilha 07 — Cobrança/ }));

    // a ilha clicada, e não um genérico "abrir colaboradores"
    expect(abrir).toHaveBeenCalledWith('i2');
  });

  it('o tile responde ao teclado, não só ao clique', async () => {
    const user = userEvent.setup();
    const abrir = vi.fn();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={abrir} />);
    await screen.findByText('Ilha 01 — SAC');

    // o foco real precisa entrar no act: focar o tile expande ele, e um
    // setState solto fora do act polui a saída do teste com aviso do React
    const card = screen.getByRole('button', { name: /Ilha 01 — SAC/ });
    await act(async () => { card.focus(); });
    await user.keyboard('{Enter}');

    expect(abrir).toHaveBeenCalledWith('i1');
  });

  it('abre a faixa pela conta do provimento e fecha com o resto do quadro', async () => {
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    // 2 ativos sobre 3 PA contratada nas duas ilhas do mock; a ordem é o que
    // este teste guarda — contratado, de pé, o resultado, depois os ausentes
    expect(screen.getByRole('group', { name: 'Resumo do quadro' }).textContent)
      .toBe('3PA contratada2ativos67%provimento geral1em férias0em aviso prévio0afastados');

    // o mesmo número na faixa e no card: são a mesma conta, feita uma vez só
    expect(screen.getAllByText('67%')).toHaveLength(2);
  });

  it('recalcula a faixa e o consolidado quando o filtro recorta o mapa', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    await user.selectOptions(screen.getByLabelText('Filtrar ilhas por cliente'), 'c2');

    // sobrou só a Ilha 07: 1 ativo sobre 1 PA contratada
    expect(screen.queryByText('Ilha 01 — SAC')).not.toBeInTheDocument();
    expect(screen.getByText('1 ilha em operação')).toBeInTheDocument();
    expect(screen.queryByText('67%')).not.toBeInTheDocument();
    // faixa, consolidado e o tile da própria ilha: com uma ilha só no
    // recorte, os três dizem necessariamente o mesmo número
    expect(screen.getAllByText('100%')).toHaveLength(3);
  });

  it('recorta também a contagem por status da faixa de totais', async () => {
    const user = userEvent.setup();
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');

    // sem filtro: 2 ativos e 1 em férias entre as duas ilhas
    const faixa = () => within(screen.getByRole('group', { name: 'Resumo do quadro' }));
    const naFaixa = (rotulo: string) =>
      faixa().getByText(rotulo).parentElement!.textContent!.replace(rotulo, '');
    expect(naFaixa('ativos')).toBe('2');
    expect(naFaixa('em férias')).toBe('1');

    // a Ilha 07 não tem ninguém de férias — a faixa tem que acompanhar
    await user.selectOptions(screen.getByLabelText('Filtrar ilhas por cliente'), 'c2');
    expect(naFaixa('ativos')).toBe('1');
    expect(naFaixa('em férias')).toBe('0');
  });

  it('não afirma tendência que não calculou', async () => {
    render(<DashboardPage currentUser={usuario} onAbrirIlha={vi.fn()} />);
    await screen.findByText('Ilha 01 — SAC');
    expect(screen.queryByText(/vs mês anterior/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+4%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/turnover mensal/i)).not.toBeInTheDocument();
  });
});
