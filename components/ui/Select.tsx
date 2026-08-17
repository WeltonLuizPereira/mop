import React from 'react';
import { Field } from './Field';
import { CAMPO } from './Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}

export const Select = ({ label, hint, error, children, className = '', ...props }: SelectProps) => {
  const control = <select className={`${CAMPO} ${className}`} {...props}>{children}</select>;

  return label ? (
    <Field label={label} hint={hint} error={error}>{control}</Field>
  ) : control;
};
