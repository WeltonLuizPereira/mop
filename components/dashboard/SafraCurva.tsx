import React, { useId } from 'react';
import type { PontoDaCurva } from '../../lib/safraStats';

const L = 44;   // canaleta dos rótulos à esquerda
const R = 12;
const TOPO = 12;
const BASE = 118;
const ALTURA = 148;

/**
 * Quando a safra perdeu gente, mês a mês desde a entrada.
 *
 * O eixo vertical não começa em zero: uma safra que reteve 70% desenharia
 * uma linha quase reta no alto de um eixo 0–100%, e o que interessa aqui é
 * *onde* ela caiu. O piso acompanha o menor ponto, e o rótulo do eixo diz
 * qual é — sem isso, encurtar a escala seria exagerar a queda.
 */
export const SafraCurva = ({ pontos }: { pontos: PontoDaCurva[] }) => {
  const id = useId();
  if (pontos.length < 2) return null;

  const menor = Math.min(...pontos.map(p => p.retencao));
  const piso = Math.max(0, Math.floor(menor * 10) / 10 - 0.05);
  const faixa = Math.max(0.0001, 1 - piso);

  const largura = 720;
  const x = (i: number) => L + (i / (pontos.length - 1)) * (largura - L - R);
  const y = (v: number) => BASE - ((v - piso) / faixa) * (BASE - TOPO);

  const linha = pontos.map((p, i) => `${x(i)},${y(p.retencao)}`).join(' ');
  const area = `${L},${BASE} ${linha} ${x(pontos.length - 1)},${BASE}`;
  const marcas = [1, piso + faixa / 2, piso];

  return (
    <svg
      viewBox={`0 0 ${largura} ${ALTURA}`}
      className="w-full h-[148px] block"
      role="img"
      aria-label={`Retenção da safra do mês da entrada até ${pontos.length - 1} meses depois, terminando em ${Math.round(pontos.at(-1)!.retencao * 100)} por cento`}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity=".16" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {marcas.map((v, i) => (
        <g key={i}>
          <line x1={L} y1={y(v)} x2={largura - R} y2={y(v)} stroke="var(--hairline)" strokeDasharray="3 3" />
          <text
            x={L - 8} y={y(v) + 3.5} textAnchor="end"
            fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-data)"
          >
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}

      <polygon points={area} fill={`url(#g${id})`} />
      <polyline points={linha} fill="none" stroke="var(--brand)" strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round" />

      {pontos.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.retencao)} r="3"
                fill="var(--canvas)" stroke="var(--brand)" strokeWidth="2" />
      ))}

      {pontos.map((p, i) => (
        <text
          key={i} x={x(i)} y={ALTURA - 6} textAnchor="middle"
          fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-data)"
        >
          {p.mes === 0 ? 'entrada' : `+${p.mes}`}
        </text>
      ))}
    </svg>
  );
};
