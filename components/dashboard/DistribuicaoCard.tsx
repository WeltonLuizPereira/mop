import { useLayoutEffect, useRef, useState } from 'react';
import type { Fatia } from '../../lib/distribuicaoStats';

/** O acento não decora: com os três cartões lado a lado, é a cor que diz qual
 *  recorte se está lendo sem precisar voltar ao título. */
export type Acento = 'operacao' | 'ilha' | 'supervisor';

const TRILHO: Record<Acento, string> = {
  operacao:   'bg-brand',
  ilha:       'bg-st-ferias',
  supervisor: 'bg-st-realocado',
};

const percentual = (fatia: number) =>
  fatia.toLocaleString('pt-BR', {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
  });

interface LinhaProps {
  fatia: Fatia;
  acento: Acento;
  /** Maior contagem do cartão — é ela que enche o trilho. */
  maior: number;
}

const Linha = ({ fatia, acento, maior }: LinhaProps) => (
  <>
    <span className="col-span-2 text-[12.5px] font-medium text-ink truncate
                     group-hover:text-brand-text transition-colors duration-100">
      {fatia.nome}
    </span>
    {/* A barra é medida contra o maior item do cartão, não contra 100%. Numa
        distribuição espalhada — nove ilhas com 12% cada — barras sobre 100%
        ficam todas do mesmo toco e não comparam nada. O percentual absoluto
        está do lado, em texto, então nada se perde. */}
    <span className="h-1.5 rounded-full bg-canvas-sunk overflow-hidden" aria-hidden="true">
      <span
        className={`block h-full rounded-full ${TRILHO[acento]}`}
        style={{ width: maior === 0 ? '0%' : `${(fatia.total / maior) * 100}%` }}
      />
    </span>
    <span className="t-data flex items-baseline gap-1.5 shrink-0">
      <span className="text-[12.5px] font-medium text-ink-2">{fatia.total.toLocaleString('pt-BR')}</span>
      <span className="text-[11px] text-ink-faint w-[5ch] text-right">{percentual(fatia.fatia)}</span>
    </span>
  </>
);

const GRADE = 'w-full grid grid-cols-[1fr_auto] items-center gap-x-3.5 gap-y-2.5 text-left px-2 py-2.5 rounded-sm';

interface DistribuicaoCardProps {
  titulo: string;
  /** O que a lista enumera, no singular e no plural: "operação"/"operações". */
  unidade: { um: string; varios: string };
  acento: Acento;
  fatias: Fatia[];
  /** Abre a lista de colaboradores recortada por esse item. */
  onAbrir: (id: string) => void;
}

export const DistribuicaoCard = ({
  titulo, unidade, acento, fatias, onAbrir,
}: DistribuicaoCardProps) => {
  const lista = useRef<HTMLUListElement>(null);
  const [temMais, setTemMais] = useState(false);

  // Uma linha cortada ao pé da lista se lê como dado faltando, não como "tem
  // mais abaixo". O esmaecido só entra quando a lista realmente transborda —
  // medido, e não deduzido de uma contagem de linhas que envelheceria junto
  // com a altura do cartão. Basta medir quando as fatias mudam: a altura da
  // linha não depende da largura (o nome trunca em uma linha só) e o teto da
  // lista é fixo, então nada mais move o transbordo.
  useLayoutEffect(() => {
    const el = lista.current;
    if (el) setTemMais(el.scrollHeight > el.clientHeight + 1);
  }, [fatias]);

  const maior = fatias.reduce((m, f) => Math.max(m, f.total), 0);

  return (
    <section className="bg-canvas-soft border border-hairline rounded-tile p-5">
      <header className="flex items-baseline justify-between gap-3 pb-3.5 mb-1 border-b border-hairline">
        <h3 className="font-display font-bold text-sm tracking-[-.01em] text-ink">{titulo}</h3>
        <span className="t-data text-[11px] text-ink-faint shrink-0">
          {fatias.length} {fatias.length === 1 ? unidade.um : unidade.varios}
        </span>
      </header>

      {fatias.length === 0 ? (
        <p className="text-xs text-ink-faint py-6 text-center">Nenhum colaborador no quadro.</p>
      ) : (
        <div className="relative">
          <ul ref={lista} className="max-h-[19rem] overflow-y-auto -mx-2 px-2">
            {fatias.map(fatia => (
              <li key={fatia.id || '@sem-vinculo'} className="border-t border-hairline first:border-t-0">
                {/* Sem id não há por onde recortar a lista: a linha de quem está
                    sem vínculo informa, mas não promete uma navegação que não
                    existe. */}
                {fatia.id ? (
                  <button
                    type="button"
                    onClick={() => onAbrir(fatia.id)}
                    aria-label={`Ver colaboradores de ${fatia.nome}`}
                    className={`${GRADE} group cursor-pointer transition-colors duration-100 hover:bg-canvas-sunk`}
                  >
                    <Linha fatia={fatia} acento={acento} maior={maior} />
                  </button>
                ) : (
                  <div className={GRADE}>
                    <Linha fatia={fatia} acento={acento} maior={maior} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {temMais && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10
                         bg-gradient-to-t from-canvas-soft to-transparent"
            />
          )}
        </div>
      )}
    </section>
  );
};
