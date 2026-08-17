import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('desenha só o anel na variante mark', () => {
    const { container } = render(<Logo variant="mark" />);
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('desenha os três paths no lockup', () => {
    const { container } = render(<Logo variant="lockup" />);
    expect(container.querySelectorAll('path')).toHaveLength(3);
  });

  it('mantém as cores da marca no anel e no wordmark', () => {
    const { container } = render(<Logo variant="lockup" />);
    const p = container.querySelectorAll('path');
    expect(p[0]).toHaveAttribute('fill', '#ff8705');
    expect(p[1]).toHaveAttribute('fill', '#f7080d');
  });

  it('deixa a linha Contact Center seguir o tema', () => {
    const { container } = render(<Logo variant="lockup" />);
    expect(container.querySelectorAll('path')[2]).toHaveAttribute('fill', 'currentColor');
  });

  it('se identifica para leitor de tela', () => {
    render(<Logo variant="lockup" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Quality Contact Center');
  });
});
