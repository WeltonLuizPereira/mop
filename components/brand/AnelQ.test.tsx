import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnelQ } from './AnelQ';

describe('AnelQ', () => {
  it('anuncia o valor para leitor de tela', () => {
    render(<AnelQ value={0.85} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('85% em operação');
  });

  it('aceita rótulo próprio', () => {
    render(<AnelQ value={1} label="Marca Quality" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Marca Quality');
  });

  it('dispensa a máscara quando está cheio', () => {
    const { container } = render(<AnelQ value={1} />);
    expect(container.querySelector('mask')).toBeNull();
  });

  it('aplica a máscara quando está parcial', () => {
    const { container } = render(<AnelQ value={0.5} />);
    expect(container.querySelector('mask')).not.toBeNull();
    expect(container.querySelector('path[mask]')).not.toBeNull();
  });

  it('dá id único a cada máscara na mesma página', () => {
    const { container } = render(<><AnelQ value={0.4} /><AnelQ value={0.6} /></>);
    const ids = [...container.querySelectorAll('mask')].map(m => m.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('esquenta abaixo do limite e não acima', () => {
    const { container: frio } = render(<AnelQ value={0.9} />);
    expect(frio.firstElementChild).toHaveStyle({ color: 'var(--brand)' });
    const { container: quente } = render(<AnelQ value={0.6} />);
    expect(quente.firstElementChild).toHaveStyle({ color: 'var(--brand-hot)' });
  });

  it('respeita limite customizado', () => {
    const { container } = render(<AnelQ value={0.9} threshold={0.95} />);
    expect(container.firstElementChild).toHaveStyle({ color: 'var(--brand-hot)' });
  });
});
