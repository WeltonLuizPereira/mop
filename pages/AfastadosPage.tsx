import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Activity, User as UserIcon } from 'lucide-react';
import { Collaborator, Supervisor, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import {
  Button, Badge, Table, Carregando, FalhaAoCarregar, ListaVazia, linhaAtivavel,
} from '../components/ui';

export const AfastadosPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [falhou, setFalhou] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setFalhou(false);
        try {
            const [cs, is, ss] = await Promise.all([
                db.getCollaborators(), db.getIlhas(), db.getSupervisors(),
            ]);
            setCollabs(cs); setIlhas(is); setSupervisors(ss);
        } catch {
            setFalhou(true);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const filtered = collabs.filter(c =>
        c.status === CollaboratorStatus.AFASTADO ||
        c.status === CollaboratorStatus.LICENCA_MATERNIDADE
    );

    const countAfastado = filtered.filter(c => c.status === CollaboratorStatus.AFASTADO).length;
    const countLicenca = filtered.filter(c => c.status === CollaboratorStatus.LICENCA_MATERNIDADE).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
            </div>

            {/* termo e número: é uma ficha de contagem, e a marcação diz isso */}
            <dl aria-label="Resumo da lista" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-canvas p-4 rounded-lg border border-hairline shadow-1 flex items-center gap-4">
                    {/* a cor do cartão é a mesma do ponto do status na tabela */}
                    <div className="p-3 bg-st-afastado/15 text-st-afastado rounded-lg" aria-hidden="true"><Activity size={24} /></div>
                    <div>
                        <dt className="t-eyebrow text-ink-faint">Afastamento médico/INSS</dt>
                        <dd className="t-display-lg text-ink">{countAfastado}</dd>
                    </div>
                </div>
                 <div className="bg-canvas p-4 rounded-lg border border-hairline shadow-1 flex items-center gap-4">
                    <div className="p-3 bg-st-maternidade/15 text-st-maternidade rounded-lg" aria-hidden="true"><UserIcon size={24} /></div>
                    <div>
                        <dt className="t-eyebrow text-ink-faint">Licença maternidade</dt>
                        <dd className="t-display-lg text-ink">{countLicenca}</dd>
                    </div>
                </div>
            </dl>

            <Table.Card>
                {carregando ? (
                    <Carregando o_que="os afastamentos" />
                ) : falhou ? (
                    <FalhaAoCarregar mensagem="Não foi possível carregar os afastamentos." aoTentar={carregar} />
                ) : filtered.length === 0 ? (
                    <ListaVazia titulo="Nenhum colaborador afastado">
                        Ninguém em afastamento ou licença no momento.
                    </ListaVazia>
                ) : (
                    <Table label="Colaboradores afastados e em licença">
                        <Table.Head>
                            <Table.Th>Nome</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Data início</Table.Th>
                            <Table.Th>Ilha</Table.Th>
                            <Table.Th>Supervisor</Table.Th>
                        </Table.Head>
                        <tbody className="divide-y divide-hairline">
                            {filtered.map(c => {
                                const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                                const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                                return (
                                    <tr key={c.matricula} {...linhaAtivavel(() => onViewDetails && onViewDetails(c))}>
                                        <td className="p-4 font-medium text-ink">{c.nome}</td>
                                        <td className="p-4"><Badge status={c.status} /></td>
                                        <td className="p-4 text-ink dado">{formatDateString(c.dataAfastamento)}</td>
                                        <td className="p-4 text-xs">{ilha}</td>
                                        <td className="p-4 text-xs">{sup}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Table.Card>
        </div>
    );
}
