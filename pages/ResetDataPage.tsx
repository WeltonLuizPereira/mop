import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Button } from '../components/ui';

export const ResetDataPage = () => {
    const handleReset = async () => {
        if(confirm("ATENÇÃO: Isso apagará TODOS os dados! Continuar?")) {
            await db.resetDatabase();
            window.location.reload();
        }
    }
    return (
        <div className="space-y-6 animate-in fade-in duration-500 flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                 <AlertTriangle size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Zona de Perigo</h2>
            <p className="text-gray-500 max-w-md text-center">
                Esta ação irá apagar todos os dados do banco de dados e restaurar o usuário Admin padrão.
                Isso não pode ser desfeito.
            </p>
            <Button variant="danger" onClick={handleReset} className="px-8 py-4 text-lg">
                RESETAR SISTEMA COMPLETO
            </Button>
        </div>
    );
}
