import { RING_CENTER } from './logoPaths';

/** Raio que cobre os cantos da caixa do anel com folga (canto ≈ 252). */
const R = 270;

/**
 * Setor circular que revela o anel por máscara.
 * Parte de meia-noite e gira no sentido horário por `v` de uma volta.
 */
export function wedgePath(v: number): string {
  const t = Math.min(1, Math.max(0, v));
  const { x: cx, y: cy } = RING_CENTER;
  const a0 = -Math.PI / 2;
  const a1 = a0 + t * Math.PI * 2;
  const p = (a: number) => [cx + R * Math.cos(a), cy + R * Math.sin(a)] as const;
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const largeArc = t > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}
