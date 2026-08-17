import React from 'react';

export const Select = ({ label, children, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label}</label>}
    <select
      className={`w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-fg ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);
