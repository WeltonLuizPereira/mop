import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, Gift, UserMinus, X } from 'lucide-react';
import type { Collaborator, HistoryLog } from '../../types';
import { CollaboratorStatus } from '../../types';
import { db } from '../../services/mockDb';
import { formatDateString, getCollaboratorCalculations } from '../../utils';
import { EmptyState, IconButton, InlineNotice, LoadingState } from '../ui';

interface Notifications {
  birthdays: Collaborator[];
  expiring: Array<Collaborator & { vence: string }>;
  avisoEnding: Collaborator[];
  recentHistory: HistoryLog[];
}

const EMPTY_NOTIFICATIONS: Notifications = {
  birthdays: [],
  expiring: [],
  avisoEnding: [],
  recentHistory: [],
};

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notifications>(EMPTY_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const collabs = await db.getCollaborators();
      const today = new Date();
      const todayStr = today.toLocaleDateString('pt-BR');
      const day = today.getDate();
      const month = today.getMonth() + 1;

      const birthdays = collabs.filter(collaborator => {
        if (!collaborator.dtNasc || collaborator.status !== CollaboratorStatus.ATIVO) return false;
        const parts = collaborator.dtNasc.split('-');
        return parseInt(parts[2]) === day && parseInt(parts[1]) === month;
      });

      const expiring = collabs
        .filter(collaborator => {
          if (collaborator.status !== CollaboratorStatus.ATIVO) return false;
          return getCollaboratorCalculations(collaborator.dtEntradaProduto).vence === todayStr;
        })
        .map(collaborator => ({
          ...collaborator,
          vence: getCollaboratorCalculations(collaborator.dtEntradaProduto).vence,
        }));

      const avisoEnding = collabs.filter(collaborator => {
        if (collaborator.status !== CollaboratorStatus.AVISO_PREVIO || !collaborator.dataFim) return false;
        return formatDateString(collaborator.dataFim) === todayStr;
      });

      const fullHistory = await db.getHistory();
      setNotifications({ birthdays, expiring, avisoEnding, recentHistory: fullHistory.slice(0, 5) });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [close, isOpen]);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => { void loadNotifications(); }, 60_000);
    return () => window.clearInterval(interval);
  }, [isOpen, loadNotifications]);

  const totalAlerts = notifications.birthdays.length + notifications.expiring.length + notifications.avisoEnding.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notificações"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(open => !open)}
        className="relative grid h-8 w-8 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-canvas-soft hover:text-ink"
      >
        <Bell aria-hidden="true" size={17} />
        {totalAlerts > 0 && <span aria-hidden="true" className="absolute right-1 top-1 h-2 w-2 rounded-full border border-canvas bg-danger" />}
        {totalAlerts > 0 && <span className="sr-only">{totalAlerts} alertas para hoje</span>}
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className="mop-pop-in absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-hairline bg-canvas shadow-3"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas-soft px-4 py-3">
            <div>
              <h2 id={titleId} className="font-display text-sm font-bold text-ink">Central de notificações</h2>
              <span className="t-eyebrow mt-1 block text-brand-text">Hoje</span>
            </div>
            <IconButton label="Fechar notificações" icon={<X size={15} />} variant="ghost" size="sm" onClick={close} />
          </div>

          <div className="max-h-[min(70vh,36rem)] overflow-y-auto">
            {isLoading ? (
              <LoadingState label="Carregando notificações" />
            ) : hasError ? (
              <div className="p-4">
                <InlineNotice
                  tone="error"
                  action={<button type="button" className="text-xs font-semibold text-danger underline" onClick={() => void loadNotifications()}>Tentar de novo</button>}
                >
                  Não foi possível carregar as notificações.
                </InlineNotice>
              </div>
            ) : (
              <>
                {totalAlerts === 0 ? (
                  <EmptyState
                    title="Tudo em dia"
                    description="Nenhuma pendência urgente para hoje."
                    action={<CheckCircle aria-hidden="true" size={22} className="text-ok" />}
                  />
                ) : (
                  <section aria-labelledby={`${titleId}-attention`} className="p-2">
                    <h3 id={`${titleId}-attention`} className="t-eyebrow px-2 py-2 text-ink-faint">Atenção hoje</h3>
                    {notifications.avisoEnding.map(collaborator => (
                      <article key={collaborator.matricula} className="flex items-start gap-3 rounded-md bg-brand-wash p-3">
                        <UserMinus aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-brand-text" />
                        <div><h4 className="text-sm font-semibold text-ink">Aviso prévio finalizando</h4><p className="text-xs text-ink-mute">Último dia de {collaborator.nome}. Realize o desligamento no sistema.</p></div>
                      </article>
                    ))}
                    {notifications.birthdays.map(collaborator => (
                      <article key={collaborator.matricula} className="flex items-start gap-3 rounded-md p-3 hover:bg-canvas-soft">
                        <Gift aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-brand-text" />
                        <div><h4 className="text-sm font-semibold text-ink">Aniversariante do dia</h4><p className="text-xs text-ink-mute">Parabéns para {collaborator.nome}.</p></div>
                      </article>
                    ))}
                    {notifications.expiring.map(collaborator => (
                      <article key={collaborator.matricula} className="flex items-start gap-3 rounded-md bg-danger/10 p-3">
                        <AlertTriangle aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-danger" />
                        <div><h4 className="text-sm font-semibold text-ink">Contrato vencendo hoje</h4><p className="text-xs text-ink-mute">{collaborator.nome} completa o período de experiência. Ação necessária no sistema.</p></div>
                      </article>
                    ))}
                  </section>
                )}

                <section aria-labelledby={`${titleId}-history`} className="border-t border-hairline p-2">
                  <h3 id={`${titleId}-history`} className="t-eyebrow px-2 py-2 text-ink-faint">Últimas atualizações</h3>
                  {notifications.recentHistory.map(log => (
                    <article key={log.id} className="flex gap-3 rounded-md p-3 hover:bg-canvas-soft">
                      <span aria-hidden="true" className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${log.type === 'create' ? 'bg-ok' : log.type === 'delete' ? 'bg-danger' : 'bg-brand'}`} />
                      <div><p className="text-xs leading-tight text-ink"><strong>{log.user}</strong> {log.action.toLowerCase()}</p><p className="mt-1 text-[10px] text-ink-mute">{log.target} • {log.date.split(' ')[1]}</p></div>
                    </article>
                  ))}
                  {notifications.recentHistory.length === 0 && <p className="p-3 text-center text-xs text-ink-faint">Nenhum histórico recente.</p>}
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
