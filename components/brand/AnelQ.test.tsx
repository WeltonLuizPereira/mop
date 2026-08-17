import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnelQ } from './AnelQ';

/**
 * Põe os frames da animação sob controle do teste.
 *
 * O anel anima com `requestAnimationFrame` + `performance.now()`. Deixar isso
 * no relógio real torna o teste refém da carga da máquina: com os arquivos de
 * teste rodando em paralelo, os frames chegam tarde e a asserção de fim de
 * animação estoura o prazo — verde sozinho, vermelho na suíte inteira. Aqui os
 * frames só andam quando o teste manda.
 */
function instalarRelogioDeFrames() {
  let agora = 0;
  let pendentes: FrameRequestCallback[] = [];

  vi.spyOn(performance, 'now').mockImplementation(() => agora);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => pendentes.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => {});

  /** Avança o relógio e despacha os frames que estavam na fila. */
  return function avancar(ms: number) {
    agora += ms;
    const lote = pendentes;
    pendentes = [];
    act(() => {
      lote.forEach(cb => cb(agora));
    });
  };
}

describe('AnelQ', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('anuncia o valor para leitor de tela', () => {
    render(<AnelQ value={0.85} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('85% em operação');
  });

  it('aceita rótulo próprio', () => {
    render(<AnelQ value={1} label="Marca Quality" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Marca Quality');
  });

  it('dispensa a máscara quando está cheio, depois que a animação assenta', () => {
    const avancar = instalarRelogioDeFrames();
    const { container } = render(<AnelQ value={1} />);

    avancar(700);

    expect(container.querySelector('mask')).toBeNull();
  });

  it('anima a cunha a partir de zero na montagem (spec §7.5)', () => {
    // Na montagem, a cunha começa em 0 e sobe até o alvo em 700ms ease-out —
    // então, mesmo com value=1, a máscara está presente logo após renderizar
    // (a volta de 360° ainda não fechou) e só é dispensada quando a animação
    // termina. Esse teste existe para travar a montagem animada como
    // requisito: se alguém reintroduzir um atalho que já nasce no valor
    // final (pulando a animação), a primeira asserção falha.
    const avancar = instalarRelogioDeFrames();
    const { container } = render(<AnelQ value={1} />);

    expect(container.querySelector('mask')).not.toBeNull();

    avancar(700);

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

  describe('quando o usuário prefere menos movimento', () => {
    // test/setup.ts mocka matchMedia global para matches: false (necessário
    // para o ThemeContext). Este bloco sobrescreve só para estes testes e
    // restaura no afterEach — mesmo padrão de contexts/ThemeContext.test.tsx.
    const matchMediaOriginal = window.matchMedia;

    afterEach(() => {
      window.matchMedia = matchMediaOriginal;
    });

    it('renderiza direto no valor final, sem cunha em trânsito (spec §7.5)', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: true,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });

      const { container } = render(<AnelQ value={1} />);
      // Nasce cheio de imediato — sem frame de animação necessário.
      expect(container.querySelector('mask')).toBeNull();
    });
  });
});
