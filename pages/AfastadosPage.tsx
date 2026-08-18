import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, User as UserIcon, CheckCircle, Eye } from 'lucide-react';
import { Collaborator, Supervisor, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, getInitials } from '../utils';
import { Button, Badge, Table } from '../components/ui';

export const AfastadosPage = ({ onBack, onViewDetails }: any) => {
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

    useEffect(() => {
        const load = async () => {
            setCollabs(await db.getCollaborators());
            setIlhas(await db.getIlhas());
            setSupervisors(await db.getSupervisors());
        }
        load();
    }, []);

    const filtered = collabs.filter(c =>
        c.status === CollaboratorStatus.AFASTADO ||
        c.status === CollaboratorStatus.LICENCA_MATERNIDADE
    );

    const countAfastado = filtered.filter(c => c.status === CollaboratorStatus.AFASTADO).length;
    const countLicenca = filtered.filter(c => c.status === CollaboratorStatus.LICENCA_MATERNIDADE).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-canvas p-4 rounded-lg border border-hairline shadow-1 flex items-center gap-4">
                    {/* a cor do cartão é a mesma do ponto do status na tabela */}
                    <div className="p-3 bg-st-afastado/15 text-st-afastado rounded-lg"><Activity size={24} /></div>
                    <div>
                        <p className="t-eyebrow text-ink-faint">Afastamento médico/INSS</p>
                        <h3 className="t-display-lg text-ink">{countAfastado}</h3>
                    </div>
                </div>
                 <div className="bg-canvas p-4 rounded-lg border border-hairline shadow-1 flex items-center gap-4">
                    <div className="p-3 bg-st-maternidade/15 text-st-maternidade rounded-lg"><UserIcon size={24} /></div>
                    <div>
                        <p className="t-eyebrow text-ink-faint">Licença maternidade</p>
                        <h3 className="t-display-lg text-ink">{countLicenca}</h3>
                    </div>
                </div>
            </div>

            <Table.Card>
                <Table.Toolbar
                    contagem={{ n: filtered.length, um: 'pessoa afastada', varios: 'pessoas afastadas' }}
                />
                <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                     <thead>
                         <tr>
                             <th className="p-4 w-16"></th>
                             <th className="p-4">Nome</th>
                             <th className="p-4">Status</th>
                             <th className="p-4">Data Início</th>
                             <th className="p-4">Ilha</th>
                             <th className="p-4">Supervisor</th>
                             <th className="p-4 text-right">Ações</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-hairline">
                         {filtered.map(c => {
                             const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                             const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                             return (
                                 <tr key={c.matricula} className="hover:bg-canvas-soft cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                     <td className="p-4">
                                         <div className="w-9 h-9 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-xs">
                                             {getInitials(c.nome)}
                                         </div>
                                     </td>
                                     <td className="p-4 font-medium text-ink">{c.nome}</td>
                                     <td className="p-4"><Badge status={c.status} /></td>
                                     <td className="p-4 text-ink dado">{formatDateString(c.dataAfastamento)}</td>
                                     <td className="p-4 text-xs">{ilha}</td>
                                     <td className="p-4 text-xs">{sup}</td>
                                     <td className="p-4 text-right">
                                        <Button variant="ghost"><Eye size={16}/></Button>
                                     </td>
                                 </tr>
                             );
                         })}
                          {filtered.length === 0 && (
                             <tr>
                                 <td colSpan={7} className="p-8 text-center text-ink-faint">
                                     <CheckCircle className="mx-auto mb-2 opacity-50" size={24}/>
                                     Nenhum colaborador afastado no momento.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
            </Table.Card>
        </div>
    );
}
