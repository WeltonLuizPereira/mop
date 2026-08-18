import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Edit2, Trash2, User as UserIcon, Briefcase, Clock, MapPin, Key, Sun, History } from 'lucide-react';
import { Collaborator, User, UserRole, HistoryLog, Ilha, Operation, Client, Coordinator, Supervisor, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { getCollaboratorCalculations, formatDateString, formatTime, addDays } from '../utils';
import { Badge, Button, Card, EmptyState, IconButton, Modal, Table, Tag } from '../components/ui';
import { ClientLogo } from '../components/collaborators/ClientLogo';
import { CollaboratorFormModal } from '../components/collaborators/CollaboratorFormModal';

/** Rótulo + valor de uma seção de definição; matrícula, data, hora e número usam `t-data`. */
const Def = ({ label, value, mono = false, className = '' }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) => (
    <div className={className}>
        <dt className="t-eyebrow text-ink-faint">{label}</dt>
        <dd className={`mt-1 text-sm text-ink ${mono ? 't-data' : ''}`}>{value || value === 0 ? value : '—'}</dd>
    </div>
);

const SectionTitle = ({ icon: Icon, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) => (
    <h3 className="t-eyebrow mb-4 flex items-center gap-2 text-ink-faint">
        <Icon aria-hidden="true" size={13} />
        {children}
    </h3>
);

export const CollaboratorDetailsPage: React.FC<{ collab: Collaborator, onBack: () => void, currentUser: User, onRefresh: () => void }> = ({ collab, onBack, currentUser, onRefresh }) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentCollab, setCurrentCollab] = useState(collab);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
    const [vacationHistory, setVacationHistory] = useState<any[]>([]);
    const [ilha, setIlha] = useState<Ilha | undefined>(undefined);
    const [op, setOp] = useState<Operation | undefined>(undefined);
    const [client, setClient] = useState<Client | undefined>(undefined);
    const [coord, setCoord] = useState<Coordinator | undefined>(undefined);
    const [sup, setSup] = useState<Supervisor | undefined>(undefined);

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const canManage = isAdmin || currentUser.role === UserRole.SUPPORT;

    useEffect(() => {
        const load = async () => {
            const allLogs = await db.getHistory();
            setHistoryLogs(allLogs.filter(h => h.target === currentCollab.nome || h.details?.includes(currentCollab.matricula)));
            const vacHistory = await db.getVacationHistory(currentCollab.matricula);
            setVacationHistory(vacHistory);
            const ilhas = await db.getIlhas();
            setIlha(ilhas.find(i => i.id === currentCollab.ilhaId));
            const ops = await db.getOperations();
            setOp(ops.find(o => o.id === currentCollab.operationId));
            const clients = await db.getClients();
            setClient(clients.find(c => c.id === currentCollab.clientId));
            const coords = await db.getCoordinators();
            setCoord(coords.find(c => c.id === currentCollab.coordinatorId));
            const sups = await db.getSupervisors();
            setSup(sups.find(s => s.id === currentCollab.supervisorId));
        };
        load();
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

    const confirmDelete = async () => {
        await db.deleteCollaborator(currentCollab.matricula);
        setIsDeleteOpen(false);
        onRefresh();
        onBack();
    };

    const experienciaLabel = calc.experiencia === 'SIM' ? 'Sim' : calc.experiencia === 'NÃO' ? 'Não' : null;
    const feriasTagLabel = currentCollab.status === CollaboratorStatus.FERIAS ? 'Em gozo' : 'Programado';

    return (
        <div className="flex flex-col gap-5 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="secondary" onClick={onBack}><ArrowLeft aria-hidden="true" size={16}/> Voltar</Button>
                    <ClientLogo client={client} />
                    <div className="min-w-0">
                        <h2 className="t-display-md truncate text-ink">{currentCollab.nome}</h2>
                        <p className="t-data text-xs text-ink-mute">Matrícula {currentCollab.matricula}</p>
                    </div>
                    <Badge status={currentCollab.status} />
                </div>
                {canManage && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button onClick={() => setIsEditOpen(true)}><Edit2 aria-hidden="true" size={16}/> Editar cadastro</Button>
                        {isAdmin && (
                            <IconButton
                                label="Excluir colaborador"
                                icon={<Trash2 size={16} />}
                                variant="danger"
                                onClick={() => setIsDeleteOpen(true)}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card>
                    <SectionTitle icon={UserIcon}>Dados pessoais</SectionTitle>
                    <dl className="space-y-3">
                        <Def label="Email" value={<span className="break-all">{currentCollab.email}</span>} />
                        <Def label="Data de nascimento" value={formatDateString(currentCollab.dtNasc)} mono />
                        <Def label="Status" value={<Badge status={currentCollab.status} />} />
                    </dl>
                </Card>

                <Card>
                    <SectionTitle icon={Briefcase}>Contrato</SectionTitle>
                    <dl className="space-y-3">
                        <Def label="Data de entrada" value={formatDateString(currentCollab.dtEntradaProduto)} mono />
                        {currentCollab.status === CollaboratorStatus.DESLIGADO && (
                            <Def label="Data de desligamento" value={formatDateString(currentCollab.dataFim)} mono />
                        )}
                        {currentCollab.status === CollaboratorStatus.AVISO_PREVIO && (
                            <Def label="Fim do aviso" value={formatDateString(currentCollab.dataFim)} mono />
                        )}
                        {currentCollab.status === CollaboratorStatus.AFASTADO && (
                            <Def label="Início do afastamento" value={formatDateString(currentCollab.dataAfastamento)} mono />
                        )}
                        <Def label="Tempo de casa" value={`${calc.tempoDeCasa} dias`} mono />
                        <Def label="Período de experiência" value={experienciaLabel ? <Tag>{experienciaLabel}</Tag> : '—'} />
                        <Def label="Vencimento da experiência" value={calc.vence === '-' ? '—' : formatDateString(calc.vence)} mono />
                    </dl>
                </Card>

                <Card>
                    <SectionTitle icon={MapPin}>Alocação</SectionTitle>
                    <dl className="space-y-3">
                        <Def label="Cliente" value={client?.nome} />
                        <Def label="Operação" value={op?.nome} />
                        <Def label="Ilha" value={ilha?.nome} />
                        <Def label="Coordenador" value={coord?.nome} />
                        <Def label="Supervisor" value={sup?.nome} />
                    </dl>
                </Card>

                <Card>
                    <SectionTitle icon={Clock}>Jornada</SectionTitle>
                    <dl className="flex gap-8">
                        <Def label="Entrada" value={formatTime(currentCollab.horarioEntrada)} mono />
                        <Def label="Saída" value={formatTime(currentCollab.horarioSaida)} mono />
                    </dl>
                </Card>

                <Card>
                    <SectionTitle icon={Key}>Dados de acesso</SectionTitle>
                    <dl className="space-y-3">
                        <Def label="Email VR" value={<span className="break-all">{currentCollab.email_vr}</span>} />
                        <Def label="Senha" value={currentCollab.senha} />
                    </dl>
                </Card>

                <Card>
                    <SectionTitle icon={Sun}>Férias</SectionTitle>
                    {currentCollab.feriasInicio ? (
                        <>
                            <dl className="grid grid-cols-2 gap-4">
                                <Def label="Início" value={formatDateString(currentCollab.feriasInicio)} mono />
                                <Def label="Fim" value={formatDateString(currentCollab.feriasFim)} mono />
                            </dl>
                            {currentCollab.feriasFim && (
                                <dl className="mt-3">
                                    <Def label="Retorno previsto" value={<span className="t-data font-semibold text-ok">{addDays(currentCollab.feriasFim, 1)}</span>} />
                                </dl>
                            )}
                            <div className="mt-3">
                                <Tag>{feriasTagLabel}</Tag>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-ink-mute">Nenhuma férias programada.</p>
                    )}

                    {vacationHistory.length > 0 && (
                        <div className="mt-5 border-t border-hairline pt-4">
                            <h4 className="t-eyebrow mb-3 flex items-center gap-2 text-ink-faint">
                                <History aria-hidden="true" size={13} /> Histórico de férias
                            </h4>
                            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                {vacationHistory.map((h, i) => (
                                    <div key={i} className="t-data rounded-sm bg-canvas-sunk px-2.5 py-1.5 text-xs text-ink-2">
                                        {formatDateString(h.start_date)} — {formatDateString(h.end_date)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <section aria-labelledby="historico-colaborador-heading">
                <h3 id="historico-colaborador-heading" className="t-eyebrow mb-3 flex items-center gap-2 text-ink-faint">
                    <History aria-hidden="true" size={13} /> Histórico de alterações
                </h3>
                {historyLogs.length === 0 ? (
                    <div className="rounded-lg border border-hairline bg-canvas-soft">
                        <EmptyState title="Nenhum registro de alteração encontrado" />
                    </div>
                ) : (
                    <Table label="Histórico de alterações do colaborador">
                        <Table.Head>
                            <Table.Th>Data/hora</Table.Th>
                            <Table.Th>Usuário</Table.Th>
                            <Table.Th>Ação</Table.Th>
                            <Table.Th>Detalhes</Table.Th>
                        </Table.Head>
                        <Table.Body>
                            {historyLogs.map(log => (
                                <Table.Row key={log.id}>
                                    <Table.Td className="t-data text-xs text-ink-mute">{log.date}</Table.Td>
                                    <Table.Td className="text-xs font-semibold text-ink">{log.user}</Table.Td>
                                    <Table.Td className="text-xs text-ink-2">{log.action}</Table.Td>
                                    <Table.Td className="t-data whitespace-normal text-xs text-ink-2">{log.details || '—'}</Table.Td>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                )}
            </section>

            {isEditOpen && (
                <CollaboratorFormModal
                    initialData={currentCollab}
                    onClose={() => setIsEditOpen(false)}
                    onSave={handleUpdate}
                    onSchedule={handleScheduleUpdate}
                />
            )}

            <Modal
                open={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Excluir colaborador?"
                description={`Remove permanentemente o cadastro de ${currentCollab.nome}. Esta ação não pode ser desfeita.`}
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="solid-danger" onClick={confirmDelete}>Excluir</Button>
                    </>
                )}
            >
                <p className="text-sm text-ink-mute">Matrícula {currentCollab.matricula}.</p>
            </Modal>
        </div>
    );
};
