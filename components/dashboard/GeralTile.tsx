import React, { useState } from 'react';
import { AnelQ } from '../brand/AnelQ';
import { Badge } from '../ui';
import type { ConsolidadoStat } from '../../lib/ilhaStats';

/**
 * A leitura consolidada, no mesmo formato dos tiles de ilha e sempre no
 * primeiro lugar do mapa.
 *
 * Repete a forma do `IlhaTile` de propósito — mesma altura fechada, mesmo
 * anel, mesma revelação no hover — porque é a mesma pergunta feita numa
 * escala acima. O que muda é só o fio da borda, na cor da marca: o card não
 * é uma ilha, e a linha diz isso sem precisar de rótulo. Também não abre
 * nada ao clique: é painel de leitura, não porta de entrada, então não
 * finge ser botão.
 */
export const GeralTile = ({ geral }: { geral: ConsolidadoStat }) => {
  const [aberto, setAberto] = useState(false);
  const semPa = !geral.paContratada;
  const pct = Math.round((geral.provimento ?? 0) * 100);
  const hot = !semPa && (geral.provimento ?? 0) < 0.8;

  return (
    <article
      tabIndex={0}
      aria-label="Geral Quality, a soma de todas as ilhas em operação"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
      onFocus={() => setAberto(true)}
      onBlur={() => setAberto(false)}
      className="bg-canvas-soft border border-brand/40 rounded-tile px-4 py-3.5
                 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-2"
    >
      <header className="pb-2 border-b border-hairline">
        <h3 className="font-display font-bold text-[15px] leading-[1.25] tracking-[-.01em] text-ink">
          GERAL QUALITY
        </h3>
        {/* a contagem de ilhas fixa o alcance da soma: com um filtro ligado
            ela cai junto, e o número deixa de poder ser lido como se fosse
            o da operação inteira */}
        <p className="text-xs text-ink-mute mt-0.5">
          {geral.ilhas} {geral.ilhas === 1 ? 'ilha' : 'ilhas'} em operação
        </p>
      </header>

      <div className="flex items-center gap-3.5 py-2">
        <AnelQ
          value={geral.provimento ?? 0}
          className={`w-[54px] h-[54px] shrink-0 ${semPa ? 'opacity-30' : ''}`}
          label={semPa ? 'sem PA Contratada cadastrada' : `${pct}% de provimento geral`}
        />
        <div>
          <div
            className={`font-display font-bold text-[26px] leading-none tracking-tight tabular-nums
                        ${semPa ? 'text-ink-faint' : hot ? 'text-brand-hot' : 'text-ink'}`}
          >
            {semPa ? '—' : `${pct}%`}
          </div>
          <div className="text-xs text-ink-mute mt-1.5">provimento geral</div>
        </div>
      </div>

      <div
        data-testid="geral-expand"
        aria-hidden={!aberto}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out
                    motion-reduce:transition-none ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 pt-3.5">
          <div className="flex gap-[18px] pb-3.5">
            <div>
              <span className="block font-display font-bold text-[16px] tracking-[-.01em] text-ink">
                {semPa ? 'sem PA' : geral.paContratada}
              </span>
              <span className="block text-[11px] text-ink-faint mt-px">PA contratada</span>
            </div>
            <div>
              <span className="block font-display font-bold text-[16px] tracking-[-.01em] text-ink">
                {geral.ativos}
              </span>
              <span className="block text-[11px] text-ink-faint mt-px">ativos</span>
            </div>
          </div>

          {geral.total === 0 ? (
            <p className="text-xs text-ink-faint">Nenhum colaborador alocado.</p>
          ) : (
            <div className="bg-canvas-sunk border border-hairline rounded-lg px-3.5 py-3">
              <p className="t-eyebrow text-ink-faint mb-2">Por status</p>
              <div className="flex flex-col gap-1.5">
                {geral.porStatus.map(s => (
                  <Badge key={s.status} status={s.status} count={s.count} className="text-xs" />
                ))}
              </div>
            </div>
          )}

          {/* sem esta linha o card mostraria um percentual redondo calculado
              sobre uma meta incompleta, sem nada avisando */}
          {geral.semPa > 0 && (
            <p className="text-[11px] text-brand-text mt-2.5 leading-snug">
              {geral.semPa === 1
                ? '1 ilha ainda sem PA definida'
                : `${geral.semPa} ilhas ainda sem PA definida`}
              {' '}— até elas entrarem, o provimento aparece mais alto do que é.
            </p>
          )}
        </div>
      </div>
    </article>
  );
};
