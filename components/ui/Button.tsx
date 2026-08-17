import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid-danger';
export type ButtonSize = 'sm' | 'md' | 'touch';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-sm font-semibold text-[13px] ' +
  'leading-none border border-transparent transition-colors duration-100 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-2',
  md: 'min-h-9 px-4 py-[9px]',
  touch: 'min-h-11 px-4 py-3',
};

const VARIANTES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hot active:bg-brand-press',
  secondary: 'bg-brand-wash text-brand-text hover:bg-brand/20',
  ghost: 'bg-transparent text-ink border-hairline-2 hover:bg-canvas-soft',
  danger: 'bg-transparent text-danger hover:bg-danger/10',
  'solid-danger': 'bg-danger text-canvas hover:opacity-90',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  className = '',
  type = 'button',
  disabled = false,
  'aria-busy': ariaBusy,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`${BASE} ${SIZES[size]} ${VARIANTES[variant] ?? VARIANTES.secondary} ${block ? 'w-full' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
    aria-busy={loading ? true : ariaBusy}
  >
    {children}
  </button>
);
