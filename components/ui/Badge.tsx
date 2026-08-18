import React from 'react';
import { CollaboratorStatus, EntityStatus } from '../../types';
import { normalizarStatus } from '../../lib/status';

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

/** Plural de quem tem plural. "3 ativos", mas "3 férias" e "1 ativo". */
const PLURAL: Record<string, string> = {
  [CollaboratorStatus.ATIVO]: 'ativos',
  [CollaboratorStatus.AFASTADO]: 'afastados',
  [CollaboratorStatus.REALOCADO]: 'realocados',
  [CollaboratorStatus.DESLIGADO]: 'desligados',
};

function contar(status: string, count: number) {
  const singular = rotular(status).toLowerCase();
  return count === 1 ? singular : PLURAL[status] ?? singular;
}

interface BadgeProps {
  status: string;
  /** Quando presente, entra entre o ponto e o rótulo: "● 4 férias". */
  count?: number;
  className?: string;
}

/** Ponto + rótulo. Cor nunca carrega significado sozinha (spec §4.4). */
export const Badge = ({ status, count, className = '' }: BadgeProps) => {
  // "Ferias" gravado sem acento é o mesmo estado que "FÉRIAS": normalizar aqui
  // é o que mantém o ponto da tabela e o do tile do mapa na mesma cor
  const canonico = normalizarStatus(status) ?? status;
  return (
    <span className={`inline-flex items-center gap-[7px] text-[13px] text-ink-2 whitespace-nowrap ${className}`}>
      <span
        data-dot
        aria-hidden="true"
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: COR[canonico] ?? 'var(--st-desligado)' }}
      />
      {count !== undefined && <b className="t-data font-medium text-ink-2">{count}</b>}
      {count === undefined ? rotular(canonico) : contar(canonico, count)}
    </span>
  );
};
