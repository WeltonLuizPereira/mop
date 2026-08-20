import React, { useEffect, useMemo, useState } from 'react';
import { EntityStatus, type Client, type Collaborator, type Ilha, type Operation, type Provimento, type User } from '../types';
import { db } from '../services/mockDb';
import { computeIlhaStats } from '../lib/ilhaStats';
import { generateId } from '../utils';
import { ChipSelect, Table, Carregando, FalhaAoCarregar } from '../components/ui';

const NOME_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function referenciaDoAnoMes(ano: number, mesIndex: number): string {
  return `${ano}-${String(mesIndex + 1).padStart(2, '0')}-01`;
}

export const ProvimentoPage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());

  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [provimento, setProvimento] = useState<Provimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);

  const referencia = referenciaDoAnoMes(ano, mes);

  const carregar = async () => {
    setCarregando(true);
    setFalhou(false);
    try {
      const [i, cli, op, col, prov] = await Promise.all([
        db.getIlhas(), db.getClients(), db.getOperations(), db.getCollaborators(),
        db.getProvimento(referencia),
      ]);
      setIlhas(i.filter(x => x.status === EntityStatus.ACTIVE));
      setClients(cli);
      setOperations(op);
      setCollabs(col);
      setProvimento(prov);
    } catch {
      setFalhou(true);
    } finally {
      setCarregando(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, [referencia]);

  const stats = useMemo(
    () => computeIlhaStats(ilhas, collabs, clients, operations, provimento),
    [ilhas, collabs, clients, operations, provimento],
  );

  const porIlha = useMemo(() => new Map(provimento.map(p => [p.ilhaId, p])), [provimento]);

  const salvar = async (ilha: Ilha, paContratada: number) => {
    const existente = porIlha.get(ilha.id);
    const item: Provimento = { id: existente?.id ?? generateId(), ilhaId: ilha.id, referencia, paContratada };
    await db.saveProvimento(item);
    await db.addHistory({
      action: 'Edição de PA Contratada',
      target: ilha.nome,
      user: currentUser.nome,
      date: new Date().toLocaleString('pt-BR'),
      type: existente ? 'update' : 'create',
      details: `PA Contratada de ${referencia.slice(0, 7)} definida em ${paContratada}`,
    });
    setProvimento(prev => [...prev.filter(p => p.ilhaId !== ilha.id), item]);
  };

  const anos = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() - i);

  if (carregando) return <Carregando o_que="o provimento" />;
  if (falhou) {
    return <FalhaAoCarregar mensagem="Não foi possível carregar o provimento." aoTentar={carregar} rotuloAcao="Tentar novamente" />;
  }

  return (
    <div className="space-y-4 mop-fade-up">
      <div className="flex items-center flex-wrap gap-3.5">
        <h2 className="t-eyebrow text-ink-faint flex-1">PA Contratada por ilha</h2>
        <ChipSelect rotulo="Mês" value={mes} onChange={e => setMes(Number(e.target.value))} aria-label="Mês de referência">
          {NOME_MES.map((nome, i) => <option key={nome} value={i}>{nome}</option>)}
        </ChipSelect>
        <ChipSelect rotulo="Ano" value={ano} onChange={e => setAno(Number(e.target.value))} aria-label="Ano de referência">
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </ChipSelect>
      </div>

      <Table.Card>
        <Table label="PA Contratada por ilha">
          <Table.Head>
            <Table.Th>Ilha</Table.Th>
            <Table.Th>Cliente / Operação</Table.Th>
            <Table.Th className="text-right">Ativos</Table.Th>
            <Table.Th className="text-right">PA Contratada</Table.Th>
          </Table.Head>
          <tbody>
            {stats.map(ilha => {
              const semDado = ilha.paContratada === null;
              return (
                <tr key={ilha.id} className={semDado ? 'bg-brand-wash' : ''}>
                  <Table.Td className="font-medium text-ink">{ilha.nome}</Table.Td>
                  <Table.Td className="text-ink-mute">{ilha.cliente} · {ilha.operacao}</Table.Td>
                  <Table.Td className="text-right t-data">{ilha.ativos}</Table.Td>
                  <Table.Td className="text-right">
                    <input
                      type="number"
                      min={0}
                      defaultValue={ilha.paContratada ?? ''}
                      aria-label={`PA Contratada de ${ilha.nome}`}
                      onBlur={e => {
                        const bruto = ilhas.find(i => i.id === ilha.id)!;
                        const valor = Number(e.target.value);
                        if (!Number.isNaN(valor) && valor >= 0) salvar(bruto, valor);
                      }}
                      className="w-20 text-right t-data rounded-sm border border-hairline-2 bg-canvas px-2 py-1
                                 focus:outline-none focus:border-brand focus:shadow-[0_0_0_1px_var(--brand)]"
                    />
                  </Table.Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Table.Card>
    </div>
  );
};
