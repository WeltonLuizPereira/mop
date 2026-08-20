import React, { useState } from 'react';
import { AnelQ } from '../brand/AnelQ';
import { Badge } from '../ui';
import type { IlhaStat } from '../../lib/ilhaStats';

export const IlhaTile = ({ ilha, onOpen }: { ilha: IlhaStat; onOpen: () => void }) => {
  const [aberto, setAberto] = useState(false);
  const semPa = !ilha.paContratada;
  const pct = Math.round((ilha.provimento ?? 0) * 100);
  const hot = !semPa && (ilha.provimento ?? 0) < 0.8;

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
      onFocus={() => setAberto(true)}
      onBlur={() => setAberto(false)}
      className="bg-canvas-soft border border-hairline rounded-tile px-4 py-3.5 cursor-pointer
                 transition-[border-color,box-shadow,transform] duration-150
                 hover:border-hairline-2 hover:shadow-2 hover:-translate-y-px
                 motion-reduce:hover:translate-y-0"
    >
      <header className="pb-2 border-b border-hairline">
        {/* 15px é a medida do mockup: o anel e o percentual são o foco do tile,
            o nome só identifica. Nomes de ilha reais são longos e em caixa alta,
            então acima disso eles quebram em duas linhas e roubam a cena. */}
        <h3 className="font-display font-bold text-[15px] leading-[1.25] tracking-[-.01em] text-ink">
          {ilha.nome}
        </h3>
        <p className="text-xs text-ink-mute mt-0.5">{ilha.cliente} · {ilha.operacao}</p>
      </header>

      <div className="flex items-center gap-3.5 py-2">
        <AnelQ
          value={ilha.provimento ?? 0}
          className={`w-[54px] h-[54px] shrink-0 ${semPa ? 'opacity-30' : ''}`}
          label={semPa ? 'sem PA Contratada cadastrada' : `${pct}% de provimento`}
        />
        <div>
          <div
            className={`font-display font-bold text-[26px] leading-none tracking-tight tabular-nums
                        ${semPa ? 'text-ink-faint' : hot ? 'text-brand-hot' : 'text-ink'}`}
          >
            {semPa ? '—' : `${pct}%`}
          </div>
          <div className="text-xs text-ink-mute mt-1.5">provimento</div>
        </div>
      </div>

      <div
        data-testid="ilha-expand"
        aria-hidden={!aberto}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out
                    motion-reduce:transition-none ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 pt-3.5">
          <div className="flex gap-[18px] pb-3.5">
            <div>
              <span className="block font-display font-bold text-[16px] tracking-[-.01em] text-ink">
                {semPa ? 'sem PA' : ilha.paContratada}
              </span>
              <span className="block text-[11px] text-ink-faint mt-px">PA contratada</span>
            </div>
            <div>
              <span className="block font-display font-bold text-[16px] tracking-[-.01em] text-ink">
                {ilha.ativos}
              </span>
              <span className="block text-[11px] text-ink-faint mt-px">ativos</span>
            </div>
          </div>

          {ilha.total === 0 ? (
            <p className="text-xs text-ink-faint">Nenhum colaborador alocado.</p>
          ) : (
            <div className="bg-canvas-sunk border border-hairline rounded-lg px-3.5 py-3">
              <p className="t-eyebrow text-ink-faint mb-2">Por status</p>
              <div className="flex flex-col gap-1.5">
                {ilha.porStatus.map(s => (
                  <Badge key={s.status} status={s.status} count={s.count} className="text-xs" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
