import React, { useId } from 'react';
import { CAMPO, ROTULO } from './Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = ({ label, children, className = '', id, ...props }: SelectProps) => {
  const gerado = useId();
  const campoId = id ?? gerado;
  return (
    <div className="mb-3">
      {label && <label htmlFor={campoId} className={ROTULO}>{label}</label>}
      <select id={campoId} className={`${CAMPO} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
};
