import React from 'react';

interface NavItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={
      'w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-sm text-[13px] text-left ' +
      '-ml-0.5 border-l-2 transition-colors duration-100 ' +
      (active
        ? 'bg-brand-wash text-ink border-brand font-semibold'
        : 'text-ink-2 border-transparent hover:bg-canvas-sunk hover:text-ink font-medium')
    }
  >
    <Icon size={16} />
    {label}
  </button>
);
