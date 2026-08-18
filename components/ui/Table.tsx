import React, { useId, useState } from 'react';
import { ArrowDown, ArrowUp, Filter, Search } from 'lucide-react';
import { Chip } from './Chip';

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

/** O cartão que emoldura a lista: barra em cima, tabela dentro. */
Table.Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-canvas-soft rounded-lg border border-hairline overflow-hidden ${className}`}>
    {children}
  </div>
);

interface ToolbarProps {
  busca?: { valor: string; aoMudar: (v: string) => void; placeholder?: string };
  /** Chips que ficam sempre à vista, ao lado da busca. */
  chips?: React.ReactNode;
  /** Quantas linhas a lista está mostrando agora. */
  contagem?: { n: number; um: string; varios: string };
  /** Exportar, criar — sempre à direita. */
  acoes?: React.ReactNode;
  /** Recortes que só aparecem quando alguém pede, atrás do chip "Filtros". */
  filtros?: React.ReactNode;
  filtrosAtivos?: number;
  aoLimparFiltros?: () => void;
}

/**
 * A barra da lista, no desenho da tela de Colaboradores: buscar e recortar à
 * esquerda, contar e agir à direita, e os filtros embutidos atrás de um chip.
 *
 * Os recortes ficam ocultos por padrão porque a lista é o assunto da tela —
 * um painel de seis campos aberto o tempo todo empurra os dados para baixo da
 * dobra e faz a tela parecer um formulário. O chip mostra quantos estão em uso,
 * então nada fica escondido sem aviso.
 */
Table.Toolbar = ({
  busca, chips, contagem, acoes, filtros, filtrosAtivos = 0, aoLimparFiltros,
}: ToolbarProps) => {
  const [abertos, setAbertos] = useState(false);
  const painelId = useId();

  return (
    <>
      <div className="px-4 py-3.5 border-b border-hairline flex items-center flex-wrap gap-x-2.5 gap-y-3">
        {busca && (
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={15} />
            <input
              type="search"
              className="pl-9 w-full px-3 py-[7px] bg-canvas border border-hairline-2 rounded-sm
                         text-[13px] text-ink placeholder:text-ink-faint"
              placeholder={busca.placeholder ?? 'Buscar'}
              value={busca.valor}
              onChange={e => busca.aoMudar(e.target.value)}
            />
          </div>
        )}

        {chips}

        {filtros && (
          <Chip
            onClick={() => setAbertos(a => !a)}
            aria-expanded={abertos}
            aria-controls={painelId}
            className={abertos || filtrosAtivos > 0 ? 'border-brand text-brand-text' : ''}
          >
            <span className="inline-flex items-center gap-1.5">
              <Filter size={12} />
              Filtros{filtrosAtivos > 0 ? ` · ${filtrosAtivos}` : ''}
            </span>
          </Chip>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          {contagem && (
            <span className="text-[13px] text-ink-mute whitespace-nowrap">
              <span className="t-data text-ink-2">{contagem.n}</span>{' '}
              {contagem.n === 1 ? contagem.um : contagem.varios}
            </span>
          )}
          {acoes}
        </div>
      </div>

      {filtros && abertos && (
        <div id={painelId} className="px-4 py-4 border-b border-hairline bg-canvas">
          <div className="flex justify-between items-center mb-3">
            <span className="t-eyebrow text-ink-faint">Recortar a lista</span>
            {filtrosAtivos > 0 && aoLimparFiltros && (
              <button
                type="button"
                onClick={aoLimparFiltros}
                className="text-xs font-medium text-brand-text hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">{filtros}</div>
        </div>
      )}
    </>
  );
};

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
