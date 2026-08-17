import React, { useId } from 'react';

/** Moldura comum a Input, Select e ao gatilho do MultiSelect. */
export const CAMPO =
  'w-full rounded-sm border border-hairline-2 bg-canvas text-ink ' +
  'text-sm px-3 py-[9px] min-h-9 placeholder:text-ink-faint ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const ROTULO = 'block text-[13px] font-medium text-ink-2 mb-1.5';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, className = '', id, ...props }: InputProps) => {
  // o id ligado ao `for` do rótulo: sem ele, clicar no rótulo não foca o campo
  // e o leitor de tela anuncia o campo sem nome
  const gerado = useId();
  const campoId = id ?? gerado;
  return (
    <div className="mb-3">
      {label && <label htmlFor={campoId} className={ROTULO}>{label}</label>}
      <input id={campoId} className={`${CAMPO} ${className}`} {...props} />
    </div>
  );
};
