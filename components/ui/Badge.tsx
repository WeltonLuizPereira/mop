import React from 'react';

export const Badge = ({ status }: { status: string }) => {
  let color = 'bg-surface-alt text-fg-muted';
  if (status === 'ATIVO' || status === 'SIM' || status === 'APROVADO') color = 'bg-success/15 text-success';
  if (status === 'DESLIGADO' || status === 'INATIVO' || status === 'REJEITADO' || status === 'NÃO') color = 'bg-error/15 text-error';
  if (status === 'FÉRIAS' || status === 'PENDENTE') color = 'bg-warning/20 text-fg';
  if (status === 'AVISO PRÉVIO') color = 'bg-warning/30 text-fg border border-warning/50';
  if (status === 'AFASTADO') color = 'bg-error/10 text-error border border-error/30';
  if (status === 'LICENÇA MATERNIDADE') color = 'bg-surface-alt text-fg-muted border border-border-strong';

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {status}
    </span>
  );
};
