import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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
};

/** Valores do tema claro: o que vale antes da primeira leitura e no jsdom,
 *  onde `getComputedStyle` não resolve custom properties herdadas. */
const PADRAO: ChartTokens = {
  brand: '#F27405', brandHot: '#F54E00', ok: '#12794F', danger: '#C4183C',
  hairline: '#E4E4E4', canvas: '#FFFFFF', ink2: '#453C38', inkFaint: '#9A918C',
};

function ler(): ChartTokens {
  const estilo = getComputedStyle(document.documentElement);
  const lido = {} as ChartTokens;
  (Object.keys(NOMES) as (keyof ChartTokens)[]).forEach(chave => {
    lido[chave] = estilo.getPropertyValue(NOMES[chave]).trim() || PADRAO[chave];
  });
  return lido;
}

/** Relê a paleta a cada troca de tema — o gráfico acompanha claro/escuro
 *  sem repetir nenhum valor de cor dentro da página. */
export function useChartTokens(): ChartTokens {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState<ChartTokens>(PADRAO);

  useEffect(() => {
    setTokens(ler());
  }, [theme]);

  return tokens;
}
