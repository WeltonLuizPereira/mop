import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricStrip } from './MetricStrip';

describe('MetricStrip', () => {
  it('relaciona cada métrica ao valor com semântica de lista descritiva', () => {
    render(<MetricStrip items={[{ label: 'ativos', value: 12 }, { label: 'afastados', value: 2 }]} />);
    expect(screen.getAllByRole('term')).toHaveLength(2);
    expect(screen.getAllByRole('definition')).toHaveLength(2);
  });
});
