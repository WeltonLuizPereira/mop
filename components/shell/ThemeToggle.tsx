import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            aria-pressed={isDark}
            className="p-2 rounded-full text-fg-muted hover:text-primary hover:bg-primary-tonal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};
