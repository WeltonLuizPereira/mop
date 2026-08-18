import React, { useState, useEffect, useRef } from 'react';
import { Bell, Gift, AlertTriangle, CheckCircle, UserMinus } from 'lucide-react';
import { Collaborator, CollaboratorStatus, HistoryLog } from '../../types';
import { db } from '../../services/mockDb';
import { getCollaboratorCalculations, formatDateString } from '../../utils';

export const NotificationCenter = () => {
    // ... same as original ...
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<{
        birthdays: Collaborator[],
        expiring: (Collaborator & { vence: string })[],
        avisoEnding: Collaborator[],
        recentHistory: HistoryLog[]
    }>({ birthdays: [], expiring: [], avisoEnding: [], recentHistory: [] });

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const loadNotifications = async () => {
            const collabs = await db.getCollaborators();
            const today = new Date();
            const todayStr = today.toLocaleDateString('pt-BR');
            const d = today.getDate();
            const m = today.getMonth() + 1;

            const todaysBirthdays = collabs.filter(c => {
                if (!c.dtNasc || c.status !== CollaboratorStatus.ATIVO) return false;
                const parts = c.dtNasc.split('-');
                const bDay = parseInt(parts[2]);
                const bMonth = parseInt(parts[1]);
                return bDay === d && bMonth === m;
            });

            const todaysExpiring = collabs.filter(c => {
                if (c.status !== CollaboratorStatus.ATIVO) return false;
                const calc = getCollaboratorCalculations(c.dtEntradaProduto);
                return calc.vence === todayStr;
            }).map(c => ({
                ...c,
                vence: getCollaboratorCalculations(c.dtEntradaProduto).vence
            }));

            const todaysAvisoEnding = collabs.filter(c => {
                if (c.status !== CollaboratorStatus.AVISO_PREVIO || !c.dataFim) return false;
                return formatDateString(c.dataFim) === todayStr;
            });

            const fullHistory = await db.getHistory();
            const history = fullHistory.slice(0, 5);

            setNotifications({
                birthdays: todaysBirthdays,
                expiring: todaysExpiring,
                avisoEnding: todaysAvisoEnding,
                recentHistory: history
            });
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, [isOpen]);

    const totalAlerts = notifications.birthdays.length + notifications.expiring.length + notifications.avisoEnding.length;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-ink-mute hover:text-brand-text hover:bg-brand-wash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
                <Bell size={20} />
                {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-canvas"></span>
                )}
            </button>

            {isOpen && (
                <div className="mop-pop-in absolute right-0 mt-4 w-80 sm:w-96 bg-canvas rounded-xl shadow-3 border border-hairline z-50 overflow-hidden">
                    <div className="p-4 border-b border-hairline bg-canvas-soft flex justify-between items-center">
                        <h3 className="font-bold text-ink text-sm">Central de Notificações</h3>
                        <span className="text-xs bg-brand-wash text-brand-text px-2 py-0.5 rounded-full font-bold">Hoje</span>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {(notifications.birthdays.length > 0 || notifications.expiring.length > 0 || notifications.avisoEnding.length > 0) && (
                            <div className="p-2">
                                <p className="t-eyebrow text-ink-faint px-2 py-1">Atenção Hoje</p>

                                {notifications.avisoEnding.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-canvas-soft rounded-lg transition-colors bg-brand/10">
                                        <div className="bg-brand/20 text-ink p-2 rounded-lg">
                                            <UserMinus size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ink">Aviso Prévio Finalizando</p>
                                            <p className="text-xs text-ink-mute">Último dia de <span className="font-semibold">{c.nome}</span>.</p>
                                            <p className="text-[10px] text-ink-mute font-medium mt-1">Realizar desligamento no sistema.</p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.birthdays.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-canvas-soft rounded-lg transition-colors">
                                        <div className="bg-brand-wash text-brand-text p-2 rounded-lg">
                                            <Gift size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ink">Aniversariante do Dia!</p>
                                            <p className="text-xs text-ink-mute">Parabéns para <span className="font-semibold">{c.nome}</span></p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.expiring.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-canvas-soft rounded-lg transition-colors bg-danger/10">
                                        <div className="bg-danger/15 text-danger p-2 rounded-lg">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ink">Contrato Vencendo Hoje</p>
                                            <p className="text-xs text-ink-mute">{c.nome} completa o período de experiência.</p>
                                            <p className="text-[10px] text-danger font-medium mt-1">Ação necessária no sistema.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {notifications.birthdays.length === 0 && notifications.expiring.length === 0 && notifications.avisoEnding.length === 0 && (
                            <div className="p-6 text-center text-ink-faint">
                                <CheckCircle className="mx-auto mb-2 text-ink-faint" size={24} />
                                <p className="text-xs">Nenhuma pendência urgente para hoje.</p>
                            </div>
                        )}

                        <div className="w-full h-px bg-hairline my-1"></div>

                        <div className="p-2">
                            <p className="t-eyebrow text-ink-faint px-2 py-1">Últimas Atualizações</p>
                            {notifications.recentHistory.map(log => (
                                <div key={log.id} className="flex gap-3 p-3 hover:bg-canvas-soft rounded-lg transition-colors">
                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                                        ${log.type === 'create' ? 'bg-ok' :
                                          log.type === 'delete' ? 'bg-danger' : 'bg-brand'}`}
                                    />
                                    <div>
                                        <p className="text-xs text-ink leading-tight">
                                            <span className="font-bold">{log.user}</span> {log.action.toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-ink-mute mt-1">{log.target} • {log.date.split(' ')[1]}</p>
                                    </div>
                                </div>
                            ))}
                             {notifications.recentHistory.length === 0 && (
                                <p className="text-xs text-ink-faint p-3 text-center">Nenhum histórico recente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
