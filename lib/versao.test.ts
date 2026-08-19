import { describe, expect, it } from 'vitest';
import { versaoExibida } from './versao';

describe('versaoExibida', () => {
  it('esconde o patch zerado — o rodapé diz 2.0, não 2.0.0', () => {
    expect(versaoExibida('2.0.0')).toBe('2.0');
    expect(versaoExibida('2.1.0')).toBe('2.1');
    expect(versaoExibida('10.4.0')).toBe('10.4');
  });

  it('mostra o patch quando ele existe — correção de bug não some', () => {
    expect(versaoExibida('2.0.1')).toBe('2.0.1');
    expect(versaoExibida('2.1.12')).toBe('2.1.12');
  });

  it('devolve o que recebeu quando não é semver de três casas', () => {
    expect(versaoExibida('2.0')).toBe('2.0');
    expect(versaoExibida('2.0.0-beta')).toBe('2.0.0-beta');
    expect(versaoExibida(' 2.0.0 ')).toBe('2.0');
  });
});
