import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { OrganogramPage } from './OrganogramPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCoordinators: vi.fn(async () => ([
      { id: 'c1', nome: 'Ana Souza', status: EntityStatus.ACTIVE },
      { id: 'c2', nome: 'Bruno Lima', status: EntityStatus.ACTIVE },
    ])),
    getSupervisors: vi.fn(async () => ([
      { id: 's1', nome: 'Carla Dias', coordinatorIds: ['c1'], status: EntityStatus.ACTIVE },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'cl1', operationId: 'o1',
        coordinatorIds: ['c1'], supervisorIds: ['s1'], status: EntityStatus.ACTIVE },
    ])),
    getCollaborators: vi.fn(async () => ([
      { matricula: '1001', nome: 'Daniela Rocha', ilhaId: 'i1', status: CollaboratorStatus.ATIVO },
    ])),
  },
}));

/**
 * jsdom não implementa `PointerEvent` nem `Element.setPointerCapture` (v26).
 * `@testing-library/react`'s `fireEvent.pointerDown` cai de volta em `Event`
 * simples e descarta `clientX`/`pointerType`/`pointerId` porque o construtor
 * de `Event` só reconhece `bubbles`/`cancelable`/`composed`. Construímos o
 * evento manualmente e atribuímos as propriedades extras como campos comuns
 * do objeto — é assim que o próprio código de produção vai lê-las.
 */
function dispararPointer(tipo: string, alvo: Element, init: Record<string, unknown>) {
  const evento = new Event(tipo, { bubbles: true, cancelable: true });
  Object.assign(evento, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0, ...init });
  fireEvent(alvo, evento);
}

const montar = () => render(<OrganogramPage />);

describe('Organograma', () => {
  it('encadeia gerente → coordenador → supervisor → ilha → colaborador', async () => {
    montar();
    const gerenteLi = (await screen.findByText('Tatiane Tappi')).closest('li')!;
    const coordLi = within(gerenteLi).getByText('Ana Souza').closest('li')!;
    const supLi = within(coordLi).getByText('Carla Dias').closest('li')!;
    const ilhaLi = within(supLi).getByText('Ilha 01 — SAC').closest('li')!;
    expect(within(ilhaLi).getByText('Daniela Rocha')).toBeInTheDocument();
  });

  it('nomeia os filtros de coordenador e supervisor', async () => {
    montar();
    await screen.findByText('Tatiane Tappi');
    expect(screen.getByRole('combobox', { name: 'Coordenador' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Supervisor' })).toBeInTheDocument();
  });

  it('preserva o filtro por coordenador', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Tatiane Tappi');
    const arvore = screen.getByRole('region', { name: 'Organograma operacional' });
    expect(within(arvore).getByText('Ana Souza')).toBeInTheDocument();
    expect(within(arvore).getByText('Bruno Lima')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Coordenador' }), 'c2');

    expect(within(arvore).queryByText('Ana Souza')).not.toBeInTheDocument();
    expect(within(arvore).getByText('Bruno Lima')).toBeInTheDocument();
  });

  it('expõe exatamente cinco controles nomeados de navegação', async () => {
    montar();
    await screen.findByText('Tatiane Tappi');
    expect(screen.getByRole('button', { name: 'Mover' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selecionar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aumentar zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diminuir zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redefinir posição e zoom' })).toBeInTheDocument();
  });

  it('marca aria-pressed na ferramenta ativa e alterna ao clicar', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Tatiane Tappi');
    const mover = screen.getByRole('button', { name: 'Mover' });
    const selecionar = screen.getByRole('button', { name: 'Selecionar' });

    expect(mover).toHaveAttribute('aria-pressed', 'true');
    expect(selecionar).toHaveAttribute('aria-pressed', 'false');

    await user.click(selecionar);

    expect(mover).toHaveAttribute('aria-pressed', 'false');
    expect(selecionar).toHaveAttribute('aria-pressed', 'true');
  });

  it('expõe a região "Organograma operacional" navegável', async () => {
    montar();
    await screen.findByText('Tatiane Tappi');
    expect(screen.getByRole('region', { name: 'Organograma operacional' })).toBeInTheDocument();
  });

  it('arrasta, aumenta o zoom e reseta pelo teclado', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Tatiane Tappi');

    const canvas = screen.getByRole('region', { name: 'Organograma operacional' });
    canvas.focus();
    await user.keyboard('{ArrowRight}{ArrowDown}+');

    expect(canvas.firstElementChild).not.toHaveStyle('transform: translate(0px, 0px) scale(1)');

    await user.keyboard('{Home}');
    expect(canvas.firstElementChild).toHaveStyle('transform: translate(0px, 0px) scale(1)');
  });

  it('diminui o zoom pelo teclado com a tecla -', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Tatiane Tappi');

    const canvas = screen.getByRole('region', { name: 'Organograma operacional' });
    canvas.focus();
    await user.keyboard('-');

    expect(canvas.firstElementChild).toHaveStyle('transform: translate(0px, 0px) scale(0.9)');
  });

  it('arrasta com pointerdown/pointermove do tipo touch', async () => {
    montar();
    await screen.findByText('Tatiane Tappi');
    const canvas = screen.getByRole('region', { name: 'Organograma operacional' });
    const conteudo = canvas.firstElementChild as HTMLElement;

    dispararPointer('pointerdown', canvas, { pointerId: 7, clientX: 100, clientY: 100, pointerType: 'touch' });
    dispararPointer('pointermove', canvas, { pointerId: 7, clientX: 140, clientY: 130, pointerType: 'touch' });

    expect(conteudo).toHaveStyle('transform: translate(40px, 30px) scale(1)');
  });
});
