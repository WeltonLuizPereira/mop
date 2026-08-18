import React, { useState, useEffect } from 'react';
import { HistoryLog } from '../types';
import { db } from '../services/mockDb';
import { Table } from '../components/ui';

export const HistoryPage: React.FC = () => {
    // ... same as original ...
    const [logs, setLogs] = useState<HistoryLog[]>([]);

    useEffect(() => {
        db.getHistory().then(setLogs);
    }, []);

    return (
        <div className="space-y-6">
            <Table.Card>
                <Table.Toolbar
                    contagem={{ n: logs.length, um: 'registro', varios: 'registros' }}
                />
                <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                    <thead>
                        <tr>
                            <th className="p-4 w-32">Data/Hora</th>
                            <th className="p-4 w-40">Usuário</th>
                            <th className="p-4 w-40">Ação</th>
                            <th className="p-4 w-48">Alvo</th>
                            <th className="p-4">Detalhes</th>
                        </tr>
                    </thead>
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
                        {logs.length === 0 && (
                            <tr><td colSpan={5} className="p-10 text-center text-[13px] text-ink-mute">
                                Nada registrado ainda. Cada cadastro, alteração e exclusão aparece aqui.
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </Table.Card>
        </div>
    );
};
