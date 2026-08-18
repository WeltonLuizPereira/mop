import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Button, Card, Modal, InlineNotice } from '../components/ui';

type ResetStatus = 'idle' | 'loading' | 'error';

/**
 * Zona de perigo: a única ação aqui destrói dados. `--danger`, nunca laranja
 * — laranja significa "aja aqui" e esta não é uma ação a convidar. A
 * confirmação em modal substitui o antigo `window.confirm`: exige um clique
 * deliberado num botão vermelho, com o foco inicial pousando no fechar
 * neutro do `Modal`, não no botão destrutivo.
 */
export const ResetDataPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<ResetStatus>('idle');

  const openModal = () => {
    setStatus('idle');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (status === 'loading') return;
    setModalOpen(false);
    setStatus('idle');
  };

  const confirmReset = async () => {
    setStatus('loading');
    try {
      await db.resetDatabase();
      window.location.reload();
    } catch {
      setStatus('error');
    }
  };

  const confirmLabel = status === 'error' ? 'Tentar novamente' : status === 'loading' ? 'Resetando…' : 'Sim, apagar tudo';

  return (
    <section aria-label="Zona de perigo" className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <h2 className="t-display-lg text-ink">Zona de perigo</h2>
        <p className="mt-1 text-sm text-ink-2">Ações desta área têm efeito imediato e não podem ser desfeitas.</p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-danger">
            <AlertTriangle size={24} />
          </span>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Resetar todos os dados</h3>
              <p className="mt-1 text-sm text-ink-2">
                Apaga permanentemente clientes, operações, ilhas, colaboradores, histórico e tarefas agendadas, e
                restaura o usuário Admin padrão. Essa ação não pode ser desfeita.
              </p>
            </div>
            <Button variant="solid-danger" onClick={openModal}>
              Resetar todos os dados
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Resetar todos os dados?"
        description="Isso apaga todos os dados do sistema e restaura o Admin padrão. Não pode ser desfeito."
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={status === 'loading'}>
              Cancelar
            </Button>
            <Button variant="solid-danger" onClick={confirmReset} loading={status === 'loading'}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
          <li>Clientes, operações e ilhas</li>
          <li>Colaboradores, histórico e tarefas agendadas</li>
        </ul>
        <p className="mt-3 text-sm font-semibold text-danger">
          O usuário Admin padrão é restaurado; todo o restante é perdido permanentemente.
        </p>
        {status === 'error' && (
          <div className="mt-4">
            <InlineNotice tone="error" title="Não foi possível resetar os dados">
              Verifique sua conexão e tente novamente.
            </InlineNotice>
          </div>
        )}
      </Modal>
    </section>
  );
};
