import { describe, expect, it } from 'vitest';
import { wedgePath } from './wedge';

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('wedgePath', () => {
  it('começa no centro do anel', () => {
    expect(wedgePath(0.5).startsWith('M 503.5 357')).toBe(true);
  });

  it('parte de meia-noite: o primeiro ponto fica acima do centro, no mesmo x', () => {
    const n = nums(wedgePath(0.25));
    expect(n[2]).toBeCloseTo(503.5, 1);   // x inicial
    expect(n[3]).toBeLessThan(357);        // y inicial acima do centro
  });

  it('em 25% termina à direita do centro, na mesma altura', () => {
    const n = nums(wedgePath(0.25));
    const [x, y] = n.slice(-2);
    expect(x).toBeGreaterThan(503.5);
    expect(y).toBeCloseTo(357, 0);
  });

  it('liga o arco maior só acima de meia volta', () => {
    expect(wedgePath(0.25)).toContain(' 0 1 ');   // largeArc = 0, sweep = 1
    expect(wedgePath(0.75)).toContain(' 1 1 ');   // largeArc = 1, sweep = 1
  });

  it('fecha o caminho', () => {
    expect(wedgePath(0.6).trimEnd().endsWith('Z')).toBe(true);
  });

  it('trata valores fora da faixa sem quebrar', () => {
    expect(() => wedgePath(-1)).not.toThrow();
    expect(() => wedgePath(5)).not.toThrow();
    expect(wedgePath(-1)).toBe(wedgePath(0));
    expect(wedgePath(5)).toBe(wedgePath(1));
  });
});
