import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus, UserRole } from '../types';
import { ExpiringContractsPage } from './ExpiringContractsPage';

vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => {
      const entrada = new Date();
      entrada.setDate(entrada.getDate() - 10);
      return [{
        matricula: '1',
        email: 'ana@example.com',
        nome: 'Ana Souza',
        ilhaId: 'i1',
        supervisorId: 's1',
        coordinatorId: 'co1',
        operationId: 'o1',
        clientId: 'c1',
        status: CollaboratorStatus.ATIVO,
        dtEntradaProduto: entrada.toISOString().slice(0, 10),
      }];
    }),
    getOperations: vi.fn(async () => [{
      id: 'o1',
      nome: 'Operacao',
      clientId: 'c1',
      status: EntityStatus.ACTIVE,
    }]),
  },
}));

describe('ExpiringContractsPage — Gantt', () => {
  it('preserva a data visivel ao exibir o tooltip por hover', async () => {
    const { container } = render(
      <ExpiringContractsPage
        onBack={vi.fn()}
        currentUser={{
          id: 'u1',
          matricula: '1',
          nome: 'Gestora',
          email: 'gestora@example.com',
          role: UserRole.MANAGER,
          status: EntityStatus.ACTIVE,
        }}
      />,
    );

    await screen.findByText('Ana Souza');
    await userEvent.click(screen.getByRole('button', { name: /Gantt/i }));

    const timeline = await waitFor(() => {
      const element = container.querySelector<HTMLDivElement>('.overflow-auto.custom-scrollbar');
      expect(element).not.toBeNull();
      return element!;
    });
    const ganttRow = container.querySelector<HTMLDivElement>('.hover\\:bg-canvas-soft\\/50');
    expect(ganttRow).not.toBeNull();

    timeline.scrollLeft = 720;
    fireEvent.scroll(timeline);
    fireEvent.mouseEnter(ganttRow!);

    expect(timeline.scrollLeft).toBe(720);
  });
});
