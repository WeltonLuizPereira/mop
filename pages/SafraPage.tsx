import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Client, Collaborator, Ilha, Operation, Supervisor } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Badge, Button, ChipSelect, MultiSelect, Table } from '../components/ui';
import { SafraCurva } from '../components/dashboard/SafraCurva';
import {
  computeSafras, curvaSobrevivencia, IDADE_JOVEM, type Safra, type Turma,
} from '../lib/safraStats';

/** Quantos ficaram e quantos saíram, na mesma barra e nas cores de status. */
const Balanco = ({ ficaram, sairam, total, largo = false }: {
  ficaram: number; sairam: number; total: number; largo?: boolean;
}) => {
  const pct = total === 0 ? 0 : Math.round((ficaram / total) * 100);
  return (
    <div className={`flex items-center gap-3 ${largo ? '' : 'min-w-[240px]'}`}>
      <span className="font-display font-bold text-[17px] tracking-[-.02em] tabular-nums text-ink w-11 text-right">
        {pct}%
      </span>
      <div className="flex-1">
        {/* a trilha é a cor de desligado e o preenchimento a de ativo: a barra
            é a própria leitura de status da safra, não uma cor decorativa */}
        <div className="h-[7px] rounded-full overflow-hidden" style={{ background: 'var(--st-desligado)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--st-ativo)' }} />
        </div>
        <div className="flex gap-3 mt-1.5 text-[11.5px] text-ink-mute">
          <span>
            <span className="inline-block w-[7px] h-[7px] rounded-xs mr-1.5" style={{ background: 'var(--st-ativo)' }} />
            <b className="t-data font-medium text-ink-2">{ficaram}</b> ficaram
          </span>
          <span>
            <span className="inline-block w-[7px] h-[7px] rounded-xs mr-1.5" style={{ background: 'var(--st-desligado)' }} />
            <b className="t-data font-medium text-ink-2">{sairam}</b> saíram
          </span>
        </div>
      </div>
    </div>
  );
};

