import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus } from '../types';
import { DataProvider } from '../contexts/DataContext';
import { createAppData } from '../data/appData';
import { db } from '../services/mockDb';
import { VacationManagementPage } from './VacationManagementPage';

vi.mock('../services/mockDb', () => ({ db: {
  getCollaborators: vi.fn(async () => [{ matricula: '1', nome: 'Ana em FÃ©rias', status: CollaboratorStatus.FERIAS, feriasInicio: '2099-09-01', feriasFim: '2099-09-10' }]),
  getIlhas: vi.fn(async () => []), getClients: vi.fn(async () => []), getOperations: vi.fn(async () => []),
  getSupervisors: vi.fn(async () => []), getCoordinators: vi.fn(async () => []), getVacationHistory: vi.fn(async () => []),
} }));

describe('GestÃ£o de fÃ©rias', () => {
  it('combina recursos compartilhados com a leitura especializada do histÃ³rico', async () => {
    render(<DataProvider store={createAppData(db as any)}><VacationManagementPage currentUser={{}} onBack={vi.fn()} onViewDetails={vi.fn()} /></DataProvider>);
    expect(await screen.findByText('Ana em FÃ©rias')).toBeInTheDocument();
    expect(db.getCollaborators).toHaveBeenCalledTimes(1);
    expect(db.getIlhas).toHaveBeenCalledTimes(1);
    expect(db.getVacationHistory).toHaveBeenCalledTimes(1);
  });
});
