import React from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import type { PontoMensal } from '../../lib/safraStats';
import { useChartTokens } from '../../lib/tokens';

/**
 * Um tooltip só para os dois painéis: quem passa o mouse em março quer saber
 * tudo de março de uma vez, não metade em cima e metade embaixo.
 */
const Balao = ({ active, payload, total }: any) => {
  if (!active || !payload?.length) return null;
  const p: PontoMensal = payload[0].payload;
  const parado = p.entraram === 0 && p.sairam === 0;

  return (
    <div className="bg-canvas border border-hairline-2 rounded-md shadow-3 px-3.5 py-3 min-w-[190px]">
      <p className="font-display font-bold text-[13px] tracking-[-.01em] text-ink">
        {p.rotuloLongo}
      </p>
      <p className="text-[11px] text-ink-faint mt-0.5 mb-2">
        {p.mesesDesdeEntrada === 0
          ? 'mês da entrada'
          : `${p.mesesDesdeEntrada} ${p.mesesDesdeEntrada === 1 ? 'mês' : 'meses'} depois da entrada`}
      </p>

      {p.entraram > 0 && <Linha cor="var(--st-ativo)" n={p.entraram} texto="entraram" />}
      {p.sairam > 0 && (
        <Linha cor="var(--st-desligado)" n={p.sairam} texto={p.sairam === 1 ? 'saiu' : 'saíram'} />
      )}
      {parado && <p className="text-[12.5px] text-ink-faint">Ninguém entrou nem saiu neste mês.</p>}

      <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-hairline text-[12.5px] text-ink-mute">
        <span className="w-2 h-2 rounded-xs shrink-0 relative -top-px" style={{ background: 'var(--brand)' }} />
        <b className="t-data font-medium text-ink text-[13px]">{p.naCasa} de {total}</b>
        na casa · {Math.round(p.retencao * 100)}%
      </div>
    </div>
  );
};

const Linha = ({ cor, n, texto }: { cor: string; n: number; texto: string }) => (
  <div className="flex items-baseline gap-2 text-[12.5px] text-ink-mute mt-1">
    <span className="w-2 h-2 rounded-xs shrink-0 relative -top-px" style={{ background: cor }} />
    <b className="t-data font-medium text-ink text-[13px]">{n}</b> {texto}
  </div>
);

/** O número em cima da barra. O zero fica de fora: um "0" em cada mês parado
 *  encheria o gráfico de ruído sem dizer nada que a barra ausente já não diga. */
const Valor = ({ x, y, width, value, cor }: any) => {
  if (!value) return null;
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 6}
      textAnchor="middle"
      fontSize={10.5}
      fontWeight={600}
      fill={cor}
      fontFamily="var(--font-data)"
    >
      {value}
    </text>
  );
};

interface Props {
  serie: PontoMensal[];
  total: number;
}

/**
 * Dois painéis empilhados sobre o mesmo eixo de meses: em cima quem entrou e
 * quem saiu, em pessoas; embaixo quanto da turma continuava na casa.
 *
 * O `syncId` é o que faz os dois responderem ao mesmo mês — sem ele o leitor
 * teria de encontrar a mesma coluna duas vezes, e a ligação entre "saíram 2" e
 * "a retenção caiu para 75%" se perderia.
 */
export const SafraGrafico = ({ serie, total }: Props) => {
  const cor = useChartTokens();
  if (serie.length === 0) return null;

  const eixo = { fontSize: 10.5, fill: cor.inkFaint, fontFamily: 'var(--font-data)' };
  const grade = { strokeDasharray: '3 3', stroke: cor.hairline, vertical: false };
  // em cima, a faixa marca a categoria das barras; embaixo, uma linha marca o
  // ponto exato da curva — dois marcadores, a mesma coluna
  const faixa = { fill: cor.brand, fillOpacity: 0.06 };
  const linha = { stroke: cor.brand, strokeWidth: 1.5, strokeOpacity: 0.45 };

  // o piso desce até o múltiplo de 25% abaixo do menor ponto: a grade cai em
  // número redondo, e não em "63%" como acontecia calculando a partir do dado
  const menor = Math.min(...serie.map(p => p.retencao));
  const piso = Math.max(0, Math.floor(menor * 4) / 4) * 100;
  const marcas: number[] = [];
  for (let v = piso; v <= 100.01; v += 25) marcas.push(Math.round(v));

  // O `syncId` sincroniza o tooltip, não só o cursor: deixar os dois painéis com
  // conteúdo faria aparecer dois balões iguais ao mesmo tempo. O de baixo fica
  // só com o cursor, para a coluna acender nos dois lugares.
  const balao = <Tooltip content={<Balao total={total} />} cursor={faixa} />;
  const soCursor = <Tooltip content={() => null} cursor={linha} />;

  return (
    <div className="border border-hairline rounded-lg bg-canvas px-5 pt-5 pb-2">
      <div className="flex items-center gap-4 flex-wrap text-[12px] text-ink-mute mb-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ background: 'var(--st-ativo)' }} />
          entraram
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ background: 'var(--st-desligado)' }} />
          saíram
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-[2.5px] rounded-full" style={{ background: 'var(--brand)' }} />
          continuavam na casa
        </span>
      </div>

      <p className="t-eyebrow text-ink-faint mt-3 mb-1">Pessoas</p>
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} syncId="safra" barGap={3} margin={{ top: 14, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...grade} />
            <XAxis dataKey="rotulo" hide />
            <YAxis axisLine={false} tickLine={false} tick={eixo} width={38} allowDecimals={false} />
            {balao}
            <Bar dataKey="entraram" name="entraram" fill={cor.stAtivo} radius={[2, 2, 0, 0]} maxBarSize={16} isAnimationActive={false}>
              <LabelList dataKey="entraram" position="top" content={<Valor cor={cor.stAtivo} />} />
            </Bar>
            <Bar dataKey="sairam" name="saíram" fill={cor.stDesligado} radius={[2, 2, 0, 0]} maxBarSize={16} isAnimationActive={false}>
              <LabelList dataKey="sairam" position="top" content={<Valor cor={cor.stDesligado} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="t-eyebrow text-ink-faint mt-4 mb-1">Na casa</p>
      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} syncId="safra" margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="safraArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cor.brand} stopOpacity={0.16} />
                <stop offset="95%" stopColor={cor.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...grade} />
            <XAxis dataKey="rotulo" axisLine={false} tickLine={false} tick={eixo} />
            <YAxis
              axisLine={false} tickLine={false} tick={eixo} width={38}
              domain={[piso, 100]} ticks={marcas} tickFormatter={v => `${v}%`}
            />
            {soCursor}
            <Area
              type="monotone"
              dataKey={(p: PontoMensal) => Math.round(p.retencao * 100)}
              name="na casa"
              stroke={cor.brand} strokeWidth={2.5}
              fill="url(#safraArea)" fillOpacity={1}
              dot={{ r: 3, fill: cor.canvas, stroke: cor.brand, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
