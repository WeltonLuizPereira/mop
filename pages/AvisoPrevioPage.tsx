import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Collaborator, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import {
  Button, Badge, Table, Carregando, FalhaAoCarregar, ListaVazia, linhaAtivavel,
} from '../components/ui';

export const AvisoPrevioPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [falhou, setFalhou] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setFalhou(false);
        try {
            setCollabs(await db.getCollaborators());
        } catch {
            setFalhou(true);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const filtered = collabs.filter(c => c.status === CollaboratorStatus.AVISO_PREVIO).map(c => {
        let daysLeft = 0;
        if(c.dataFim) {
            const parts = c.dataFim.split('-');
            const endDate = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
            const now = new Date(); now.setHours(0,0,0,0);
            const diffTime = endDate.getTime() - now.getTime();
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return { ...c, daysLeft };
    }).sort((a,b) => a.daysLeft - b.daysLeft);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
            </div>

            <Table.Card>
                <Table.Toolbar
                    contagem={{ n: filtered.length, um: 'em aviso prévio', varios: 'em aviso prévio' }}
                />
                {carregando ? (
                    <Carregando o_que="os avisos prévios" />
                ) : falhou ? (
                    <FalhaAoCarregar mensagem="Não foi possível carregar os avisos prévios." aoTentar={carregar} />
                ) : filtered.length === 0 ? (
                    <ListaVazia titulo="Nenhum colaborador em aviso prévio">
                        Nada a acompanhar por aqui no momento.
                    </ListaVazia>
                ) : (
                    <Table label="Colaboradores em aviso prévio">
                        <Table.Head>
                            <Table.Th>Nome</Table.Th>
                            <Table.Th>Data final</Table.Th>
                            <Table.Th>Dias restantes</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Head>
                        <tbody className="divide-y divide-hairline">
                            {filtered.map(c => (
                                <tr key={c.matricula} {...linhaAtivavel(() => onViewDetails && onViewDetails(c))}>
                                    {/* o nome e a identidade da linha: a bolinha de iniciais
                                        so repetia a primeira letra e empurrava a data para longe */}
                                    <td className="p-4 font-medium text-ink">{c.nome}</td>
                                    <td className="p-4 text-ink dado">{formatDateString(c.dataFim)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            c.daysLeft <= 5 ? 'bg-danger/15 text-danger' : 'bg-brand-wash text-brand-text'
                                        }`}>
                                            {c.daysLeft} dias
                                        </span>
                                    </td>
                                    <td className="p-4"><Badge status={c.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Table.Card>
        </div>
    );
}
