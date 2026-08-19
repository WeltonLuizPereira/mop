import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('abre como diálogo modal, prende foco, bloqueia rolagem e restaura o acionador ao fechar', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const Fixture = () => {
      const [open, setOpen] = useState(false);
      const firstRef = useRef<HTMLButtonElement>(null);
      const onClose = () => { close(); setOpen(false); };
      return <><button onClick={() => setOpen(true)}>Acionador</button><Modal open={open} onClose={onClose} title="Editar cliente" initialFocusRef={firstRef}><button ref={firstRef}>Primeiro</button><button>Último</button></Modal></>;
    };

    render(<Fixture />);
    await user.click(screen.getByRole('button', { name: 'Acionador' }));

    const dialog = screen.getByRole('dialog', { name: 'Editar cliente' });
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    // sai para o body: dentro da página, um `transform` de ancestral vira
    // bloco de contenção do `fixed` e joga o diálogo para fora da janela
    expect(dialog.parentElement?.parentElement).toBe(document.body);

    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByRole('button', { name: 'Acionador' })).toHaveFocus();
  });
});
