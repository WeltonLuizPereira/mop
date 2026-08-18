import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

export type Direcao = 'asc' | 'desc';

/** Coluna ativa e sentido da ordenação, como a tela guarda. */
export interface Ordenacao<C extends string = string> {
  campo: C;
  direcao: Direcao;
}

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse bg-canvas">{children}</table>
  </div>
);

Table.Head = ({ children }: { children: React.ReactNode }) => (
  <thead>
    <tr>{children}</tr>
  </thead>
);

interface ThProps {
  children?: React.ReactNode;
  className?: string;
  /** Presente, a coluna ordena: o cabeçalho vira botão. */
  campo?: string;
  ordenacao?: Ordenacao;
  onOrdenar?: (campo: string) => void;
}

const TH_BASE = 't-eyebrow text-ink-faint text-left px-3.5 py-2.5 border-b border-hairline whitespace-nowrap';

Table.Th = ({ children, className = '', campo, ordenacao, onOrdenar }: ThProps) => {
  if (!campo || !onOrdenar) {
    return <th className={`${TH_BASE} ${className}`}>{children}</th>;
  }

  const ativa = ordenacao?.campo === campo;
  const direcao = ativa ? ordenacao!.direcao : undefined;
  const Seta = direcao === 'desc' ? ArrowDown : ArrowUp;

  return (
    <th
      className={`${TH_BASE} ${className}`}
      aria-sort={ativa ? (direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        // a seta some quando a coluna não é a ativa, e volta esmaecida no
        // hover: o cabeçalho fica quieto até alguém procurar a ordenação
        className={`group inline-flex items-center gap-1.5 t-eyebrow rounded-xs
                    transition-colors duration-100
                    ${ativa ? 'text-brand-text' : 'text-ink-faint hover:text-ink-2'}`}
      >
        {children}
        <Seta
          size={11}
          aria-hidden="true"
          className={ativa ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}
        />
      </button>
    </th>
  );
};

Table.Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-3.5 py-2.5 border-b border-hairline text-[13px] align-middle whitespace-nowrap ${className}`}>
    {children}
  </td>
);
