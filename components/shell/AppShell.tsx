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

const MENU_ID = 'menu-principal';
const CONTEUDO_ID = 'conteudo-principal';

export const AppShell = ({ currentUser, currentPage, onNavigate, onLogout, children }: AppShellProps) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const gaveta = useRef<HTMLDivElement>(null);

  const conterFocoNaGaveta = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== 'Tab') return;
    const controles = [...(gaveta.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [])];
    const primeiro = controles[0];
    const ultimo = controles.at(-1);
    if (!primeiro || !ultimo) {
      evento.preventDefault();
      return;
    }
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };

  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAberto(false); };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  // Fechada a gaveta, o foco volta para o botão que a abriu — e só depois da
  // renderização, porque enquanto `inert` está de pé o botão não aceita foco.
  const montagem = useRef(true);
  useEffect(() => {
    if (montagem.current) { montagem.current = false; return; }
    if (!menuAberto) gatilho.current?.focus();
  }, [menuAberto]);

  useEffect(() => {
    if (menuAberto) {
      const fechar = gaveta.current?.querySelector<HTMLButtonElement>('[data-menu-close]');
      (fechar ?? gaveta.current)?.focus();
    }
  }, [menuAberto]);

  return (
    <div className="h-dvh bg-canvas-sunk text-ink lg:p-5">
      {/* Primeiro tabulável da página: pula a navegação inteira para quem
          chega pelo teclado. Fica invisível até receber foco. */}
      <a
        href={`#${CONTEUDO_ID}`}
        inert={menuAberto}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50
                   focus:bg-canvas focus:text-ink focus:border focus:border-brand
                   focus:rounded-sm focus:px-3 focus:py-2 focus:shadow-sm"
      >
        Pular para o conteúdo
      </a>

      <div className={`mx-auto grid h-full max-w-[1600px] overflow-hidden bg-canvas shadow-3 lg:h-[calc(100dvh-2.5rem)] lg:rounded-[32px] transition-[grid-template-columns] duration-300 ease-in-out ${sidebarCollapsed ? 'lg:grid-cols-[82px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'}`}>
      <div className="hidden lg:flex min-h-0 min-w-0 relative z-20">
        <Sidebar {...{ currentUser, currentPage, onNavigate, onLogout }} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      </div>

      {/* Abaixo de lg a lateral vira sobreposição: sem ela não há navegação
          nenhuma no celular. Fecha ao escolher uma tela — senão a gaveta
          cobre justamente a tela que a pessoa pediu. */}
      {menuAberto && (
        <div
          id={MENU_ID}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          ref={gaveta}
          tabIndex={-1}
          onKeyDown={conterFocoNaGaveta}
          className="lg:hidden fixed inset-0 z-40 flex"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
          <div className="relative z-10 h-full">
            <Sidebar
              {...{ currentUser, currentPage, onLogout }}
              collapsed={false}
              onNavigate={p => { onNavigate(p); setMenuAberto(false); }}
              onClose={() => setMenuAberto(false)}
            />
          </div>
        </div>
      )}

      {/* Com a gaveta aberta o fundo sai do alcance do teclado e do leitor de
          tela: senão o Tab sai da sobreposição e vai parar na tela coberta. */}
      <div inert={menuAberto} className="min-w-0 flex min-h-0 flex-col overflow-hidden">
        <Topbar
          title={pageTitle(currentPage)}
          onToggleMenu={() => setMenuAberto(a => !a)}
          menuOpen={menuAberto}
          menuControls={MENU_ID}
          menuRef={gatilho}
        />
        <main id={CONTEUDO_ID} tabIndex={-1} inert={menuAberto} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-4 md:p-7 lg:p-8">{children}</div>
        </main>
      </div>
      </div>
    </div>
  );
};
