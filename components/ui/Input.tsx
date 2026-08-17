import React from 'react';
import { Field } from './Field';

export { ROTULO } from './Field';

/** Moldura comum a Input, Select e ao gatilho do MultiSelect. */
export const CAMPO =
  'w-full rounded-sm border !border-[var(--control-border)] bg-canvas text-ink ' +
  'text-sm px-3 py-[9px] min-h-9 placeholder:text-ink-faint ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}

export const Input = ({ label, hint, error, className = '', ...props }: InputProps) => {
  const control = <input className={`${CAMPO} ${className}`} {...props} />;

  return label ? (
    <Field label={label} hint={hint} error={error}>{control}</Field>
  ) : control;
};
