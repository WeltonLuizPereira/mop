import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Topbar } from './Topbar';

vi.mock('./NotificationCenter', () => ({ NotificationCenter: () => null }));

describe('Topbar', () => {
  it('expõe estado e alvo da gaveta no botão de menu', () => {
    render(
      <ThemeProvider>
        <Topbar title="Colaboradores" onToggleMenu={vi.fn()} menuOpen menuControls="menu-principal" />
      </ThemeProvider>,
    );

    const menu = screen.getByRole('button', { name: 'Fechar menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toHaveAttribute('aria-controls', 'menu-principal');
  });
});
