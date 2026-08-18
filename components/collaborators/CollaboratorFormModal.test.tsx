import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus, EntityStatus } from '../../types';
import { CollaboratorFormModal } from './CollaboratorFormModal';

vi.mock('../../services/mockDb', () => ({
  db: {
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01', clientId: 'c1', operationId: 'o1', coordinatorIds: ['co1'], supervisorIds: ['s1'], status: EntityStatus.ACTIVE },
    ])),
    getCoordinators: vi.fn(async () => ([{ id: 'co1', nome: 'Coord 1', status: EntityStatus.ACTIVE }])),
    getSupervisors: vi.fn(async () => ([{ id: 's1', nome: 'Super 1', status: EntityStatus.ACTIVE }])),
    getClients: vi.fn(async () => ([{ id: 'c1', nome: 'Cliente 1', status: EntityStatus.ACTIVE }])),
    getOperations: vi.fn(async () => ([{ id: 'o1', nome: 'Operação 1', clientId: 'c1', status: EntityStatus.ACTIVE }])),
  },
}));

const montar = (props: Record<string, any> = {}) =>
  render(<CollaboratorFormModal onClose={vi.fn()} onSave={vi.fn()} {...props} />);

describe('CollaboratorFormModal', () => {
  it('abre como "Novo colaborador" para um cadastro novo', () => {
    montar();
    expect(screen.getByRole('dialog', { name: 'Novo colaborador' })).toBeVisible();
  });

  it('abre como "Editar colaborador" quando recebe dados existentes e trava a matrícula', () => {
    montar({ initialData: { matricula: '1', nome: 'Ana', status: CollaboratorStatus.ATIVO } });
    expect(screen.getByRole('dialog', { name: 'Editar colaborador' })).toBeVisible();
    expect(screen.getByLabelText('Matrícula')).toBeDisabled();
  });

  it('carrega os cinco catálogos ao montar', async () => {
    const { db } = await import('../../services/mockDb');
    montar();
    await waitFor(() => {
      expect(db.getIlhas).toHaveBeenCalled();
      expect(db.getCoordinators).toHaveBeenCalled();
      expect(db.getSupervisors).toHaveBeenCalled();
      expect(db.getClients).toHaveBeenCalled();
      expect(db.getOperations).toHaveBeenCalled();
    });
  });

  it('preenche cliente, operação, coordenador e supervisor ao selecionar a ilha', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByRole('option', { name: 'Ilha 01' });
    await user.selectOptions(screen.getByLabelText('Ilha'), 'i1');
    expect(screen.getByLabelText('Cliente')).toHaveValue('c1');
    expect(screen.getByLabelText('Operação')).toHaveValue('o1');
    expect(screen.getByLabelText('Coordenador')).toHaveValue('co1');
    expect(screen.getByLabelText('Supervisor')).toHaveValue('s1');
  });

  it('mostra campos de férias apenas quando o status é férias', async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.queryByLabelText('Início férias')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Status'), CollaboratorStatus.FERIAS);
    expect(screen.getByLabelText('Início férias')).toBeInTheDocument();
    expect(screen.getByLabelText('Fim férias')).toBeInTheDocument();
  });

  it('mostra o campo de data de desligamento apenas quando o status é desligado', async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.queryByLabelText('Data de desligamento')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Status'), CollaboratorStatus.DESLIGADO);
    expect(screen.getByLabelText('Data de desligamento')).toBeInTheDocument();
  });

  it('agenda com a data informada mantendo os dados atuais do formulário', async () => {
    const user = userEvent.setup();
    const onSchedule = vi.fn();
    montar({ onSchedule });
    await user.click(screen.getByRole('button', { name: /agendar cadastro/i }));
    fireEvent.change(screen.getByLabelText('Data do agendamento'), { target: { value: '2026-09-01' } });
    await user.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));
    expect(onSchedule).toHaveBeenCalledTimes(1);
    expect(onSchedule.mock.calls[0][1]).toBe('2026-09-01');
  });

  it('salva chamando onSave diretamente com os dados atuais, sem validação bloqueante', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    montar({ onSave });
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ status: CollaboratorStatus.ATIVO });
  });
});
