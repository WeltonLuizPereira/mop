import React from 'react';
import { CollaboratorStatus, EntityStatus } from '../../types';

const COR: Record<string, string> = {
  [CollaboratorStatus.ATIVO]: 'var(--st-ativo)',
  [CollaboratorStatus.FERIAS]: 'var(--st-ferias)',
  [CollaboratorStatus.AFASTADO]: 'var(--st-afastado)',
  [CollaboratorStatus.LICENCA_MATERNIDADE]: 'var(--st-maternidade)',
  [CollaboratorStatus.AVISO_PREVIO]: 'var(--st-aviso)',
  [CollaboratorStatus.REALOCADO]: 'var(--st-realocado)',
  [CollaboratorStatus.DESLIGADO]: 'var(--st-desligado)',
  [EntityStatus.INACTIVE]: 'var(--st-desligado)',
};

/** Rótulo em caixa de frase: "Aviso prévio", não "AVISO PRÉVIO". */
function rotular(status: string) {
  const s = status.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Ponto + rótulo. Cor nunca carrega significado sozinha (spec §4.4). */
export const Badge = ({ status }: { status: string }) => (
  <span className="inline-flex items-center gap-[7px] text-[13px] text-ink-2 whitespace-nowrap">
    <span
      data-dot
      aria-hidden="true"
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: COR[status] ?? 'var(--st-desligado)' }}
    />
    {rotular(status)}
  </span>
);
