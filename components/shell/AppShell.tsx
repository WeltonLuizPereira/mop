import React from 'react';
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

export const AppShell = ({ currentUser, currentPage, onNavigate, onLogout, children }: AppShellProps) => (
  <div className="flex h-screen bg-canvas text-ink">
    <div className="hidden lg:flex">
      <Sidebar {...{ currentUser, currentPage, onNavigate, onLogout }} />
    </div>
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <Topbar title={pageTitle(currentPage)} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-7 max-w-[1440px] w-full mx-auto">{children}</div>
      </div>
    </main>
  </div>
);
