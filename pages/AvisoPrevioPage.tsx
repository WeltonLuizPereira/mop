import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Collaborator, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, getInitials } from '../utils';
import { Button, Badge } from '../components/ui';

export const AvisoPrevioPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [today] = useState(new Date());

    useEffect(() => { 
        const load = async () => {
            setCollabs(await db.getCollaborators());
        };
        load();
    }, []);

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
            
            <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
                <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                     <thead>
                         <tr>
                             <th className="p-4 w-16"></th>
                             <th className="p-4">Nome</th>
                             <th className="p-4">Data Final</th>
                             <th className="p-4">Dias Restantes</th>
                             <th className="p-4">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-hairline">
                         {filtered.map(c => (
                             <tr key={c.matricula} className="hover:bg-canvas-soft cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                 <td className="p-4">
                                     <div className="w-9 h-9 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-xs">
                                         {getInitials(c.nome)}
                                     </div>
                                 </td>
                                 <td className="p-4 font-medium text-ink">{c.nome}</td>
                                 <td className="p-4 text-ink dado">{formatDateString(c.dataFim)}</td>
                                 <td className="p-4">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                                         c.daysLeft <= 5 ? 'bg-danger/15 text-danger' : 
                                         c.daysLeft <= 15 ? 'bg-brand-wash text-brand-text' : 'bg-brand-wash text-brand-text'
                                     }`}>
                                         {c.daysLeft} dias
                                     </span>
                                 </td>
                                 <td className="p-4"><Badge status={c.status} /></td>
                             </tr>
                         ))}
                         {filtered.length === 0 && (
                             <tr>
                                 <td colSpan={5} className="p-8 text-center text-ink-faint">
                                     <CheckCircle className="mx-auto mb-2 opacity-50" size={24}/>
                                     Nenhum colaborador em aviso prévio no momento.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
            </div>
        </div>
    );
}

