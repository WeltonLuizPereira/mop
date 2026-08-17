import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertCircle, Info, Filter, AlertTriangle, CalendarClock, Loader2, X, CheckCircle, ListChecks } from 'lucide-react';
import { User, Collaborator, Coordinator, Supervisor, Client, Operation, Ilha, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { Button } from '../components/ui';

export const BulkUpdatePage = ({ currentUser, onRefresh }: { currentUser: User, onRefresh: () => void }) => {
    // ... same as original ...
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    
    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        type: 'info' | 'confirm' | 'error' | 'success';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    
    // Filters
    const [filterClient, setFilterClient] = useState('');
    const [filterOp, setFilterOp] = useState('');
    const [filterIlha, setFilterIlha] = useState('');
    const [filterStatus, setFilterStatus] = useState(CollaboratorStatus.ATIVO);
    
    // Update Actions
    const [updates, setUpdates] = useState<{ field: string, value: string }[]>([{ field: '', value: '' }]);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    // Metadata
    const [clients, setClients] = useState<Client[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);

    useEffect(() => {
        const load = async () => {
            const [c, cl, op, il, sup, coord] = await Promise.all([
                db.getCollaborators(),
                db.getClients(),
                db.getOperations(),
                db.getIlhas(),
                db.getSupervisors(),
                db.getCoordinators()
            ]);
            setCollabs(c);
            setClients(cl);
            setOperations(op);
            setIlhas(il);
            setSupervisors(sup);
            setCoordinators(coord);
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        return collabs.filter(c => {
            if (filterClient && c.clientId !== filterClient) return false;
            if (filterOp && c.operationId !== filterOp) return false;
            if (filterIlha && c.ilhaId !== filterIlha) return false;
            if (filterStatus && c.status !== filterStatus) return false;
            return true;
        });
    }, [collabs, filterClient, filterOp, filterIlha, filterStatus]);

    const handleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(c => String(c.matricula))));
        }
    };

    const toggleSelect = (id: string) => {
        const strId = String(id);
        const newSet = new Set(selectedIds);
        if (newSet.has(strId)) newSet.delete(strId);
        else newSet.add(strId);
        setSelectedIds(newSet);
    };

        const getFieldName = (f: string) => {
        if(f === 'coordinatorId') return 'Coordenador';
        if(f === 'supervisorId') return 'Supervisor';
        if(f === 'ilhaId') return 'Ilha (com cascata)';
        if(f === 'status') return 'Status';
        if(f === 'operationId') return 'Operação';
        if(f === 'clientId') return 'Cliente';
        return 'Registro';
    };

    const processSchedule = async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const matriculas: string[] = Array.from(selectedIds);
            const now = new Date().toLocaleString('pt-BR');
            
            const validUpdates = updates.filter(u => u.field && u.value);
            if (validUpdates.length === 0) return;

            const changes: any = {};
            validUpdates.forEach(u => {
                changes[u.field] = u.value;
            });

            const schedulePromises = matriculas.map(mat => {
                const c = collabs.find(col => String(col.matricula) === String(mat));
                if(!c) return Promise.resolve();
                return db.scheduleTask(mat, changes, scheduleDate, currentUser.nome);
            });
            await Promise.all(schedulePromises);

            const fieldNames = validUpdates.map(u => getFieldName(u.field)).join(', ');

            const logPromises = matriculas.map(mat => {
                const c = collabs.find(col => String(col.matricula) === String(mat));
                if(!c) return Promise.resolve();
                return db.addHistory({
                    action: 'Agendamento em Massa',
                    target: c.nome,
                    user: currentUser.nome,
                    date: now,
                    type: 'update',
                    details: `Campos [${fieldNames}] agendados para ${scheduleDate} via lote.`
                });
            });
            await Promise.all(logPromises);

            setModalConfig({
                isOpen: true,
                title: 'Sucesso',
                message: 'Agendamentos realizados com sucesso!',
                type: 'success'
            });
            setSelectedIds(new Set());
            setUpdates([{ field: '', value: '' }]);
            setIsScheduling(false);
            setScheduleDate('');
            onRefresh();
            setCollabs(await db.getCollaborators());
        } catch (e: any) {
            console.error("Erro no agendamento em massa:", e);
            setModalConfig({ isOpen: true, title: 'Erro', message: "Erro ao agendar: " + e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const processUpdate = async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const matriculas: string[] = Array.from(selectedIds);
            const now = new Date().toLocaleString('pt-BR');

            const validUpdates = updates.filter(u => u.field && u.value);
            if (validUpdates.length === 0) return;

            // Execute sequentially to respect cascading
            for (const update of validUpdates) {
                await db.bulkUpdateCollaborators(matriculas, update.field, update.value);
            }

            const fieldNames = validUpdates.map(u => getFieldName(u.field)).join(', ');

            await db.addHistory({
                action: 'Update em Massa',
                target: `${selectedIds.size} registros`,
                user: currentUser.nome,
                date: now,
                type: 'update',
                details: `Alteração de [${fieldNames}] para ${selectedIds.size} colaboradores.`
            });

            const logPromises = matriculas.map(mat => {
                const c = collabs.find(col => String(col.matricula) === String(mat));
                if(!c) return Promise.resolve();
                return db.addHistory({
                    action: 'Atualização em Massa',
                    target: c.nome,
                    user: currentUser.nome,
                    date: now,
                    type: 'update',
                    details: `Campos [${fieldNames}] alterados via ação em lote.`
                });
            });
            
            await Promise.all(logPromises);

            setModalConfig({
                isOpen: true,
                title: 'Sucesso',
                message: 'Atualização realizada com sucesso!',
                type: 'success'
            });
            setSelectedIds(new Set());
            setUpdates([{ field: '', value: '' }]);
            onRefresh();
            setCollabs(await db.getCollaborators());
        } catch (e: any) {
            console.error("Erro no update em massa:", e);
            setModalConfig({ isOpen: true, title: 'Erro', message: "Erro ao atualizar: " + e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteSchedule = () => {
        if (selectedIds.size === 0) {
            setModalConfig({ isOpen: true, title: 'Atenção', message: 'Selecione pelo menos um colaborador.', type: 'info' });
            return;
        }
        const validUpdates = updates.filter(u => u.field && u.value);
        if (validUpdates.length === 0) { 
             setModalConfig({ isOpen: true, title: 'Atenção', message: 'Preencha pelo menos um campo e um novo valor.', type: 'info' });
             return;
        }
        if (!scheduleDate) {
             setModalConfig({ isOpen: true, title: 'Atenção', message: 'Selecione uma data para o agendamento.', type: 'info' });
             return;
        }
        setModalConfig({
            isOpen: true,
            title: 'Confirmar Agendamento',
            message: <span dangerouslySetInnerHTML={{__html: `Confirma o agendamento para <b>${selectedIds.size}</b> colaboradores na data <b>${scheduleDate}</b>?`}} />,
            type: 'confirm',
            onConfirm: processSchedule
        });
    };

    const handleExecute = () => {
        if (selectedIds.size === 0) {
            setModalConfig({ isOpen: true, title: 'Atenção', message: 'Selecione pelo menos um colaborador.', type: 'info' });
            return;
        }
        const validUpdates = updates.filter(u => u.field && u.value);
        if (validUpdates.length === 0) { 
             setModalConfig({ isOpen: true, title: 'Atenção', message: 'Preencha pelo menos um campo e um novo valor para atualização.', type: 'info' });
             return;
        }
        setModalConfig({
            isOpen: true,
            title: 'Confirmar Atualização',
            message: <span dangerouslySetInnerHTML={{__html: `Confirma a atualização de <b>${selectedIds.size}</b> colaboradores?`}} />,
            type: 'confirm',
            onConfirm: processUpdate
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <h2 className="text-2xl font-bold text-gray-800">Atualização em Massa</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Filters and Actions */}
                <div className="space-y-6 lg:col-span-1">
                    
                    {/* Actions Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-brand-200 ring-1 ring-brand-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ListChecks size={18} className="text-brand-600"/> Ação de Atualização
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-3 bg-brand-50 rounded-lg text-center">
                                <span className="block text-2xl font-bold text-brand-700">{selectedIds.size}</span>
                                <span className="text-xs text-brand-600 font-medium uppercase">Selecionados</span>
                            </div>

                            {updates.map((update, index) => (
                                <div key={index} className="space-y-3 p-3 bg-gray-50 rounded border border-gray-100 relative">
                                    {updates.length > 1 && (
                                        <button 
                                            onClick={() => setUpdates(updates.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            title="Remover campo"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Campo {index + 1}</label>
                                        <select 
                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                            value={update.field}
                                            onChange={e => { 
                                                const newUpdates = [...updates]; 
                                                newUpdates[index] = { field: e.target.value, value: '' }; 
                                                setUpdates(newUpdates); 
                                            }}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="coordinatorId">Coordenador</option>
                                            <option value="supervisorId">Supervisor</option>
                                            <option value="ilhaId">Ilha</option>
                                            <option value="operationId">Operação</option>
                                            <option value="clientId">Cliente</option>
                                            <option value="status">Status</option>
                                        </select>
                                    </div>

                                    {update.field && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Novo Valor</label>
                                            <select 
                                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                value={update.value}
                                                onChange={e => {
                                                    const newUpdates = [...updates]; 
                                                    newUpdates[index] = { ...update, value: e.target.value }; 
                                                    setUpdates(newUpdates); 
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                {update.field === 'coordinatorId' && coordinators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                {update.field === 'supervisorId' && supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                                {update.field === 'ilhaId' && ilhas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                                {update.field === 'operationId' && operations.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                                {update.field === 'clientId' && clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                {update.field === 'status' && Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {update.field === 'ilhaId' && update.value && (
                                                <p className="text-[10px] text-brand-600 mt-2 bg-brand-50 p-2 rounded">
                                                    Atenção: Ao alterar a Ilha, a Operação, Cliente, Coordenador e Supervisor serão atualizados automaticamente para os padrões da Ilha selecionada.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            <Button 
                                variant="outline" 
                                className="w-full border-dashed border-2 text-brand-600 hover:bg-brand-50 hover:text-brand-700 justify-center flex items-center gap-2"
                                onClick={() => setUpdates([...updates, { field: '', value: '' }])}
                            >
                                <Plus size={16} /> Adicionar Campo
                            </Button>

                            <div className="pt-2 mt-2 border-t border-gray-100 flex flex-col gap-2">
                                        {!isScheduling ? (
                                            <Button variant="secondary" onClick={() => setIsScheduling(true)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 w-full flex justify-center gap-2">
                                                <CalendarClock size={16}/> Agendar Alteração
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-700 uppercase">Agendar para:</span>
                                                    <button onClick={() => {setIsScheduling(false); setScheduleDate('');}} className="p-1 rounded-full text-blue-400 hover:text-blue-600 bg-blue-100">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <input 
                                                    type="date" 
                                                    className="px-2 py-1.5 text-sm rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                            <Button 
                                 onClick={isScheduling ? handleExecuteSchedule : handleExecute} 
                                disabled={loading || selectedIds.size === 0 || updates.filter(u => u.field && u.value).length === 0 || (isScheduling && !scheduleDate)}
                                className="w-full justify-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (isScheduling ? 'Confirmar Agendamento' : 'Aplicar Alterações')}
                            </Button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Filter size={18} className="text-gray-400"/> Filtros
                            </h3>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                                    <option value="">Todos</option>
                                    {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Cliente</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                                    <option value="">Todos</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Operação</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterOp} onChange={e => setFilterOp(e.target.value)}>
                                    <option value="">Todas</option>
                                    {operations.filter(o => !filterClient || o.clientId === filterClient).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Ilha</label>
                                <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={filterIlha} onChange={e => setFilterIlha(e.target.value)}>
                                    <option value="">Todas</option>
                                    {ilhas.filter(i => (!filterClient || i.clientId === filterClient) && (!filterOp || i.operationId === filterOp)).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Table */}
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <span className="text-sm font-bold text-gray-600">{filtered.length} colaboradores encontrados</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-white text-gray-700 font-semibold uppercase tracking-wider text-xs sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                            onChange={handleSelectAll}
                                            className="rounded text-brand-600 focus:ring-brand-500"
                                        />
                                    </th>
                                    <th className="p-4">Nome / Matrícula</th>
                                    <th className="p-4">Supervisor Atual</th>
                                    <th className="p-4">Coordenador Atual</th>
                                    <th className="p-4">Ilha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(c => {
                                    const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
                                    const coord = coordinators.find(co => co.id === c.coordinatorId)?.nome || '-';
                                    const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
                                    const strMatricula = String(c.matricula);
                                    
                                    return (
                                        <tr key={strMatricula} className={selectedIds.has(strMatricula) ? "bg-brand-50/30" : "hover:bg-gray-50"}>
                                            <td className="p-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(strMatricula)}
                                                    onChange={() => toggleSelect(strMatricula)}
                                                    className="rounded text-brand-600 focus:ring-brand-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{c.nome}</div>
                                                <div className="text-xs text-gray-400">{c.matricula}</div>
                                            </td>
                                            <td className="p-4 text-xs">{sup}</td>
                                            <td className="p-4 text-xs">{coord}</td>
                                            <td className="p-4 text-xs">{ilha}</td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Custom Modal for Sandbox Compatibility */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 p-6 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                            ${modalConfig.type === 'error' ? 'bg-red-100 text-red-600' : 
                              modalConfig.type === 'success' ? 'bg-green-100 text-green-600' : 
                              modalConfig.type === 'confirm' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-600'}`}>
                            {modalConfig.type === 'error' ? <AlertTriangle size={32} /> :
                             modalConfig.type === 'success' ? <CheckCircle size={32} /> :
                             modalConfig.type === 'confirm' ? <AlertCircle size={32} /> : <Info size={32} />} 
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
                        <div className="text-gray-500 text-sm mb-6">{modalConfig.message}</div>
                        
                        <div className="flex gap-3 justify-center">
                            {(modalConfig.type === 'confirm') ? (
                                <>
                                    <Button variant="secondary" onClick={() => setModalConfig(p => ({...p, isOpen: false}))}>Cancelar</Button>
                                    <Button onClick={modalConfig.onConfirm}>Confirmar</Button>
                                </>
                            ) : (
                                <Button variant="secondary" onClick={() => setModalConfig(p => ({...p, isOpen: false}))}>Fechar</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
