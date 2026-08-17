import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollaboratorStatus } from '../../types';
import { Badge } from './Badge';

describe('Badge', () => {
  it.each(Object.values(CollaboratorStatus))('sempre mostra o rótulo de %s', s => {
    render(<Badge status={s} />);
    expect(screen.getByText(new RegExp(s, 'i'))).toBeInTheDocument();
  });

  it('dá ao ponto uma cor por status, distinta entre estados', () => {
    const { container: a } = render(<Badge status={CollaboratorStatus.ATIVO} />);
    const { container: b } = render(<Badge status={CollaboratorStatus.DESLIGADO} />);
    const cor = (c: HTMLElement) =>
      (c.querySelector('[data-dot]') as HTMLElement).style.backgroundColor;
    expect(cor(a)).not.toBe(cor(b));
  });

  it('marca o ponto como decorativo — quem lê tela ouve só o rótulo', () => {
    const { container } = render(<Badge status={CollaboratorStatus.ATIVO} />);
    expect(container.querySelector('[data-dot]')).toHaveAttribute('aria-hidden', 'true');
  });
});
