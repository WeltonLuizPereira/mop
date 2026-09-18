import React, { useMemo } from 'react';
import { AlertCircle, Cake, CalendarDays, Clock } from 'lucide-react';
import type { Collaborator } from '../../types';
import { doQuadro } from '../../lib/distribuicaoStats';

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const safeDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
};

interface AlertasCardProps {
  collabs: Collaborator[];
}

export const AlertasCard: React.FC<AlertasCardProps> = ({ collabs }) => {
    const quadroAtual = doQuadro(collabs);
    const hoje = startOfDay(new Date());
    const daqui15Dias = addDays(hoje, 15);

    let cntContratos = 0;
    let cntAniversariantes = 0;

    for (const c of quadroAtual) {
      // Verifica Vencimento de Experiência (45 ou 90 dias) nos próximos 15 dias
      const admData = safeDate(c.dtEntradaProduto);
      if (admData) {
        const adm = startOfDay(admData);
        const venc45 = addDays(adm, 45);
        const venc90 = addDays(adm, 90);

        const vence45Proximo = venc45.getTime() > hoje.getTime() && venc45.getTime() < daqui15Dias.getTime();
        const vence90Proximo = venc90.getTime() > hoje.getTime() && venc90.getTime() < daqui15Dias.getTime();

        if (vence45Proximo || vence90Proximo) {
          cntContratos++;
        }
      }

      // Verifica Aniversariantes do Mês
      const nascData = safeDate(c.dtNasc);
      if (nascData) {
        if (nascData.getMonth() === hoje.getMonth()) {
          cntAniversariantes++;
        }
      }
    }

    const contratosVencendo = cntContratos;
    const aniversariantes = cntAniversariantes;

  return (
    <div className="rounded-tile border border-hairline bg-canvas p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="text-ink-mute" size={18} />
        <h3 className="t-eyebrow text-ink-mute m-0 leading-none">Radar e Alertas</h3>
      </div>
      
      <div className="flex flex-col gap-3 flex-1">
        {/* Alerta de Contratos */}
        <div className="flex items-start gap-3 p-4 bg-canvas-soft border border-hairline rounded-sm">
          <div className="mt-0.5 bg-warning/10 text-warning p-1.5 rounded-full shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink leading-tight mb-1">Vencimentos de Experiência</p>
            <p className="text-[12px] text-ink-mute leading-snug">
              <span className="font-display font-bold text-ink text-base">{contratosVencendo}</span> contratos vencem nos próximos 15 dias.
            </p>
          </div>
        </div>

        {/* Alerta de Aniversariantes */}
        <div className="flex items-start gap-3 p-4 bg-canvas-soft border border-hairline rounded-sm">
          <div className="mt-0.5 bg-brand-wash text-brand p-1.5 rounded-full shrink-0">
            <Cake size={16} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink leading-tight mb-1">Aniversariantes do Mês</p>
            <p className="text-[12px] text-ink-mute leading-snug">
              Temos <span className="font-display font-bold text-ink text-base">{aniversariantes}</span> aniversariantes neste mês na operação.
            </p>
          </div>
        </div>

        {/* Dica para o usuário */}
        <div className="mt-auto pt-3 border-t border-hairline flex items-center gap-2 text-[11px] text-ink-faint">
          <CalendarDays size={12} />
          <span>Acesse o menu de RH para ver os relatórios completos.</span>
        </div>
      </div>
    </div>
  );
};
