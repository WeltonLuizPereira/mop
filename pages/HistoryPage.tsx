import React, { useState, useEffect } from 'react';
import { HistoryLog } from '../types';
import { db } from '../services/mockDb';

export const HistoryPage: React.FC = () => {
    // ... same as original ...
    const [logs, setLogs] = useState<HistoryLog[]>([]);

    useEffect(() => {
        db.getHistory().then(setLogs);
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Histórico de Atividades</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4 w-32">Data/Hora</th>
                            <th className="p-4 w-40">Usuário</th>
                            <th className="p-4 w-40">Ação</th>
                            <th className="p-4 w-48">Alvo</th>
                            <th className="p-4">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td className="p-4 text-xs text-gray-500">{log.date}</td>
                                <td className="p-4 font-bold text-xs">{log.user}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                        ${log.type === 'create' ? 'bg-green-100 text-green-700' :
                                          log.type === 'delete' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-800">{log.target}</td>
                                <td className="p-4 text-xs text-gray-600">{log.details || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
