import React, { useState } from 'react';
import type { User } from '../../types';
import { pageTitle } from '../../lib/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell = ({ currentUser, currentPage, onNavigate, onLogout, children }: AppShellProps) => {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex h-screen bg-canvas text-ink">
      <div className="hidden lg:flex">
        <Sidebar {...{ currentUser, currentPage, onNavigate, onLogout }} />
      </div>

      {/* Abaixo de lg a lateral vira sobreposição: sem ela não há navegação
          nenhuma no celular. Fecha ao escolher uma tela — senão a gaveta
          cobre justamente a tela que a pessoa pediu. */}
      {menuAberto && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
          <div className="relative z-10">
            <Sidebar
              {...{ currentUser, currentPage, onLogout }}
              onNavigate={p => { onNavigate(p); setMenuAberto(false); }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Topbar title={pageTitle(currentPage)} onToggleMenu={() => setMenuAberto(true)} />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-7 max-w-[1440px] w-full mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};
