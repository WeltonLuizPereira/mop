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
}

export const Sidebar = ({ currentUser, currentPage, onNavigate, onLogout, onClose }: SidebarProps) => (
  <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-hairline bg-canvas-soft">
    <div className="flex h-20 items-center gap-3 border-b border-hairline px-5">
      <Logo variant="mark" className="w-6 h-6 shrink-0" />
      <div className="min-w-0">
        <div className="font-display text-[15px] font-bold leading-tight tracking-tight text-ink">MOP</div>
        <div className="truncate text-[10px] text-ink-faint">Quality Contact Center</div>
      </div>
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

    <nav aria-label="Navega\u00e7\u00e3o principal" className="flex-1 overflow-y-auto px-4 py-5">
      {visibleGroups(currentUser.role).map(grupo => (
        <div key={grupo.group} className="mb-6 last:mb-0">
          <span className="t-eyebrow mb-2 block px-3 text-ink-faint">{grupo.group}</span>
          <div className="space-y-0.5">
            {grupo.items.map(item => (
              <NavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={currentPage === item.key}
                onClick={() => onNavigate(item.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>

    <div className="flex items-center gap-2.5 border-t border-hairline p-4">
      <div className="w-[30px] h-[30px] rounded-full bg-brand text-on-brand grid place-items-center font-display font-bold text-xs shrink-0">
        {getInitials(currentUser.nome)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-ink truncate">{currentUser.nome}</div>
        <div className="text-[11px] text-ink-faint truncate">{currentUser.role}</div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        aria-label="Sair"
        className="h-11 w-11 grid place-items-center rounded-sm text-danger hover:bg-danger/10"
      >
        <LogOut size={15} />
      </button>
    </div>
  </aside>
);
