import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
  const styles = {
    primary: "bg-primary text-on-primary hover:bg-primary-dark shadow-1 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-primary-tonal text-primary hover:bg-primary/20",
    danger: "bg-error/10 text-error hover:bg-error/20 border border-error/30",
    "solid-danger": "bg-error text-on-error hover:opacity-90 shadow-1 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-fg-muted hover:text-fg hover:bg-surface-alt"
  };
  return (
    <button type="button" className={`${base} ${styles[variant as keyof typeof styles]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};
