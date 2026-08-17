import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, User as UserIcon, CheckCircle, Eye } from 'lucide-react';
import { Collaborator, Supervisor, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { formatDateString, getInitials } from '../utils';
import { Button, Badge } from '../components/ui';

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
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Afastados</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg"><Activity size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase">Afastamento Médico/INSS</p>
                        <h3 className="text-2xl font-bold text-gray-900">{countAfastado}</h3>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-pink-100 text-pink-600 rounded-lg"><UserIcon size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase">Licença Maternidade</p>
                        <h3 className="text-2xl font-bold text-gray-900">{countLicenca}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
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
                     <tbody className="divide-y divide-gray-100">
                         {filtered.map(c => {
                             const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                             const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                             return (
                                 <tr key={c.matricula} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails && onViewDetails(c)}>
                                     <td className="p-4">
                                         <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">
                                             {getInitials(c.nome)}
                                         </div>
                                     </td>
                                     <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                     <td className="p-4"><Badge status={c.status} /></td>
                                     <td className="p-4 font-bold text-gray-800">{formatDateString(c.dataAfastamento)}</td>
                                     <td className="p-4 text-xs">{ilha}</td>
                                     <td className="p-4 text-xs">{sup}</td>
                                     <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm"><Eye size={16}/></Button>
                                     </td>
                                 </tr>
                             );
                         })}
                          {filtered.length === 0 && (
                             <tr>
                                 <td colSpan={7} className="p-8 text-center text-gray-400">
                                     <CheckCircle className="mx-auto mb-2 opacity-50" size={24}/>
                                     Nenhum colaborador afastado no momento.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
            </div>
        </div>
    );
}
