import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Button, Modal } from '../components/ui';

export const ResetDataPage = () => {
    const [confirmando, setConfirmando] = useState(false);
    const [apagando, setApagando] = useState(false);
    const [falhou, setFalhou] = useState(false);

    const apagar = async () => {
        setApagando(true);
        setFalhou(false);
        try {
            await db.resetDatabase();
            // só recarrega depois do sucesso: recarregar antes esconderia a
            // falha e daria a impressão de que apagou
            window.location.reload();
        } catch {
            setFalhou(true);
            setApagando(false);
        }
    };

    return (
        <section
            role="region"
            aria-label="Zona de perigo"
            className="space-y-6 animate-in fade-in duration-500 flex flex-col items-center justify-center py-16"
        >
            <div className="w-24 h-24 bg-danger/15 text-danger rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                 <AlertTriangle size={48} />
            </div>
            <h2 className="t-display-xl text-ink">Zona de perigo</h2>
            <p className="text-ink-mute max-w-md text-center">
                Esta ação irá apagar todos os dados do banco de dados e restaurar o usuário Admin padrão.
                Isso não pode ser desfeito.
            </p>
            <Button variant="danger" onClick={() => setConfirmando(true)} className="px-8 py-4 text-lg">
                Resetar todos os dados
            </Button>

            {/* o `confirm()` do navegador não dizia o que seria perdido e não
                tinha como ser verificado — a confirmação agora é do sistema */}
            <Modal
                open={confirmando}
                onClose={() => { setConfirmando(false); setFalhou(false); }}
                title="Resetar todos os dados?"
                tamanho="sm"
                rodape={
                    <>
                        <Button variant="secondary" onClick={() => { setConfirmando(false); setFalhou(false); }}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={apagar} aria-busy={apagando} disabled={apagando}>
                            {falhou ? 'Tentar novamente' : 'Sim, apagar tudo'}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-ink-2">
                    Todos os colaboradores, cadastros e histórico serão apagados, e o usuário Admin padrão
                    volta ao lugar. Não há como desfazer.
                </p>
                {falhou && (
                    <p role="alert" className="mt-4 text-sm text-danger">
                        Não foi possível apagar os dados. Nada foi alterado.
                    </p>
                )}
            </Modal>
        </section>
    );
}
