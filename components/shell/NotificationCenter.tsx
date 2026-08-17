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
                className="relative p-2 rounded-full text-fg-muted hover:text-primary hover:bg-primary-tonal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Bell size={20} />
                {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
                )}
            </button>

            {isOpen && (
                <div className="mop-pop-in absolute right-0 mt-4 w-80 sm:w-96 bg-surface rounded-2xl shadow-3 border border-border z-50 overflow-hidden">
                    <div className="p-4 border-b border-border bg-surface-alt flex justify-between items-center">
                        <h3 className="font-bold text-fg text-sm">Central de Notificações</h3>
                        <span className="text-xs bg-primary-tonal text-primary px-2 py-0.5 rounded-full font-bold">Hoje</span>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {(notifications.birthdays.length > 0 || notifications.expiring.length > 0 || notifications.avisoEnding.length > 0) && (
                            <div className="p-2">
                                <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider px-2 py-1">Atenção Hoje</p>

                                {notifications.avisoEnding.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors bg-warning/10">
                                        <div className="bg-warning/20 text-fg p-2 rounded-lg">
                                            <UserMinus size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-fg">Aviso Prévio Finalizando</p>
                                            <p className="text-xs text-fg-muted">Último dia de <span className="font-semibold">{c.nome}</span>.</p>
                                            <p className="text-[10px] text-fg-muted font-medium mt-1">Realizar desligamento no sistema.</p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.birthdays.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors">
                                        <div className="bg-primary-tonal text-primary p-2 rounded-lg">
                                            <Gift size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-fg">Aniversariante do Dia!</p>
                                            <p className="text-xs text-fg-muted">Parabéns para <span className="font-semibold">{c.nome}</span></p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.expiring.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors bg-error/10">
                                        <div className="bg-error/15 text-error p-2 rounded-lg">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-fg">Contrato Vencendo Hoje</p>
                                            <p className="text-xs text-fg-muted">{c.nome} completa o período de experiência.</p>
                                            <p className="text-[10px] text-error font-medium mt-1">Ação necessária no sistema.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {notifications.birthdays.length === 0 && notifications.expiring.length === 0 && notifications.avisoEnding.length === 0 && (
                            <div className="p-6 text-center text-fg-subtle">
                                <CheckCircle className="mx-auto mb-2 text-fg-subtle" size={24} />
                                <p className="text-xs">Nenhuma pendência urgente para hoje.</p>
                            </div>
                        )}

                        <div className="w-full h-px bg-border my-1"></div>

                        <div className="p-2">
                            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider px-2 py-1">Últimas Atualizações</p>
                            {notifications.recentHistory.map(log => (
                                <div key={log.id} className="flex gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors">
                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                                        ${log.type === 'create' ? 'bg-success' :
                                          log.type === 'delete' ? 'bg-error' : 'bg-primary'}`}
                                    />
                                    <div>
                                        <p className="text-xs text-fg leading-tight">
                                            <span className="font-bold">{log.user}</span> {log.action.toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-fg-muted mt-1">{log.target} • {log.date.split(' ')[1]}</p>
                                    </div>
                                </div>
                            ))}
                             {notifications.recentHistory.length === 0 && (
                                <p className="text-xs text-fg-subtle p-3 text-center">Nenhum histórico recente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
