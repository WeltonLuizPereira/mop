import React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/** Rótulo neutro para classificação; status semântico usa Badge. */
export const Tag = ({ children, className = '', ...props }: TagProps) => (
  <span
    {...props}
    className={`inline-flex items-center rounded-sm bg-canvas-soft px-2 py-0.5 text-xs text-ink-2 ${className}`}
  >
    {children}
  </span>
);
