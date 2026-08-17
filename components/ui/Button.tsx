import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid-danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-sm font-semibold text-[13px] ' +
  'leading-none min-h-9 px-4 py-[9px] border border-transparent ' +
  'transition-colors duration-100 disabled:opacity-50 disabled:pointer-events-none';

const VARIANTES: Record<Variant, string> = {
  primary:        'bg-brand text-on-brand hover:bg-brand-hot active:bg-brand-press',
  secondary:      'bg-brand-wash text-brand-text hover:bg-brand/20',
  ghost:          'bg-transparent text-ink border-hairline-2 hover:bg-canvas-soft',
  danger:         'bg-transparent text-danger hover:bg-danger/10',
  'solid-danger': 'bg-danger text-canvas hover:opacity-90',
};

export const Button = ({
  children, variant = 'primary', block = false, className = '', type = 'button', ...props
}: ButtonProps) => (
  <button
    type={type}
    // variante desconhecida (`empty`, `hero`, `outline` ainda existem em 3 call
    // sites das levas 2 e 3) cai em `secondary` em vez de emitir undefined
    className={`${BASE} ${VARIANTES[variant] ?? VARIANTES.secondary} ${block ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);
