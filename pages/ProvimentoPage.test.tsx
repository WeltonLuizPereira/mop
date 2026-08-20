import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntityStatus, UserRole } from '../types';
import { ProvimentoPage } from './ProvimentoPage';
import { db } from '../services/mockDb';

vi.mock('../services/mockDb', () => ({
  db: {
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i2', nome: 'Ilha Nova', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
    ])),
    getClients: vi.fn(async () => ([{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }])),
    getOperations: vi.fn(async () => ([{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }])),
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', ilhaId: 'i1', status: 'ATIVO' },
    ])),
    getProvimento: vi.fn(async () => ([
      { id: 'p1', ilhaId: 'i1', referencia: 'qualquer', paContratada: 10 },
    ])),
    saveProvimento: vi.fn(async () => {}),
    addHistory: vi.fn(async () => {}),
  },
}));

const usuario = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com',
  role: UserRole.ADMIN, status: EntityStatus.ACTIVE };

describe('ProvimentoPage', () => {
  it('lista as ilhas ativas com a PA Contratada do mês selecionado', async () => {
    render(<ProvimentoPage currentUser={usuario} />);
    expect(await screen.findByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByLabelText('PA Contratada de Ilha 01 — SAC')).toHaveValue(10);
  });

  it('ilha sem PA Contratada no mês entra com o campo vazio', async () => {
    render(<ProvimentoPage currentUser={usuario} />);
    await screen.findByText('Ilha Nova');
    expect(screen.getByLabelText('PA Contratada de Ilha Nova')).toHaveValue(null);
  });

  it('mostra os ativos da ilha, calculados a partir dos colaboradores', async () => {
    render(<ProvimentoPage currentUser={usuario} />);
    await screen.findByText('Ilha 01 — SAC');
    const linha = screen.getByText('Ilha 01 — SAC').closest('tr')!;
    expect(linha).toHaveTextContent('1'); // 1 ativo na Ilha 01
  });

  it('salva a PA Contratada ao perder o foco do campo, e registra no histórico', async () => {
    const user = userEvent.setup();
    render(<ProvimentoPage currentUser={usuario} />);
    const campo = await screen.findByLabelText('PA Contratada de Ilha 01 — SAC');

    await user.clear(campo);
    await user.type(campo, '14');
    await user.tab();

    expect(db.saveProvimento).toHaveBeenCalledWith(
      expect.objectContaining({ ilhaId: 'i1', paContratada: 14 }),
    );
    expect(db.addHistory).toHaveBeenCalled();
  });

  it('trocar o ano recarrega a PA Contratada daquele período', async () => {
    const user = userEvent.setup();
    render(<ProvimentoPage currentUser={usuario} />);
    await screen.findByText('Ilha 01 — SAC');
    expect(screen.getByLabelText('PA Contratada de Ilha 01 — SAC')).toHaveValue(10);

    vi.mocked(db.getProvimento).mockResolvedValueOnce([]);

    const anoSelect = screen.getByLabelText('Ano de referência') as HTMLSelectElement;
    const outroAno = anoSelect.options[1].value; // qualquer ano ≠ o selecionado, sem depender da data real
    await user.selectOptions(anoSelect, outroAno);

    await waitFor(() => {
      expect(screen.getByLabelText('PA Contratada de Ilha 01 — SAC')).toHaveValue(null);
    });
  });
});
