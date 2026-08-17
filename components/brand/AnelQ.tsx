import React, { useEffect, useId, useState } from 'react';
import { RING_PATH, RING_VIEWBOX } from './logoPaths';
import { wedgePath } from './wedge';

interface AnelQProps {
  /** 0 a 1. */
  value: number;
  /** Abaixo disso o traço vira do âmbar para o quente. Padrão 0.80. */
  threshold?: number;
  className?: string;
  /** Sobrescreve o rótulo acessível. */
  label?: string;
}

const prefereMenosMovimento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * O "Q" do logo usado como medidor: o path real do pincel, revelado por uma
 * cunha giratória. A irregularidade da tinta está na geometria — não há filtro.
 *
 * Uma animação, uma vez (spec §7.5): a cunha vai de 0 ao valor final em 700ms
 * ease-out na montagem. Sob `prefers-reduced-motion: reduce`, renderiza no
 * valor final direto, sem transição.
 */
export const AnelQ = ({ value, threshold = 0.8, className = '', label }: AnelQProps) => {
  const alvo = Math.min(1, Math.max(0, value));
  const maskId = useId();
  const [desenhado, setDesenhado] = useState(() => (prefereMenosMovimento() ? alvo : 0));

  useEffect(() => {
    if (prefereMenosMovimento()) { setDesenhado(alvo); return; }
    let raf = 0;
    const inicio = performance.now();
    const DURACAO = 700;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / DURACAO);
      setDesenhado(alvo * (1 - (1 - t) ** 3)); // ease-out cúbico
      if (t < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo]);

  const cheio = desenhado >= 1;
  const cor = alvo < threshold ? 'var(--brand-hot)' : 'var(--brand)';

  return (
    <svg
      viewBox={RING_VIEWBOX}
      className={className}
      style={{ color: cor, display: 'block' }}
      role="img"
      aria-label={label ?? `${Math.round(alvo * 100)}% em operação`}
    >
      {!cheio && (
        <defs>
          <mask id={maskId}>
            <rect x="327" y="177" width="353" height="360" fill="black" />
            <path d={wedgePath(desenhado)} fill="white" />
          </mask>
        </defs>
      )}
      <path d={RING_PATH} fill="currentColor" mask={cheio ? undefined : `url(#${maskId})`} />
    </svg>
  );
};
