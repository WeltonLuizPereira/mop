import React, { useMemo } from 'react';
import { TrendingUp, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Collaborator } from '../../types';
import { doQuadro } from '../../lib/distribuicaoStats';
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const safeDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
};

interface SaudeOperacaoCardProps {
  collabs: Collaborator[];
}

export const SaudeOperacaoCard: React.FC<SaudeOperacaoCardProps> = ({ collabs }) => {
    const hoje = new Date();
    const start = startOfMonth(hoje);
    const end = endOfMonth(hoje);

    // --- Turnover do Mês Atual ---
    const admissions = collabs.filter(c => {
      const adm = safeDate(c.dtEntradaProduto);
      return adm && adm >= start && adm <= end;
    });
    const terminations = collabs.filter(c => {
      const deslig = safeDate(c.dataFim);
      return deslig && deslig >= start && deslig <= end;
    });
    
    const activeStart = collabs.filter(c => {
      const admissionDate = safeDate(c.dtEntradaProduto);
      if (!admissionDate) return false;
      const terminationDate = safeDate(c.dataFim);
      return admissionDate < start && (!terminationDate || terminationDate >= start);
    }).length;

    const activeEnd = collabs.filter(c => {
      const admissionDate = safeDate(c.dtEntradaProduto);
      if (!admissionDate) return false;
      const terminationDate = safeDate(c.dataFim);
      return admissionDate <= end && (!terminationDate || terminationDate > end);
    }).length;

    const avgHeadcount = (activeStart + activeEnd) / 2 || 1;
    const turnover = (((admissions.length + terminations.length) / 2) / avgHeadcount) * 100;

    // --- Safra Simplificada (Apenas quadro ativo atual) ---
    const quadroAtual = doQuadro(collabs);
    const msPorDia = 1000 * 60 * 60 * 24;
    
    let cntNovatos = 0; // < 90 dias
    let cntVeteranos = 0; // >= 365 dias
    
    for (const c of quadroAtual) {
      const adm = safeDate(c.dtEntradaProduto);
      if (!adm) continue;
      
      const dias = (hoje.getTime() - adm.getTime()) / msPorDia;
      
      if (dias < 90) cntNovatos++;
      if (dias >= 365) cntVeteranos++;
    }

    const turnoverRate = turnover;
    const quadroBase = quadroAtual.length;
    const novatos = cntNovatos;
    const veteranos = cntVeteranos;

  const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const fmtTurnover = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pctNovatos = quadroBase === 0 ? 0 : (novatos / quadroBase) * 100;
  const pctVeteranos = quadroBase === 0 ? 0 : (veteranos / quadroBase) * 100;

  return (
    <div className="rounded-tile border border-hairline bg-canvas p-5 shadow-sm flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-ink-mute" strokeWidth={2} />
        <h3 className="font-sans text-xs font-semibold tracking-wider text-ink-mute uppercase">
          Saúde da Operação
        </h3>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 gap-6">
        {/* ROW 1: Turnover */}
        <div className="pb-5 border-b border-hairline">
          <div className="flex items-end justify-between">
            <p className="font-sans text-sm font-medium text-ink">Turnover do Mês</p>
            <span className="font-display font-bold text-2xl tracking-tight text-ink leading-none">
              {fmtTurnover.format(turnoverRate)}%
            </span>
          </div>
          <div className="w-full bg-canvas-soft rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full ${turnoverRate > 5 ? 'bg-danger' : 'bg-brand'}`} 
              style={{ width: `${Math.min(turnoverRate, 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-ink-faint mt-1.5">
            {turnoverRate > 5 ? 'Atenção: índice elevado no período' : 'Índice dentro da normalidade'}
          </p>
        </div>

        <div className="flex-1 bg-canvas-soft border border-hairline rounded-sm p-4 relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-3">
            <Sprout size={14} className="text-brand" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">Curva de Safra</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-ink-faint mb-1">Curva de Risco (&lt; 90 dias)</p>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xl leading-none text-ink">{fmt.format(pctNovatos)}%</span>
                <AlertCircle size={14} className="text-brand" />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-ink-faint mb-1">Estabilizados (&gt; 1 ano)</p>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xl leading-none text-ink">{fmt.format(pctVeteranos)}%</span>
                <CheckCircle2 size={14} className="text-ok" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
