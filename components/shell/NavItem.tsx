import React from 'react';

export const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'bg-primary-tonal text-primary' : 'text-fg-muted hover:bg-surface-alt hover:text-fg'
    }`}
  >
    <Icon size={18} className={active ? 'text-primary' : 'text-fg-subtle group-hover:text-fg-muted'} />
    {label}
  </button>
);
