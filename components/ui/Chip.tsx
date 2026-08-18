import React from 'react';

/** Moldura do chip: filtro ou ordenação que carrega o valor no próprio rótulo. */
const MOLDURA =
  'text-xs font-medium text-ink-2 border border-hairline-2 rounded-sm ' +
  'bg-canvas px-2.5 py-[5px] whitespace-nowrap ' +
  'hover:border-ink-faint transition-colors duration-100 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

export const Chip = ({
  className = '', type = 'button', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type={type} className={`${MOLDURA} cursor-pointer ${className}`} {...props} />
);

interface ChipSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Prefixo fixo do chip: "Cliente", "Ilha", "Status". */
  rotulo: string;
}

/** Chip que abre a lista nativa: o prefixo fica visível e o valor escolhido
 *  aparece dentro da própria opção, como no mockup ("Cliente: todos"). */
export const ChipSelect = ({ rotulo, className = '', children, ...props }: ChipSelectProps) => (
  <label className={`${MOLDURA} inline-flex items-center gap-1 cursor-pointer ${className}`}>
    <span className="text-ink-mute">{rotulo}:</span>
    <select
      {...props}
      className="bg-transparent text-ink-2 font-medium outline-none cursor-pointer max-w-[13ch] truncate"
    >
      {children}
    </select>
  </label>
);
