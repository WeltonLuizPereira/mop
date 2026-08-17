import React from 'react';
import { User } from '../../types';
import { ThemeToggle } from './ThemeToggle';

export const Header = ({ title, user, children }: { title: string, user: User, children?: React.ReactNode }) => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <header className="bg-surface border-b border-border h-16 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
                <h1 className="text-lg font-bold text-fg capitalize leading-none">{title}</h1>
                <p className="text-xs text-fg-muted capitalize mt-1">{today}</p>
            </div>

            <div className="flex items-center gap-6">
                <ThemeToggle />
                {children}
                <div className="flex items-center gap-3 pl-6 border-l border-border">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-fg leading-tight">{user.nome.split(' ')[0]} {user.nome.split(' ').pop()}</p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wide">{user.role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary-tonal border-2 border-surface shadow-1 text-primary flex items-center justify-center font-bold text-sm">
                        {user.nome.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};
