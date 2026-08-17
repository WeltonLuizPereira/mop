import React from 'react';
import { RING_PATH, RING_VIEWBOX, SUB_PATH, WORD_PATH } from './logoPaths';

interface LogoProps {
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * O logo mantém as cores próprias: marca registrada é isenta da exigência de
 * contraste da WCAG (1.4.3). Só a linha "Contact Center" segue o tema — no
 * arquivo original ela é branca, porque o logo foi desenhado para fundo escuro.
 */
export const Logo = ({ variant = 'mark', className = '' }: LogoProps) => {
  if (variant === 'mark') {
    return (
      <svg viewBox={RING_VIEWBOX} className={className} role="img" aria-label="Quality">
        <path d={RING_PATH} fill="#ff8705" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1024 1024" className={className} role="img" aria-label="Quality Contact Center">
      <path d={RING_PATH} fill="#ff8705" />
      <path d={WORD_PATH} fill="#f7080d" />
      {/* vetorizada como contorno; o traço fino devolve o peso sólido */}
      <path d={SUB_PATH} fill="currentColor" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
};
