import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Edit2, Trash2, User as UserIcon, Briefcase, Clock, MapPin, Key, Sun, History } from 'lucide-react';
import { Collaborator, User, UserRole, HistoryLog, Ilha, Operation, Client, Coordinator, Supervisor, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { getCollaboratorCalculations, formatDateString, formatTime, addDays, getInitials, mensagemErroExclusao } from '../utils';
import { Badge, Button, Modal, Table } from '../components/ui';
import { CollaboratorFormModal } from '../components/collaborators/CollaboratorFormModal';

export const CollaboratorDetailsPage: React.FC<{ collab: Collaborator, onBack: () => void, currentUser: User, onRefresh: () => void }> = ({ collab, onBack, currentUser, onRefresh }) => {
    // ... same as original ...
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentCollab, setCurrentCollab] = useState(collab);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
    const [vacationHistory, setVacationHistory] = useState<any[]>([]);
    const [ilha, setIlha] = useState<Ilha | undefined>(undefined);
    const [op, setOp] = useState<Operation | undefined>(undefined);
    const [client, setClient] = useState<Client | undefined>(undefined);
    const [coord, setCoord] = useState<Coordinator | undefined>(undefined);
    const [sup, setSup] = useState<Supervisor | undefined>(undefined);
    
    const isAdmin = currentUser.role === UserRole.ADMIN;

    useEffect(() => {
        let active = true;

        // Históricos podem ser tabelas grandes. Eles não devem bloquear os
        // dados de alocação que formam a parte principal desta tela.
        void db.getHistory().then(allLogs => {
            if (active) setHistoryLogs(allLogs.filter(h => h.target === currentCollab.nome || h.details?.includes(currentCollab.matricula)));
        });
        void db.getVacationHistory(currentCollab.matricula).then(vacHistory => {
            if (active) setVacationHistory(vacHistory);
        });

        // As cinco consultas eram encadeadas e somavam suas latências. Iniciá-las
        // juntas reduz a espera para a duração de apenas uma ida ao Supabase.
        void Promise.all([
            db.getIlhas(),
            db.getOperations(),
            db.getClients(),
            db.getCoordinators(),
            db.getSupervisors(),
        ]).then(([ilhas, ops, clients, coords, sups]) => {
            if (!active) return;
            setIlha(ilhas.find(i => i.id === currentCollab.ilhaId));
            setOp(ops.find(o => o.id === currentCollab.operationId));
            setClient(clients.find(c => c.id === currentCollab.clientId));
            setCoord(coords.find(c => c.id === currentCollab.coordinatorId));
            setSup(sups.find(s => s.id === currentCollab.supervisorId));
        });

        return () => { active = false; };
    }, [currentCollab]);

    const calc = useMemo(() => getCollaboratorCalculations(currentCollab.dtEntradaProduto), [currentCollab]);
    
    const handleUpdate = async (data: Collaborator) => {
        const [ilhasList, supsList, coordsList, opsList, clientsList] = await Promise.all([
            db.getIlhas(),
            db.getSupervisors(),
            db.getCoordinators(),
            db.getOperations(),
            db.getClients()
        ]);

        const changes: string[] = [];

        const addChange = (field: string, oldVal: any, newVal: any) => {
            if (oldVal !== newVal) {
                const fmt = (v: any) => {
                    if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}$/)) return formatDateString(v);
                    return v || '(vazio)';
                };
                changes.push(`${field}: de '${fmt(oldVal)}' para '${fmt(newVal)}'`);
            }
        };

        const addIdChange = (field: string, oldId: string, newId: string, list: {id: string, nome: string}[]) => {
            if (oldId !== newId) {
                const oldName = list.find(i => i.id === oldId)?.nome || 'N/A';
                const newName = list.find(i => i.id === newId)?.nome || 'N/A';
                changes.push(`${field}: de '${oldName}' para '${newName}'`);
            }
        };

        addChange('Nome', currentCollab.nome, data.nome);
        addChange('Email', currentCollab.email, data.email);
        addChange('Status', currentCollab.status, data.status);
        addChange('Nascimento', currentCollab.dtNasc, data.dtNasc);
        
        // Tracking changes for new VR fields
        addChange('Email VR', currentCollab.email_vr, data.email_vr);
        addChange('Senha', currentCollab.senha, data.senha);
        
        addIdChange('Ilha', currentCollab.ilhaId, data.ilhaId, ilhasList);
        addIdChange('Supervisor', currentCollab.supervisorId, data.supervisorId, supsList);
        addIdChange('Coordenador', currentCollab.coordinatorId, data.coordinatorId, coordsList);
        addIdChange('Operação', currentCollab.operationId, data.operationId, opsList);
        addIdChange('Cliente', currentCollab.clientId, data.clientId, clientsList);

        addChange('Entrada', currentCollab.dtEntradaProduto, data.dtEntradaProduto);
        addChange('Desligamento', currentCollab.dataFim, data.dataFim);
        addChange('Horário Entrada', currentCollab.horarioEntrada, data.horarioEntrada);
        addChange('Horário Saída', currentCollab.horarioSaida, data.horarioSaida);
        
        addChange('Início Férias', currentCollab.feriasInicio, data.feriasInicio);
        addChange('Fim Férias', currentCollab.feriasFim, data.feriasFim);
        addChange('Data Afastamento', currentCollab.dataAfastamento, data.dataAfastamento);
        addChange('Efetivação', currentCollab.efetivacao, data.efetivacao);

        const details = changes.length > 0 ? changes.join('; ') : 'Dados cadastrais atualizados sem alterações críticas identificadas.';

        await db.saveCollaborator(data);
        if (data.feriasInicio && data.feriasFim && (currentCollab.feriasInicio !== data.feriasInicio || currentCollab.feriasFim !== data.feriasFim)) {
            await db.addVacationHistory(data.matricula, data.feriasInicio, data.feriasFim);
        }
        await db.addHistory({
            action: 'Atualização Colaborador',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'update',
            details: details
        });
        setCurrentCollab(data);
        setIsEditOpen(false);
        onRefresh(); 
    };

    const handleScheduleUpdate = async (data: Collaborator, date: string) => {
        const changes: any = {};
        
        if (currentCollab.nome !== data.nome) changes.nome = data.nome;
        if (currentCollab.email !== data.email) changes.email = data.email;
        if (currentCollab.status !== data.status) changes.status = data.status;
        if (currentCollab.ilhaId !== data.ilhaId) changes.ilhaId = data.ilhaId;
        if (currentCollab.supervisorId !== data.supervisorId) changes.supervisorId = data.supervisorId;
        if (currentCollab.coordinatorId !== data.coordinatorId) changes.coordinatorId = data.coordinatorId;
        if (currentCollab.operationId !== data.operationId) changes.operationId = data.operationId;
        if (currentCollab.clientId !== data.clientId) changes.clientId = data.clientId;
        
        if (currentCollab.dtEntradaProduto !== data.dtEntradaProduto) changes.dtEntradaProduto = data.dtEntradaProduto;
        if (currentCollab.dataFim !== data.dataFim) changes.dataFim = data.dataFim;
        if (currentCollab.horarioEntrada !== data.horarioEntrada) changes.horarioEntrada = data.horarioEntrada;
        if (currentCollab.horarioSaida !== data.horarioSaida) changes.horarioSaida = data.horarioSaida;
        if (currentCollab.dtNasc !== data.dtNasc) changes.dtNasc = data.dtNasc;
        
        if (currentCollab.feriasInicio !== data.feriasInicio) changes.feriasInicio = data.feriasInicio;
        if (currentCollab.feriasFim !== data.feriasFim) changes.feriasFim = data.feriasFim;
        if (currentCollab.dataAfastamento !== data.dataAfastamento) changes.dataAfastamento = data.dataAfastamento;
        if (currentCollab.efetivacao !== data.efetivacao) changes.efetivacao = data.efetivacao;
        
        if (currentCollab.email_vr !== data.email_vr) changes.email_vr = data.email_vr;
        if (currentCollab.senha !== data.senha) changes.senha = data.senha;

        if (data.status === CollaboratorStatus.FERIAS) {
            changes.feriasInicio = data.feriasInicio;
            changes.feriasFim = data.feriasFim;
        }

        if (data.status === CollaboratorStatus.DESLIGADO) {
            changes.dataFim = data.dataFim;
        }

        if (data.status === CollaboratorStatus.AFASTADO || data.status === CollaboratorStatus.LICENCA_MATERNIDADE) {
            changes.dataAfastamento = data.dataAfastamento;
        }

        if (Object.keys(changes).length === 0) {
            alert("Nenhuma alteração detectada para agendar.");
            return;
        }

        await db.scheduleTask(data.matricula, changes, date, currentUser.nome);
        await db.addHistory({
            action: 'Agendamento de Tarefa',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'create',
            details: `Alteração agendada para ${formatDateString(date)}`
        });
        
        setIsEditOpen(false);
        alert(`Alteração agendada para ${formatDateString(date)} com sucesso!`);
    };

    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

    const handleDelete = async () => {
        try {
            await db.deleteCollaborator(currentCollab.matricula);
        } catch (err: any) {
            setConfirmandoExclusao(false);
            alert(mensagemErroExclusao('colaborador', err));
            return;
        }
        setConfirmandoExclusao(false);
        onRefresh();
        onBack();
    };

    const Field = ({ label, value, className = "" }: any) => (
        <div className="mb-4">
            <p className="t-eyebrow text-ink-faint mb-1">{label}</p>
            <p className={`font-medium text-ink ${className}`}>{value || '-'}</p>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-right-10 duration-500 pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="secondary" onClick={onBack}><ArrowLeft size={16}/> Voltar</Button>
                
                {client?.logo ? (
                    <img src={client.logo} alt={`Logo ${client.nome}`} className="w-12 h-12 rounded-full object-cover object-center bg-canvas border border-hairline" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-wash text-brand-text border-2 border-canvas shadow-1 flex items-center justify-center font-bold text-lg">
                        {getInitials(currentCollab.nome)}
                    </div>
                )}

                <div className="flex-1">
                    <h2 className="t-display-lg text-ink">{currentCollab.nome}</h2>
                    <p className="text-ink-mute">Matrícula: {currentCollab.matricula}</p>
                </div>
                {(isAdmin || currentUser.role === UserRole.SUPPORT) && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsEditOpen(true)}><Edit2 size={16}/> Editar cadastro</Button>
                        {isAdmin && (
                            <Button variant="danger" aria-label="Excluir colaborador" onClick={() => setConfirmandoExclusao(true)}>
                                <Trash2 size={16}/>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-6">
                    <div className="bg-canvas p-6 rounded-lg shadow-1 border border-hairline">
                        <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><UserIcon size={18} className="text-brand"/> Dados pessoais</h3>
                        <Field label="Email" value={currentCollab.email} className="break-all" />
                        <Field label="Data de Nascimento" value={formatDateString(currentCollab.dtNasc)} />
                        <Field label="Status" value={<Badge status={currentCollab.status} />} />
                    </div>
                    
                    <div className="bg-canvas p-6 rounded-lg shadow-1 border border-hairline">
                        <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><Briefcase size={18} className="text-brand"/> Contrato</h3>
                        <Field label="Data de Entrada" value={formatDateString(currentCollab.dtEntradaProduto)} />
                        {currentCollab.status === CollaboratorStatus.DESLIGADO && (
                            <Field label="Data Desligamento" value={formatDateString(currentCollab.dataFim)} />
                        )}
                         {currentCollab.status === CollaboratorStatus.AVISO_PREVIO && (
                            <Field label="Fim do Aviso" value={formatDateString(currentCollab.dataFim)} />
                        )}
                        {currentCollab.status === CollaboratorStatus.AFASTADO && (
                            <Field label="Início Afastamento" value={formatDateString(currentCollab.dataAfastamento)} />
                        )}
                        <Field label="Tempo de Casa" value={`${calc.tempoDeCasa} dias`} />
                        <Field label="Período de Experiência" value={calc.experiencia} />
                        <Field label="Vencimento Experiência" value={calc.vence === '-' ? '-' : formatDateString(calc.vence)} />
                    </div>
                </div>

                <div className="space-y-6">
                     <div className="bg-canvas p-6 rounded-lg shadow-1 border border-hairline">
                        <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><MapPin size={18} className="text-brand"/> Alocação</h3>
                        <Field label="Cliente" value={client?.nome} />
                        <Field label="Operação" value={op?.nome} />
                        <Field label="Ilha" value={ilha?.nome} />
                        <Field label="Coordenador" value={coord?.nome} />
                        <Field label="Supervisor" value={sup?.nome} />
                    </div>

                    <div className="bg-canvas p-6 rounded-lg shadow-1 border border-hairline">
                        <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><Clock size={18} className="text-brand"/> Jornada</h3>
                        <div className="flex gap-8">
                             <Field label="Entrada" value={formatTime(currentCollab.horarioEntrada)} />
                             <Field label="Saída" value={formatTime(currentCollab.horarioSaida)} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6">
                     <div className="bg-canvas p-6 rounded-lg shadow-1 border border-hairline">
                        <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><Key size={18} className="text-brand"/> Dados de acesso</h3>
                        <Field label="Email VR" value={currentCollab.email_vr} className="break-all" />
                        <Field label="Senha" value={currentCollab.senha} />
                    </div>
                    
                    {/* Férias Display */}
                     <div className="bg-canvas p-6 rounded-lg shadow-1 border border-hairline">
                        <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><Sun size={18} className="text-brand"/> Férias</h3>
                        {currentCollab.feriasInicio ? (
                             <>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Início" value={formatDateString(currentCollab.feriasInicio)} />
                                    <Field label="Fim" value={formatDateString(currentCollab.feriasFim)} />
                                </div>
                                {currentCollab.feriasFim && (
                                    <div className="mb-4">
                                        <p className="t-eyebrow text-ink-faint mb-1">Retorno Previsto</p>
                                        <p className="font-bold text-ok text-lg">{addDays(currentCollab.feriasFim, 1)}</p>
                                    </div>
                                )}
                                <div className="mt-2">
                                    <Badge status={currentCollab.status === 'FÉRIAS' ? 'EM GOZO' : 'PROGRAMADO'} />
                                </div>
                             </>
                        ) : (
                            <p className="text-ink-faint text-sm">Nenhuma férias programada.</p>
                        )}
                        
                        {vacationHistory.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-hairline">
                                <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                                    <History size={16} className="text-ink-faint" /> Histórico de férias
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {vacationHistory.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center bg-canvas-soft p-2 rounded text-sm">
                                            <span className="text-ink-mute">
                                                {formatDateString(h.start_date)} - {formatDateString(h.end_date)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <History size={18} className="text-ink-mute"/> Histórico de alterações
            </h3>
            <Table.Card>
                <Table.Toolbar
                    contagem={{ n: historyLogs.length, um: 'alteração', varios: 'alterações' }}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                        <thead>
                            <tr>
                                <th className="p-4 w-32">Data/Hora</th>
                                <th className="p-4 w-40">Usuário</th>
                                <th className="p-4 w-40">Ação</th>
                                <th className="p-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {historyLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="p-4 text-xs text-ink-mute dado">{log.date}</td>
                                    <td className="p-4 font-bold text-xs">{log.user}</td>
                                    <td className="p-4 text-xs">{log.action}</td>
                                    <td className="p-4 text-xs text-ink font-mono">{log.details || '-'}</td>
                                </tr>
                            ))}
                            {historyLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-ink-faint">Nenhum registro de alteração encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Table.Card>

            <Modal
                open={confirmandoExclusao}
                onClose={() => setConfirmandoExclusao(false)}
                title="Excluir colaborador?"
                tamanho="sm"
                rodape={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmandoExclusao(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Excluir</Button>
                    </>
                }
            >
                <p className="text-sm text-ink-2">
                    {currentCollab.nome} sai do cadastro junto com o vínculo à ilha. O histórico de
                    alterações permanece. Não há como desfazer.
                </p>
            </Modal>

            {isEditOpen && (
                <CollaboratorFormModal 
                    initialData={currentCollab} 
                    onClose={() => setIsEditOpen(false)} 
                    onSave={handleUpdate} 
                    onSchedule={handleScheduleUpdate}
                />
            )}
        </div>
    );
};
