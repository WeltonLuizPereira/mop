import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

function Sonda() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>tema: {theme}</button>;
}
const montar = () => render(<ThemeProvider><Sonda /></ThemeProvider>);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeProvider', () => {
  it('abre no claro quando não há preferência salva', () => {
    montar();
    expect(screen.getByRole('button')).toHaveTextContent('tema: light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('respeita a preferência salva', () => {
    localStorage.setItem('mop-theme', 'dark');
    montar();
    expect(screen.getByRole('button')).toHaveTextContent('tema: dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('alterna e persiste a escolha', async () => {
    montar();
    await act(() => userEvent.click(screen.getByRole('button')));
    expect(localStorage.getItem('mop-theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('ignora valor inválido no armazenamento', () => {
    localStorage.setItem('mop-theme', 'roxo');
    montar();
    expect(screen.getByRole('button')).toHaveTextContent('tema: light');
  });

  describe('quando o sistema operacional prefere escuro', () => {
    const matchMediaOriginal = window.matchMedia;

    afterEach(() => {
      window.matchMedia = matchMediaOriginal;
    });

    it('abre no claro mesmo assim, sem preferência salva (Ruling C8)', () => {
      window.matchMedia = ((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;

      montar();
      expect(screen.getByRole('button')).toHaveTextContent('tema: light');
      expect(document.documentElement).not.toHaveClass('dark');
    });
  });
});
