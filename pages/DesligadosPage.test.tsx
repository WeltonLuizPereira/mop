import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../types';
import { DataProvider } from '../contexts/DataContext';
import { createAppData } from '../data/appData';
import { db } from '../services/mockDb';
import { DesligadosPage } from './DesligadosPage';

vi.mock('../services/mockDb', () => ({ db: {
  getCollaborators: vi.fn(async () => [{ matricula: '1', nome: 'Ana Desligada', status: CollaboratorStatus.DESLIGADO, dataFim: '2026-09-01' }]),
  getClients: vi.fn(async () => []), getOperations: vi.fn(async () => []), getIlhas: vi.fn(async () => []),
  getSupervisors: vi.fn(async () => []), getCoordinators: vi.fn(async () => []),
} }));

describe('Desligados', () => {
  it('mostra o colaborador carregado pelo recurso compartilhado', async () => {
    render(<DataProvider store={createAppData(db as any)}><DesligadosPage onBack={vi.fn()} onViewDetails={vi.fn()} /></DataProvider>);
    expect(await screen.findByText('Ana Desligada')).toBeInTheDocument();
  });
});
