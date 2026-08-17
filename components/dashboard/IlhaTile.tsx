import React from 'react';
import { AnelQ } from '../brand/AnelQ';
import { Badge } from '../ui';
import type { IlhaStat } from '../../lib/ilhaStats';

export const IlhaTile = ({ ilha, onOpen }: { ilha: IlhaStat; onOpen: () => void }) => (
  <article
    tabIndex={0}
    role="button"
    onClick={onOpen}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    className="bg-canvas-soft border border-hairline rounded-tile p-[18px] cursor-pointer
               transition-[border-color,box-shadow,transform] duration-150
               hover:border-hairline-2 hover:shadow-2 hover:-translate-y-px
               motion-reduce:hover:translate-y-0"
  >
    <header className="pb-3 border-b border-hairline">
      <h3 className="t-display-md text-ink">{ilha.nome}</h3>
      <p className="text-xs text-ink-mute mt-0.5">{ilha.cliente} · {ilha.operacao}</p>
    </header>

    <div className="flex items-center gap-3.5 py-3.5">
      <AnelQ value={ilha.emOperacao} className="w-[54px] h-[54px] shrink-0" />
      <div>
        <div className="font-display font-bold text-[26px] leading-none tracking-tight tabular-nums text-ink">
          {Math.round(ilha.emOperacao * 100)}%
        </div>
        <div className="text-xs text-ink-mute mt-1.5 whitespace-nowrap">
          em operação · <span className="t-data text-ink-2">{ilha.total}</span> pessoas
        </div>
      </div>
    </div>

    {ilha.total === 0
      ? <p className="text-xs text-ink-faint">Nenhum colaborador alocado.</p>
      : (
        <div className="flex flex-wrap gap-x-3.5 gap-y-[7px]">
          {ilha.porStatus.map(s => (
            <span key={s.status} className="inline-flex items-center gap-1.5">
              <span className="t-data text-xs text-ink-2">{s.count}</span>
              <Badge status={s.status} />
            </span>
          ))}
        </div>
      )}
  </article>
);
