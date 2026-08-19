import React, { useState, useEffect, useCallback } from 'react';
import { HistoryLog } from '../types';
import { db } from '../services/mockDb';
import { Carregando, FalhaAoCarregar, ListaVazia, Table } from '../components/ui';

export const HistoryPage: React.FC = () => {
    const [logs, setLogs] = useState<HistoryLog[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [falhou, setFalhou] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setFalhou(false);
        try {
            // a ordem vem pronta do banco; reordenar aqui só faria as duas
            // pontas discordarem sobre o que aconteceu primeiro
            setLogs(await db.getHistory());
        } catch {
            setFalhou(true);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    return (
        <div className="space-y-6">
            <Table.Card>
                <Table.Toolbar
                    contagem={{ n: logs.length, um: 'registro', varios: 'registros' }}
                />
                {carregando ? (
                    <Carregando o_que="o histórico" />
                ) : falhou ? (
                    <FalhaAoCarregar mensagem="Não foi possível carregar o histórico." aoTentar={carregar} />
                ) : logs.length === 0 ? (
                    <ListaVazia titulo="Nenhum registro no histórico">
                        Cada cadastro, alteração e exclusão aparece aqui.
                    </ListaVazia>
                ) : (
                    <Table label="Histórico de alterações">
                        <Table.Head>
                            <Table.Th className="w-32">Data/hora</Table.Th>
                            <Table.Th className="w-40">Usuário</Table.Th>
                            <Table.Th className="w-40">Ação</Table.Th>
                            <Table.Th className="w-48">Alvo</Table.Th>
                            <Table.Th>Detalhes</Table.Th>
                        </Table.Head>
                        <tbody className="divide-y divide-hairline">
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="p-4 text-xs text-ink-mute dado">{log.date}</td>
                                    <td className="p-4 font-bold text-xs">{log.user}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                            ${log.type === 'create' ? 'bg-ok/15 text-ok' :
                                              log.type === 'delete' ? 'bg-danger/15 text-danger' : 'bg-brand-wash text-brand-text'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-ink">{log.target}</td>
                                    <td className="p-4 text-xs text-ink-mute">{log.details || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Table.Card>
        </div>
    );
};
