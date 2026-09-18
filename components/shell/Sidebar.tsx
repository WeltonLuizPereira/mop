import React from 'react';
import { LogOut, X } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { visibleGroups } from '../../lib/navigation';
import { getInitials } from '../../utils';
import type { User } from '../../types';
import { NavItem } from './NavItem';

interface SidebarProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Sidebar = ({ currentUser, currentPage, onNavigate, onLogout, onClose, collapsed, onToggleCollapse }: SidebarProps) => (
  <aside className="relative z-20 flex h-full w-full shrink-0 flex-col border-r border-hairline bg-canvas-soft">
    {onToggleCollapse && (
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="absolute top-[28px] -right-[12px] z-10 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-canvas shadow-sm border border-hairline text-ink-2 hover:text-ink hover:border-brand-wash transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    )}
    <div className={`flex h-[80px] items-center ${collapsed ? 'justify-center' : 'gap-3 px-5'} border-b border-hairline`}>
      <div className="w-[32px] h-[32px] grid place-items-center">
        <Logo variant="mark" className="w-full h-full" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="font-display text-[20px] font-extrabold leading-tight tracking-tight text-ink">MOP</div>
        </div>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu de navegação"
          data-menu-close
          className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-sm text-ink-2 hover:bg-canvas-sunk hover:text-ink"
        >
          <X size={18} />
        </button>
      )}
    </div>

    <nav aria-label="Navegação principal" className={`flex-1 overflow-y-scroll custom-scrollbar py-5 ${collapsed ? 'px-2' : 'px-4'}`}>
      {visibleGroups(currentUser.role).map(grupo => (
        <div key={grupo.group} className="mb-6 last:mb-0">
          {!collapsed && <span className="t-eyebrow mb-2 block px-3 text-ink-faint">{grupo.group}</span>}
          <div className="space-y-0.5">
            {grupo.items.map(item => (
              <NavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                active={currentPage === item.key}
                onClick={() => onNavigate(item.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>

    <div className={`flex flex-col border-t border-hairline ${collapsed ? 'p-2 gap-2 items-center' : 'p-4'}`}>
      <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-2.5 mb-2'}`}>
        <div className="w-[30px] h-[30px] rounded-full bg-brand text-on-brand grid place-items-center font-display font-bold text-xs shrink-0">
          {getInitials(currentUser.nome)}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-ink truncate">{currentUser.nome}</div>
            <div className="text-[11px] text-ink-faint truncate">{currentUser.role}</div>
          </div>
        )}
      </div>
      <div className={`flex w-full ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sair"
          className="h-9 w-full flex items-center justify-center rounded-sm text-danger hover:bg-danger/10 border border-danger/20"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  </aside>
);
