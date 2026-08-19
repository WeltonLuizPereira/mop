import { useEffect, useState } from 'react';

/** Tokens que o Recharts precisa receber como valor, não como classe. */
export interface ChartTokens {
  brand: string;
  brandHot: string;
  ok: string;
  danger: string;
  hairline: string;
  canvas: string;
  ink2: string;
  inkFaint: string;
  stAtivo: string;
  stDesligado: string;
}

const NOMES: Record<keyof ChartTokens, string> = {
  brand:     '--brand',
  brandHot:  '--brand-hot',
  ok:        '--ok',
  danger:    '--danger',
  hairline:  '--hairline',
  canvas:    '--canvas',
  ink2:      '--ink-2',
  inkFaint:  '--ink-faint',
  stAtivo:      '--st-ativo',
  stDesligado:  '--st-desligado',
};

/** Valores do tema claro: o que vale antes da primeira leitura e no jsdom,
 *  onde `getComputedStyle` não resolve custom properties herdadas. */
const PADRAO: ChartTokens = {
  brand: '#F27405', brandHot: '#F54E00', ok: '#12794F', danger: '#DE2E50',
  hairline: '#E4E4E4', canvas: '#FFFFFF', ink2: '#453C38', inkFaint: '#9A918C',
  stAtivo: '#12794F', stDesligado: '#7A0B22',
};

function ler(): ChartTokens {
  const estilo = getComputedStyle(document.documentElement);
  const lido = {} as ChartTokens;
  (Object.keys(NOMES) as (keyof ChartTokens)[]).forEach(chave => {
    lido[chave] = estilo.getPropertyValue(NOMES[chave]).trim() || PADRAO[chave];
  });
  return lido;
}

/**
 * Relê a paleta a cada troca de tema, observando a classe do `<html>` em vez de
 * pedir o contexto de tema.
 *
 * O gráfico precisa só do sinal de que o tema mudou, e amarrá-lo ao
 * `ThemeProvider` fazia qualquer tela com gráfico quebrar fora do provider —
 * um gráfico não deve derrubar a página por causa de onde foi montado.
 */
export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(PADRAO);

  useEffect(() => {
    setTokens(ler());

    const observador = new MutationObserver(() => setTokens(ler()));
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observador.disconnect();
  }, []);

  return tokens;
}
