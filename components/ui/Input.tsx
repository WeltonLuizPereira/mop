import React, { useId } from 'react';

/** Moldura comum a Input, Select e ao gatilho do MultiSelect. */
export const CAMPO =
  'w-full rounded-sm border border-hairline-2 bg-canvas text-ink ' +
  'text-sm px-[13px] min-h-[46px] placeholder:text-ink-faint outline-none ' +
  'focus:border-brand focus:ring-[3px] focus:ring-[#FFE6D7] dark:focus:ring-brand/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-all';

export const ROTULO = 'block text-[12px] font-extrabold text-ink mb-1.5';

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
