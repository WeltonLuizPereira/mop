import type { Ilha, Provimento } from '../types';

/** Referência do mês de uma data, sempre no dia 1: "2026-08-01". */
export function referenciaDoMes(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}-01`;
}

/**
 * Decide, para o mês vigente, quais ilhas ativas ainda não têm uma linha de
 * PA Contratada e com que valor cadastrá-las.
 *
 * Copia sempre da referência mais recente que existir para aquela ilha —
 * não necessariamente o mês calendário anterior — para não deixar a ilha
 * sem PA só porque o ADM pulou um mês sem editar. Ilha sem nenhum
 * histórico entra com 0, para o ADM preencher.
 */
export function provimentoParaAutoCadastro(
  ilhasAtivas: Ilha[],
  provimentoExistente: Provimento[],
  referenciaAtual: string,
): Array<{ ilhaId: string; paContratada: number }> {
  const jaTemNoMes = new Set(
    provimentoExistente
      .filter(p => p.referencia === referenciaAtual)
      .map(p => p.ilhaId),
  );

  const ultimaPorIlha = new Map<string, Provimento>();
  for (const p of provimentoExistente) {
    if (p.referencia >= referenciaAtual) continue; // só o passado conta como "última referência"
    const atual = ultimaPorIlha.get(p.ilhaId);
    if (!atual || p.referencia > atual.referencia) ultimaPorIlha.set(p.ilhaId, p);
  }

  return ilhasAtivas
    .filter(i => !jaTemNoMes.has(i.id))
    .map(i => ({ ilhaId: i.id, paContratada: ultimaPorIlha.get(i.id)?.paContratada ?? 0 }));
}
