import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

export const Topbar = ({ title, onToggleMenu }: { title: string; onToggleMenu?: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="h-14 shrink-0 flex items-center gap-3 md:gap-4 px-4 md:px-7 border-b border-hairline bg-canvas">
      {onToggleMenu && (
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="Abrir menu"
          className="lg:hidden w-8 h-8 grid place-items-center rounded-sm text-ink-2 hover:bg-canvas-soft shrink-0"
        >
          <Menu size={18} />
        </button>
      )}
      <h1 className="font-display font-bold text-base tracking-tight text-ink truncate">{title}</h1>
      <div className="flex-1" />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        className="w-8 h-8 grid place-items-center rounded-sm text-ink-2 hover:bg-canvas-soft hover:text-ink"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <NotificationCenter />
    </header>
  );
};
