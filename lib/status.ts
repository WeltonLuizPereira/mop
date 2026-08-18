import { CollaboratorStatus } from '../types';

/** Marcas de acento que o `normalize('NFD')` separa da letra. */
const ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Chave de comparação: sem acento, sem caixa e sem espaço sobrando. */
function chave(valor: string) {
  return valor
    .normalize('NFD')
    .replace(ACENTOS, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const POR_CHAVE = new Map(
  Object.values(CollaboratorStatus).map(s => [chave(s), s] as const),
);

/**
 * Devolve o status canônico do sistema, ou `null` quando o valor não é um
 * status de colaborador.
 *
 * Planilha importada e cadastro antigo trazem "Ferias", "FÉRIAS " e
 * "LICENCA MATERNIDADE" para a mesma coisa. Sem normalizar, o ponto da tabela
 * cai no cinza de desconhecido enquanto o tile do mapa nem conta a pessoa —
 * e as duas telas passam a discordar sobre o mesmo colaborador.
 */
export function normalizarStatus(valor?: string | null): CollaboratorStatus | null {
  if (!valor) return null;
  return POR_CHAVE.get(chave(valor)) ?? null;
}
