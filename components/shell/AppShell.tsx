import React, { useEffect, useRef, useState } from 'react';
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuWasOpenRef = useRef(false);
  const menuId = 'menu-principal-mobile';

  useEffect(() => {
    if (!menuAberto) {
      if (menuWasOpenRef.current) {
        menuWasOpenRef.current = false;
        menuButtonRef.current?.focus();
      }
      return;
    }
    menuWasOpenRef.current = true;
    drawerRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuAberto(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuAberto]);

  return (
    <div className="flex h-[100dvh] min-h-[100svh] bg-canvas text-ink">
      <a
        href="#conteudo-principal"
        className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-sm bg-brand px-4 py-2 text-sm font-semibold text-on-brand focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>

      <div className="hidden lg:flex" inert={menuAberto}>
        <Sidebar {...{ currentUser, currentPage, onNavigate, onLogout }} />
      </div>

      {/* Abaixo de lg a lateral vira sobreposição: sem ela não há navegação
          nenhuma no celular. Fecha ao escolher uma tela — senão a gaveta
          cobre justamente a tela que a pessoa pediu. */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuAberto(false)}
          />
          <div
            ref={drawerRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            tabIndex={-1}
            className="relative z-10 h-full shadow-3"
          >
            <Sidebar
              {...{ currentUser, currentPage, onLogout }}
              onNavigate={p => { onNavigate(p); setMenuAberto(false); }}
            />
          </div>
        </div>
      )}

      <main id="conteudo-principal" inert={menuAberto} className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={pageTitle(currentPage)}
          onToggleMenu={() => setMenuAberto(open => !open)}
          menuOpen={menuAberto}
          menuControls={menuId}
          menuButtonRef={menuButtonRef}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-7 max-w-[1440px] w-full mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};
