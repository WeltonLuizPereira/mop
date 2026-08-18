/** Os dois marcos da experiência, como a tela já os calcula. */
export interface Marcos {
  daysRemaining45: number;
  daysRemaining90: number;
}

/**
 * Dias até o próximo marco desta pessoa: o de 45 enquanto ele não passou,
 * o de 90 depois disso.
 *
 * Ordenar só pelo marco de 90 empurra para o fim da lista quem vence em
 * quatro dias no marco de 45 — justamente a decisão que não pode esperar.
 */
export function diasAteProximoMarco(dias45: number, dias90: number): number {
  return dias45 >= 0 ? dias45 : dias90;
}

/** Comparador da lista de contratos: quem vence antes aparece primeiro. */
export function porProximoMarco(a: Marcos, b: Marcos): number {
  return (
    diasAteProximoMarco(a.daysRemaining45, a.daysRemaining90) -
    diasAteProximoMarco(b.daysRemaining45, b.daysRemaining90)
  );
}
