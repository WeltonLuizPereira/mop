import React from 'react';
import { LogOut } from 'lucide-react';
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
}

export const Sidebar = ({ currentUser, currentPage, onNavigate, onLogout }: SidebarProps) => (
  <aside className="w-[260px] shrink-0 bg-canvas-soft border-r border-hairline flex flex-col h-full">
    <div className="h-14 flex items-center gap-2.5 px-[18px] border-b border-hairline">
      <Logo variant="mark" className="w-6 h-6 shrink-0" />
      <div className="min-w-0">
        <div className="font-display font-bold text-[15px] tracking-tight text-ink leading-tight">MOP</div>
        <div className="text-[10px] text-ink-faint truncate">Quality Contact Center</div>
      </div>
    </div>

    <nav className="flex-1 overflow-y-auto p-3">
      {visibleGroups(currentUser.role).map(grupo => (
        <div key={grupo.group} className="mb-5 last:mb-0">
          <span className="t-eyebrow text-ink-faint block px-2.5 mb-2">{grupo.group}</span>
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

    <div className="border-t border-hairline p-3.5 flex items-center gap-2.5">
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
        className="w-8 h-8 grid place-items-center rounded-sm text-danger hover:bg-danger/10"
      >
        <LogOut size={15} />
      </button>
    </div>
  </aside>
);
