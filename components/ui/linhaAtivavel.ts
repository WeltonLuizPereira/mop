import React from 'react';

/**
 * Props da linha que abre um detalhe. A linha inteira é o alvo — por isso
 * precisa de tabulação e de teclado: quem não usa mouse também abre.
 *
 * Enter e Espaço, os dois, porque a linha se comporta como botão e é assim
 * que um botão responde. O Espaço tem `preventDefault` para não rolar a
 * página junto.
 */
export function linhaAtivavel(aoAtivar: () => void) {
  return {
    tabIndex: 0,
    onClick: aoAtivar,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      aoAtivar();
    },
    className: 'hover:bg-canvas-soft cursor-pointer focus-visible:outline-none ' +
               'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand',
  };
}
