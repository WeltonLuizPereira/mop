import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid-danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-sm font-extrabold text-[14px] ' +
  'leading-none min-h-[46px] px-[18px] py-[13px] border border-transparent ' +
  'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-[1px]';

const VARIANTES: Record<Variant, string> = {
  primary:        'bg-[linear-gradient(135deg,#E3362A,#FF681F)] text-on-brand shadow-accent',
  secondary:      'bg-canvas-soft text-ink border-hairline hover:bg-canvas-sunk shadow-sm',
  ghost:          'bg-transparent text-ink border-hairline-2 hover:bg-canvas-sunk',
  danger:         'bg-transparent text-danger border border-danger/30 hover:bg-danger/10',
  'solid-danger': 'bg-danger text-white shadow-sm hover:opacity-90',
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
