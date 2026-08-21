import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CalendarClock, Stethoscope, Activity } from 'lucide-react';
import { Collaborator, CollaboratorStatus, Ilha, Coordinator, Supervisor, Client, Operation, EntityStatus } from '../../types';
import { db } from '../../services/mockDb';
import { Input, Select, Button, Modal } from '../ui';

export const CollaboratorFormModal = ({ onClose, onSave, initialData, onSchedule, initialScheduleDate }: any) => {
    const [formData, setFormData] = useState<Partial<Collaborator>>(initialData || {
        status: CollaboratorStatus.ATIVO
    });
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [scheduleDate, setScheduleDate] = useState(initialScheduleDate || '');
    const [isScheduling, setIsScheduling] = useState(!!initialScheduleDate);

    useEffect(() => {
        const load = async () => {
            setIlhas(await db.getIlhas());
            setCoordinators(await db.getCoordinators());
            setSupervisors(await db.getSupervisors());
            setClients(await db.getClients());
            setOperations(await db.getOperations());
        }
        load();
    }, []);

    const handleChange = (k: keyof Collaborator, v: any) => setFormData(p => ({ ...p, [k]: v }));

    const handleConfirmSchedule = () => {
        if (!scheduleDate) {
            alert("Selecione uma data para agendar.");
            return;
        }
        onSchedule(formData, scheduleDate);
    };

    const rodape = (
        <div className="flex items-center justify-between gap-3 w-full">
            {onSchedule ? (
                <div className="flex items-center gap-2">
                    {!isScheduling ? (
                        <Button variant="secondary" onClick={() => setIsScheduling(true)}>
                            <CalendarClock size={16}/> {initialData ? 'Agendar alteração' : 'Agendar cadastro'}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 bg-brand-wash p-2 rounded-lg border border-brand/30 mop-fade-up">
                            <span className="t-eyebrow text-brand-text">Para</span>
                            <input
                                type="date"
                                aria-label="Data do agendamento"
                                className="px-2 py-1 text-sm rounded-sm border border-brand/40 bg-canvas text-ink focus:ring-1 focus:ring-brand outline-none"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setIsScheduling(false)}
                                aria-label="Cancelar agendamento"
                                className="p-1 rounded-full text-brand-text/70 hover:text-brand-text"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            ) : <span />}

            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                {isScheduling
                    ? <Button onClick={handleConfirmSchedule}>Confirmar agendamento</Button>
                    : <Button onClick={() => onSave(formData)}>Salvar</Button>}
            </div>
        </div>
    );

    return (
        <Modal
            open
            onClose={onClose}
            title={initialData ? 'Editar colaborador' : 'Novo colaborador'}
            rodape={rodape}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Matrícula" value={formData.matricula} onChange={(e:any) => handleChange('matricula', e.target.value)} required disabled={!!initialData} />
                <Input label="Nome completo" value={formData.nome} onChange={(e:any) => handleChange('nome', e.target.value)} required />
                <Input label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} />
                <Input label="Data de nascimento" type="date" value={formData.dtNasc} onChange={(e:any) => handleChange('dtNasc', e.target.value)} />

                {/* Novos Campos VR */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 bg-brand-wash p-3 rounded-lg border border-brand/20">
                    <Input label="Email VR" value={formData.email_vr || ''} onChange={(e:any) => handleChange('email_vr', e.target.value)} placeholder="Email para sistema VR" />
                    <Input label="Senha de acesso" value={formData.senha || ''} onChange={(e:any) => handleChange('senha', e.target.value)} placeholder="Senha inicial" />
                </div>

                <div className="col-span-1 md:col-span-2 bg-canvas-soft p-4 rounded-lg border border-hairline">
                    <p className="t-eyebrow text-ink-faint mb-2">Alocação</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select label="Cliente" value={formData.clientId} onChange={(e:any) => {
                           handleChange('clientId', e.target.value);
                           handleChange('operationId', '');
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {clients.filter(c => c.status === EntityStatus.ACTIVE).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Operação" value={formData.operationId} onChange={(e:any) => {
                           handleChange('operationId', e.target.value);
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {operations.filter(o => o.status === EntityStatus.ACTIVE && (!formData.clientId || o.clientId === formData.clientId)).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </Select>
                        <Select label="Ilha" value={formData.ilhaId} onChange={(e:any) => {
                            const ilha = ilhas.find(i => i.id === e.target.value);
                            if(ilha) {
                                setFormData(p => ({
                                    ...p,
                                    ilhaId: ilha.id,
                                    operationId: ilha.operationId,
                                    clientId: ilha.clientId,
                                    coordinatorId: ilha.coordinatorIds?.[0] || p.coordinatorId,
                                    supervisorId: ilha.supervisorIds?.[0] || p.supervisorId
                                }));
                            } else {
                                handleChange('ilhaId', e.target.value);
                            }
                        }}>
                            <option value="">Selecione...</option>
                            {ilhas.filter(i => i.status === EntityStatus.ACTIVE && (!formData.clientId || i.clientId === formData.clientId) && (!formData.operationId || i.operationId === formData.operationId)).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Coordenador" value={formData.coordinatorId} onChange={(e:any) => handleChange('coordinatorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {coordinators.filter(c => c.status === EntityStatus.ACTIVE).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Supervisor" value={formData.supervisorId} onChange={(e:any) => handleChange('supervisorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {supervisors.filter(s => s.status === EntityStatus.ACTIVE).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </Select>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-hairline pt-4 mt-2">
                    <Select label="Status" value={formData.status} onChange={(e:any) => handleChange('status', e.target.value)}>
                        {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>

                    {formData.status === CollaboratorStatus.FERIAS && (
                        <div className="grid grid-cols-2 gap-4 bg-brand/15 p-4 rounded-lg border border-brand/40 mop-fade-up">
                             <Input label="Início das férias" type="date" value={formData.feriasInicio} onChange={(e:any) => handleChange('feriasInicio', e.target.value)} />
                             <Input label="Fim das férias" type="date" value={formData.feriasFim} onChange={(e:any) => handleChange('feriasFim', e.target.value)} />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.DESLIGADO && (
                        <div className="bg-danger/10 p-4 rounded-lg border border-danger/30 mop-fade-up">
                             <Input label="Data do desligamento" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AVISO_PREVIO && (
                        <div className="bg-brand/25 p-4 rounded-lg border border-brand/50 mop-fade-up">
                             <div className="flex items-center gap-2 mb-2 text-ink">
                                <AlertTriangle size={16} />
                                <p className="text-sm font-bold">Registro de Aviso Prévio</p>
                             </div>
                             <p className="text-xs text-ink-mute mb-3">Informe a data prevista para o desligamento final. O sistema usará esta data para cálculos de turnover futuro.</p>
                             <Input label="Fim do aviso" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AFASTADO && (
                        <div className="bg-danger/10 p-4 rounded-lg border border-danger/30 mop-fade-up">
                             <div className="flex items-center gap-2 mb-2 text-danger">
                                <Activity size={16} />
                                <p className="text-sm font-bold">Registro de Afastamento</p>
                             </div>
                             <Input label="Início do afastamento" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.LICENCA_MATERNIDADE && (
                        <div className="bg-canvas-soft p-4 rounded-lg border border-hairline-2 mop-fade-up">
                             <div className="flex items-center gap-2 mb-2 text-ink">
                                <Stethoscope size={16} />
                                <p className="text-sm font-bold">Registro de Licença Maternidade</p>
                             </div>
                             <Input label="Início da licença" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <Input label="Data de entrada" type="date" value={formData.dtEntradaProduto} onChange={(e:any) => handleChange('dtEntradaProduto', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Entrada" type="time" value={formData.horarioEntrada} onChange={(e:any) => handleChange('horarioEntrada', e.target.value)} />
                        <Input label="Saída" type="time" value={formData.horarioSaida} onChange={(e:any) => handleChange('horarioSaida', e.target.value)} />
                    </div>
                </div>
            </div>
        </Modal>
    );
};
