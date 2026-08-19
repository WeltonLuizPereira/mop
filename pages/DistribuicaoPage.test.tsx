import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { DistribuicaoPage } from './DistribuicaoPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', operationId: 'o1', ilhaId: 'i1', supervisorId: 's1', status: CollaboratorStatus.ATIVO },
      { matricula: '2', operationId: 'o1', ilhaId: 'i1', supervisorId: 's1', status: CollaboratorStatus.FERIAS },
      { matricula: '3', operationId: 'o1', ilhaId: 'i2', supervisorId: 's2', status: CollaboratorStatus.ATIVO },
      { matricula: '4', operationId: 'o2', ilhaId: 'i2', supervisorId: 's2', status: CollaboratorStatus.ATIVO },
      { matricula: '5', operationId: 'o1', ilhaId: 'i1', supervisorId: 's1', status: CollaboratorStatus.DESLIGADO },
    ])),
    getOperations: vi.fn(async () => ([
      { id: 'o1', nome: 'Cobrança', clientId: 'c1', status: EntityStatus.ACTIVE },
      { id: 'o2', nome: 'Suporte', clientId: 'c1', status: EntityStatus.ACTIVE },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i2', nome: 'Ilha 02', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
    ])),
    getSupervisors: vi.fn(async () => ([
      { id: 's1', nome: 'João Ferreira', coordinatorIds: [], status: EntityStatus.ACTIVE },
      { id: 's2', nome: 'Maria Souza', coordinatorIds: [], status: EntityStatus.ACTIVE },
    ])),
  },
}));

const cartao = (titulo: string) =>
  screen.getByRole('heading', { name: titulo }).closest('section') as HTMLElement;

describe('Dashboard — distribuição', () => {
  it('anuncia o quadro que serve de base aos percentuais', async () => {
    render(<DistribuicaoPage onAbrirLista={vi.fn()} />);
    // 5 cadastrados, 1 desligado
    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('pessoas no quadro')).toBeInTheDocument();
  });

  it('mostra os três recortes pedidos', async () => {
    render(<DistribuicaoPage onAbrirLista={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Por operação' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por ilha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por supervisor' })).toBeInTheDocument();
  });

  it('dá quantitativo e percentual de cada item', async () => {
    render(<DistribuicaoPage onAbrirLista={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Por operação' });

    const operacao = within(cartao('Por operação'));
    // Cobrança tem 3 dos 4 do quadro — o desligado não conta
    expect(operacao.getByText('Cobrança')).toBeInTheDocument();
    expect(operacao.getByText('3')).toBeInTheDocument();
    expect(operacao.getByText('75,0%')).toBeInTheDocument();
    expect(operacao.getByText('25,0%')).toBeInTheDocument();
  });

  it('ordena do maior para o menor', async () => {
    render(<DistribuicaoPage onAbrirLista={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Por operação' });

    const itens = within(cartao('Por operação')).getAllByRole('listitem');
    expect(itens.map(li => li.textContent?.startsWith('Cobrança'))).toEqual([true, false]);
  });

  it('leva para a lista recortada pelo item clicado', async () => {
    const user = userEvent.setup();
    const abrir = vi.fn();
    render(<DistribuicaoPage onAbrirLista={abrir} />);
    await screen.findByRole('heading', { name: 'Por supervisor' });

    await user.click(screen.getByRole('button', { name: 'Ver colaboradores de Maria Souza' }));

    expect(abrir).toHaveBeenCalledWith('supervisor', 's2');
  });

  it('cada cartão recorta pelo seu próprio cadastro', async () => {
    const user = userEvent.setup();
    const abrir = vi.fn();
    render(<DistribuicaoPage onAbrirLista={abrir} />);
    await screen.findByRole('heading', { name: 'Por ilha' });

    await user.click(screen.getByRole('button', { name: 'Ver colaboradores de Ilha 02' }));

    expect(abrir).toHaveBeenCalledWith('ilha', 'i2');
  });
});
