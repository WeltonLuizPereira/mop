import React from 'react';

export interface LoadingStateProps {
  label?: string;
}

export const LoadingState = ({ label = 'Carregando' }: LoadingStateProps) => (
  <div role="status" aria-busy="true" aria-label={label} className="grid min-h-32 place-items-center px-5 py-8">
    <span className="flex items-center gap-3 text-sm text-ink-mute">
      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-hairline-2 border-t-brand" />
      {label}
    </span>
  </div>
);
