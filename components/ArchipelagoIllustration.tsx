import React from 'react';

interface ArchipelagoIllustrationProps {
  variant?: 'hero' | 'empty';
  className?: string;
}

const islands = [
  { path: 'M60,170 C60,120 100,90 140,95 C185,100 200,140 180,175 C160,210 110,215 80,195 C65,185 60,180 60,170 Z' },
  { path: 'M235,95 C230,65 260,45 290,50 C320,55 330,80 315,100 C300,120 265,120 245,110 C238,106 236,101 235,95 Z' },
  { path: 'M290,215 C288,195 305,180 325,182 C345,184 355,200 348,215 C341,230 315,233 300,225 C294,222 291,219 290,215 Z' },
];

const nodes = [
  { cx: 120, cy: 150 },
  { cx: 270, cy: 80 },
  { cx: 320, cy: 200 },
  { cx: 195, cy: 130 },
];

export const ArchipelagoIllustration = ({ variant = 'hero', className = '' }: ArchipelagoIllustrationProps) => {
  const size = variant === 'hero' ? 'w-full max-w-md' : 'w-40';

  return (
    <svg
      viewBox="0 0 400 300"
      className={`${size} ${className}`}
      role="img"
      aria-label="Mapa ilustrado de ilhas conectadas"
    >
      <line x1="120" y1="150" x2="270" y2="80" style={{ stroke: 'var(--border-strong)' }} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
      <line x1="270" y1="80" x2="320" y2="200" style={{ stroke: 'var(--border-strong)' }} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
      <line x1="120" y1="150" x2="320" y2="200" style={{ stroke: 'var(--border-strong)' }} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />

      {islands.map((island, i) => (
        <path key={i} d={island.path} style={{ fill: 'var(--brand-tonal)', stroke: 'var(--brand)' }} strokeWidth={2} />
      ))}

      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r={6}
          className="mop-node"
          style={{ fill: 'var(--brand)', animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  );
};
