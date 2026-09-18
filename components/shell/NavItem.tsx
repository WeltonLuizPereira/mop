import React from 'react';

interface NavItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

export const NavItem = ({ icon: Icon, label, active, onClick, collapsed }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    title={collapsed ? label : undefined}
    className={
      `w-full min-h-[44px] flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-sm text-[14px] text-left ` +
      'transition-colors duration-100 ' +
      (active
        ? 'bg-brand-wash text-brand font-extrabold'
        : 'text-ink-mute hover:bg-canvas-sunk hover:text-ink font-semibold')
    }
  >
    <Icon size={16} />
    {!collapsed && <span>{label}</span>}
  </button>
);
