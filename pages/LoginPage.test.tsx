import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityStatus, UserRole } from '../types';
import { LoginPage } from './LoginPage';

const ATIVO = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com',
  role: UserRole.ADMIN, password: 'certa', status: EntityStatus.ACTIVE };
const INATIVO = { ...ATIVO, matricula: '9999', status: EntityStatus.INACTIVE };

vi.mock('../services/mockDb', () => ({
  db: { getUsers: vi.fn(async () => [ATIVO, INATIVO]) },
}));

const entrar = async (matricula: string, senha: string) => {
  await userEvent.type(screen.getByLabelText(/matrícula/i), matricula);
  await userEvent.type(screen.getByLabelText(/senha/i), senha);
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
};

let onLogin: ReturnType<typeof vi.fn>;
beforeEach(() => { onLogin = vi.fn(); render(<LoginPage onLogin={onLogin} />); });

describe('Entrar', () => {
  it('entra com credencial correta', async () => {
    await entrar('3924', 'certa');
    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ matricula: '3924' }));
  });

  it('diz o que houve quando a credencial não confere', async () => {
    await entrar('3924', 'errada');
    expect(await screen.findByText('Matrícula ou senha incorreta.')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('explica o bloqueio e o caminho quando o acesso está inativo', async () => {
    await entrar('9999', 'certa');
    expect(await screen.findByText('Este acesso está inativo. Fale com o RH para reativar.'))
      .toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('não expõe a senha em texto', () => {
    expect(screen.getByLabelText(/senha/i)).toHaveAttribute('type', 'password');
  });
});
