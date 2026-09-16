import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

interface TopbarProps {
  title: string;
  onToggleMenu?: () => void;
  /** Gaveta aberta agora — o botão anuncia o estado, não só a ação. */
  menuOpen?: boolean;
  /** Id do elemento que o botão abre, para quem navega por leitor de tela. */
  menuControls?: string;
  /** O shell devolve o foco a este botão quando a gaveta fecha. */
  menuRef?: React.Ref<HTMLButtonElement>;
}

export const Topbar = ({ title, onToggleMenu, menuOpen = false, menuControls, menuRef }: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-canvas px-5 md:gap-4 md:px-8">
      {onToggleMenu && (
        <button
          type="button"
          ref={menuRef}
          onClick={onToggleMenu}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls={menuControls}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-ink-2 hover:bg-canvas-soft lg:hidden"
        >
          <Menu size={18} />
        </button>
      )}
      <h1 className="truncate font-display text-lg font-bold tracking-tight text-ink">{title}</h1>
      <div className="flex-1" />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        className="grid h-8 w-8 place-items-center rounded-sm text-ink-2 hover:bg-canvas-soft hover:text-ink"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <NotificationCenter />
    </header>
  );
};
