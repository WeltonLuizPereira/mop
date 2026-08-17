import React from 'react';

export interface PageToolbarProps {
  description?: React.ReactNode;
  filters?: React.ReactElement;
  actions?: React.ReactNode;
  className?: string;
}

export const PageToolbar = ({ description, filters, actions, className = '' }: PageToolbarProps) => (
  <div className={`flex flex-col gap-4 border-b border-hairline pb-5 md:flex-row md:items-end md:justify-between ${className}`}>
    <div className="flex min-w-0 flex-col gap-3">
      {description && <div className="max-w-2xl text-sm text-ink-mute">{description}</div>}
      {filters}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
