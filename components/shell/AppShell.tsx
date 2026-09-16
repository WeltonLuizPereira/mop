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
  const gatilho = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="min-h-dvh bg-canvas-sunk text-ink lg:p-5">
      {/* Primeiro tabulável da página: pula a navegação inteira para quem
          chega pelo teclado. Fica invisível até receber foco. */}
      <a
        href={`#${CONTEUDO_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50
                   focus:bg-canvas focus:text-ink focus:border focus:border-brand
                   focus:rounded-sm focus:px-3 focus:py-2 focus:shadow-1"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto grid min-h-dvh max-w-[1600px] overflow-hidden bg-canvas shadow-3 lg:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[248px_minmax(0,1fr)] lg:rounded-[24px]">
      <div className="hidden lg:flex">
        <Sidebar {...{ currentUser, currentPage, onNavigate, onLogout }} />
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
          className="lg:hidden fixed inset-0 z-40 flex"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
          <div className="relative z-10 h-full">
            <Sidebar
              {...{ currentUser, currentPage, onLogout }}
              onNavigate={p => { onNavigate(p); setMenuAberto(false); }}
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
        <main id={CONTEUDO_ID} inert={menuAberto} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-4 md:p-7 lg:p-8">{children}</div>
        </main>
      </div>
      </div>
    </div>
  );
};