const TurmaCard = ({ turma }: { turma: Turma }) => (
  <section className="border border-hairline rounded-lg bg-canvas overflow-hidden">
    <header className="p-[18px] border-b border-hairline">
      <h3 className="t-display-md text-ink">Turma de {formatDateString(turma.data)}</h3>
      <p className="text-xs text-ink-mute mt-0.5">
        {turma.pessoas.length} {turma.pessoas.length === 1 ? 'pessoa entrou' : 'pessoas entraram'}
      </p>
      <div className="mt-3.5">
        <Balanco ficaram={turma.ficaram} sairam={turma.sairam} total={turma.pessoas.length} largo />
      </div>
    </header>
    <table className="w-full border-collapse">
      <tbody>
        {turma.pessoas.map(p => (
          <tr key={p.colaborador.matricula} className="border-t border-hairline hover:bg-canvas-soft">
            <td className="px-[18px] py-2.5">
              <span className="block font-medium text-ink text-[13px] leading-tight">{p.colaborador.nome}</span>
              <span className="block t-data text-[11px] text-ink-faint mt-px">{p.colaborador.matricula}</span>
            </td>
            <td className="px-2 py-2.5"><Badge status={p.colaborador.status} /></td>
            <td className="px-[18px] py-2.5 text-right whitespace-nowrap">
              {p.diasAteSair === null
                ? <span className="text-ink-faint text-[13px]">—</span>
                : <span className="t-data font-medium text-[13px] text-ink-2">{p.diasAteSair} dias</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

const Detalhe = ({ safra, onVoltar }: { safra: Safra; onVoltar: () => void }) => {
  const curva = useMemo(() => curvaSobrevivencia(safra), [safra]);
  const queda = useMemo(() => {
    // o mês em que a safra mais perdeu gente — a frase abaixo do gráfico
    let pior = 0;
    let maior = 0;
    for (let i = 1; i < curva.length; i++) {
      const perda = curva[i - 1].restantes - curva[i].restantes;
      if (perda > maior) { maior = perda; pior = i; }
    }
    return { mes: pior, perda: maior };
  }, [curva]);

  return (
    <div className="space-y-8">
      <Button variant="secondary" onClick={onVoltar}><ArrowLeft size={16} /> Todas as safras</Button>

      <section className="pb-8 border-b border-hairline">
        <span className="t-eyebrow text-ink-faint">
          Safra · {safra.rotulo.toLowerCase()} ·{' '}
          {safra.idadeMeses === 0
            ? 'entrou este mês'
            : `${safra.idadeMeses} ${safra.idadeMeses === 1 ? 'mês' : 'meses'} de vida`}
        </span>

        <div className="font-display font-bold text-[56px] leading-none tracking-[-.03em] tabular-nums text-ink mt-3">
          {Math.round(safra.retencao * 100)}<span className="text-ink-mute text-[30px]">%</span>
        </div>
        <p className="text-sm text-ink-mute mt-2.5">da safra continua na casa</p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 mt-6">
          {([['entraram', safra.entraram],
             [safra.turmas.length === 1 ? 'turma' : 'turmas', safra.turmas.length],
             ['ficaram', safra.ficaram],
             ['saíram', safra.sairam],
             ['dias em média até sair', safra.diasMedios ?? '—']] as const)
            .map(([rotulo, valor], i) => (
              <React.Fragment key={rotulo}>
                {i > 0 && <div className="w-px h-4 bg-hairline-2" aria-hidden="true" />}
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-[21px] tracking-tight tabular-nums text-ink">{valor}</span>
                  <span className="text-[13px] text-ink-mute">{rotulo}</span>
                </div>
              </React.Fragment>
            ))}
        </div>

        {safra.semData > 0 && (
          <p className="text-xs text-ink-mute mt-4">
            <b className="text-ink-2 font-semibold">
              {safra.semData} {safra.semData === 1 ? 'saída está' : 'saídas estão'} sem data no cadastro
            </b>{' '}
            — {safra.semData === 1 ? 'ela conta' : 'elas contam'} como perdida
            {safra.semData === 1 ? '' : 's'}, mas fica{safra.semData === 1 ? '' : 'm'} fora da média e da curva.
          </p>
        )}
      </section>

      {curva.length > 1 && (
        <section>
          <h2 className="t-eyebrow text-ink-faint mb-4">Quando a safra perdeu gente</h2>
          <div className="border border-hairline rounded-lg bg-canvas p-5">
            <SafraCurva pontos={curva} />
            <p className="text-xs text-ink-mute mt-2">
              {queda.perda === 0
                ? 'A safra não perdeu ninguém com data registrada até aqui.'
                : `A maior perda foi no ${queda.mes}º mês depois da entrada: ${queda.perda} ${queda.perda === 1 ? 'pessoa' : 'pessoas'}.`}
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className="t-eyebrow text-ink-faint mb-4">
          {safra.turmas.length === 1 ? 'A turma' : `As ${safra.turmas.length} turmas`}
        </h2>
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
          {safra.turmas.map(t => <TurmaCard key={t.data} turma={t} />)}
        </div>
      </section>
    </div>
  );
};

export const SafraPage = () => {
  const hoje = new Date();
  const [colabs, setColabs] = useState<Collaborator[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [ano, setAno] = useState(hoje.getFullYear());
  const [filterClient, setFilterClient] = useState<string[]>([]);
  const [filterOp, setFilterOp] = useState<string[]>([]);
  const [filterIlha, setFilterIlha] = useState<string[]>([]);
  const [filterSup, setFilterSup] = useState<string[]>([]);
  const [aberta, setAberta] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const [c, cli, op, il, sup] = await Promise.all([
        db.getCollaborators(), db.getClients(), db.getOperations(),
        db.getIlhas(), db.getSupervisors(),
      ]);
      setColabs(c);
      setClients(cli.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      setOperations(op.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      setIlhas(il.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      setSupervisors(sup.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      setCarregando(false);
    };
    load();
  }, []);

  const recortados = colabs.filter(c =>
    (filterClient.length === 0 || filterClient.includes(c.clientId)) &&
    (filterOp.length === 0 || filterOp.includes(c.operationId)) &&
    (filterIlha.length === 0 || filterIlha.includes(c.ilhaId)) &&
    (filterSup.length === 0 || filterSup.includes(c.supervisorId)));

  const safras = useMemo(
    () => computeSafras(recortados, ano),
    [recortados, ano],
  );

  const filtrosAtivos = filterClient.length + filterOp.length + filterIlha.length + filterSup.length;
  const limparFiltros = () => {
    setFilterClient([]); setFilterOp([]); setFilterIlha([]); setFilterSup([]);
  };

  const anos = Array.from({ length: 6 }, (_, i) => hoje.getFullYear() - i);
  const pessoas = safras.reduce((s, x) => s + x.entraram, 0);
  const semData = safras.reduce((s, x) => s + x.semData, 0);

  if (carregando) {
    return <p className="text-sm text-ink-mute py-20 text-center">Carregando as safras…</p>;
  }

  const detalhe = aberta === null ? null : safras.find(s => s.mes === aberta);
  if (detalhe) return <Detalhe safra={detalhe} onVoltar={() => setAberta(null)} />;

  return (
    <Table.Card>
      <Table.Toolbar
        contagem={{ n: safras.length, um: 'safra', varios: 'safras' }}
        filtrosAtivos={filtrosAtivos}
        aoLimparFiltros={limparFiltros}
        chips={
          <ChipSelect rotulo="Ano" value={ano} onChange={e => setAno(Number(e.target.value))}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </ChipSelect>
        }
        acoes={
          <span className="text-[13px] text-ink-mute whitespace-nowrap">
            <span className="t-data text-ink-2">{pessoas}</span> pessoas
          </span>
        }
        filtros={<>
          <MultiSelect
            label="Cliente" value={filterClient} onChange={setFilterClient}
            options={clients.map(c => ({ value: c.id, label: c.nome }))}
          />
          <MultiSelect
            label="Operação" value={filterOp} onChange={setFilterOp}
            options={operations
              .filter(o => filterClient.length === 0 || filterClient.includes(o.clientId))
              .map(o => ({ value: o.id, label: o.nome }))}
          />
          <MultiSelect
            label="Ilha" value={filterIlha} onChange={setFilterIlha}
            options={ilhas
              .filter(i => (filterClient.length === 0 || filterClient.includes(i.clientId))
                && (filterOp.length === 0 || filterOp.includes(i.operationId)))
              .map(i => ({ value: i.id, label: i.nome }))}
          />
          <MultiSelect
            label="Supervisor" value={filterSup} onChange={setFilterSup}
            options={supervisors.map(s => ({ value: s.id, label: s.nome }))}
          />
        </>}
      />

      {safras.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink-mute">
          Ninguém entrou em {ano} nesse recorte. Escolha outro ano ou limpe os filtros.
        </p>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Th>Safra</Table.Th>
              <Table.Th className="num">Entraram</Table.Th>
              <Table.Th className="num">Turmas</Table.Th>
              <Table.Th>O que aconteceu</Table.Th>
              <Table.Th>Tempo até sair</Table.Th>
              <Table.Th />
            </Table.Head>
            <tbody>
              {safras.map(s => (
                <tr key={s.mes} className="hover:bg-canvas-soft">
                  <Table.Td>
                    <span className="block font-display font-bold text-sm tracking-[-.01em] text-ink">
                      {s.rotulo.replace(` de ${s.ano}`, '')}
                    </span>
                    <span className="block text-[11px] text-ink-faint mt-px">
                      {s.idadeMeses === 0
                        ? 'entrou este mês'
                        : `${s.idadeMeses} ${s.idadeMeses === 1 ? 'mês' : 'meses'} de vida`}
                    </span>
                    {/* sem este aviso, a safra recém-entrada aparece com 100%
                        de retenção e parece a melhor do ano */}
                    {s.idadeMeses < IDADE_JOVEM && (
                      <span className="inline-block t-eyebrow text-brand-text bg-brand-wash rounded-xs px-1.5 py-[3px] mt-1">
                        Safra jovem
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="num">{s.entraram}</Table.Td>
                  <Table.Td className="num">{s.turmas.length}</Table.Td>
                  <Table.Td>
                    <Balanco ficaram={s.ficaram} sairam={s.sairam} total={s.entraram} />
                  </Table.Td>
                  <Table.Td>
                    {s.diasMedios === null
                      ? <span className="text-ink-faint">— ninguém saiu</span>
                      : <>
                          <span className="t-data font-medium text-ink-2">{s.diasMedios} dias</span>{' '}
                          {/* a média sobre 2 saídas não vale o mesmo que sobre 200 */}
                          <span className="text-[11px] text-ink-faint">
                            em {s.baseMedia} {s.baseMedia === 1 ? 'saída' : 'saídas'}
                          </span>
                        </>}
                  </Table.Td>
                  <Table.Td className="text-right">
                    <Button variant="ghost" onClick={() => setAberta(s.mes)}>
                      Ver turmas
                    </Button>
                  </Table.Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {semData > 0 && (
            <p className="px-4 py-3 border-t border-hairline bg-canvas-sunk text-xs text-ink-mute">
              <b className="text-ink-2 font-semibold">
                {semData} {semData === 1 ? 'pessoa desligada está' : 'pessoas desligadas estão'} sem data de saída
              </b>{' '}
              no cadastro. {semData === 1 ? 'Ela conta' : 'Elas contam'} como
              perdida{semData === 1 ? '' : 's'}, mas fica{semData === 1 ? '' : 'm'} fora
              do tempo médio — não dá para medir o que não tem data.
            </p>
          )}
        </>
      )}
    </Table.Card>
  );
};
