import React, { useId } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactElement;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  const titleId = useId();
  return (
    <section role="region" aria-labelledby={titleId} className="grid min-h-48 place-items-center px-5 py-10 text-center">
      <div className="max-w-md">
        <h2 id={titleId} className="t-display-md text-ink">{title}</h2>
        {description && <div className="mt-2 text-sm leading-6 text-ink-mute">{description}</div>}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </section>
  );
};
