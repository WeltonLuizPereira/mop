import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../services/mockDb';
import { ResetDataPage } from './ResetDataPage';

vi.mock('../services/mockDb', () => ({
  db: { resetDatabase: vi.fn() },
}));

const montar = () => render(<ResetDataPage />);

const localizacaoOriginal = window.location;

describe('ResetDataPage', () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (db.resetDatabase as ReturnType<typeof vi.fn>).mockReset();
    reload = vi.fn();
    // jsdom não deixa espionar `location.reload` diretamente (propriedade
    // não configurável) — substitui `window.location` inteiro no teste.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...localizacaoOriginal, reload },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: localizacaoOriginal,
    });
    vi.restoreAllMocks();
  });

  it('mantém a ação destrutiva dentro de uma zona de perigo nomeada', () => {
    montar();
    expect(screen.getByRole('region', { name: 'Zona de perigo' })).toBeInTheDocument();
  });

  it('exige confirmação em modal antes de resetar — abrir o modal não dispara a mutação', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Resetar todos os dados' }));
    expect(screen.getByRole('dialog', { name: 'Resetar todos os dados?' })).toBeVisible();
    expect(db.resetDatabase).not.toHaveBeenCalled();
  });

  it('fecha com Escape sem resetar e devolve o foco ao botão que abriu o modal', async () => {
    const user = userEvent.setup();
    montar();
    const gatilho = screen.getByRole('button', { name: 'Resetar todos os dados' });
    await user.click(gatilho);
    expect(screen.getByRole('dialog')).toBeVisible();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(db.resetDatabase).not.toHaveBeenCalled();
    expect(gatilho).toHaveFocus();
  });

  it('mostra carregamento, chama resetDatabase uma vez e só recarrega após sucesso', async () => {
    let resolver: () => void = () => {};
    (db.resetDatabase as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<void>(resolve => { resolver = resolve; }),
    );
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Resetar todos os dados' }));
    const confirmar = screen.getByRole('button', { name: 'Sim, apagar tudo' });
    await user.click(confirmar);

    await waitFor(() => expect(confirmar).toHaveAttribute('aria-busy', 'true'));
    expect(reload).not.toHaveBeenCalled();

    resolver();
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(db.resetDatabase).toHaveBeenCalledTimes(1);
  });

  it('em erro não recarrega e permite nova tentativa sem exigir reconfirmação', async () => {
    (db.resetDatabase as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Resetar todos os dados' }));
    await user.click(screen.getByRole('button', { name: 'Sim, apagar tudo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível/i);
    expect(reload).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(db.resetDatabase).toHaveBeenCalledTimes(2);
  });
});
