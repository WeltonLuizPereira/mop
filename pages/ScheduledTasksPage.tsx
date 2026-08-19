import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Collaborator, ScheduledTask } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import {
  Button, Table, Carregando, FalhaAoCarregar, ListaVazia,
} from '../components/ui';
import { CollaboratorFormModal } from '../components/collaborators/CollaboratorFormModal';

export const ScheduledTasksPage = () => {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [collabNames, setCollabNames] = useState<Record<string, string>>({});

    // New State for Editing
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
    const [initialData, setInitialData] = useState<Partial<Collaborator>>({});

    const loadTasks = async () => {
        const pending = await db.getPendingTasks();
        setTasks(pending);

        // Fetch Names
        const collabs = await db.getCollaborators();
        const names: Record<string, string> = {};
        pending.forEach(t => {
            const c = collabs.find(col => col.matricula === t.matricula);
            if (c) names[t.matricula] = c.nome;
            // Fallback para tarefas de criação onde o colaborador ainda não existe
            else if (t.changes && t.changes.nome) names[t.matricula] = t.changes.nome + " (Novo)";
        });
        setCollabNames(names);
    };

    const [carregando, setCarregando] = useState(true);
    const [falhou, setFalhou] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setFalhou(false);
        try {
            await loadTasks();
        } catch {
            setFalhou(true);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleCancel = async (id: string) => {
        if(confirm("Deseja cancelar esta tarefa agendada?")) {
            await db.cancelTask(id);
            loadTasks();
        }
    }

    const handleCancelAll = async () => {
        if(confirm("Atenção: Esta ação irá excluir TODAS as tarefas agendadas. Deseja continuar?")) {
            try {
                await db.cancelAllTasks();
                loadTasks();
            } catch (err: any) {
                alert("Erro ao excluir tarefas: " + err.message);
                console.error(err);
            }
        }
    }

    const handleEdit = async (task: ScheduledTask) => {
        setEditingTask(task);

        const collabs = await db.getCollaborators();
        const existing = collabs.find(c => c.matricula === task.matricula);

        if (existing) {
            setInitialData({ ...existing, ...task.changes });
        } else {
            setInitialData(task.changes);
        }

        setIsEditOpen(true);
    };

    const handleUpdateTask = async (data: Collaborator, date: string) => {
        if (!editingTask) return;

        await db.updateTask(editingTask.id, data, date);

        await db.addHistory({
            action: 'Edição de Tarefa Agendada',
            target: data.nome || 'N/A',
            user: 'Sistema', // Or current user if passed
            date: new Date().toLocaleString('pt-BR'),
            type: 'update',
            details: `Tarefa reagendada para ${formatDateString(date)}`
        });

        setIsEditOpen(false);
        setEditingTask(null);
        loadTasks();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Table.Card>
                <Table.Toolbar
                    contagem={{ n: tasks.length, um: 'tarefa agendada', varios: 'tarefas agendadas' }}
                    acoes={tasks.length > 0 && (
                        <Button variant="danger" onClick={handleCancelAll}>
                            <Trash2 size={15} /> Excluir todas
                        </Button>
                    )}
                />
                {carregando ? (
                    <Carregando o_que="as tarefas agendadas" />
                ) : falhou ? (
                    <FalhaAoCarregar mensagem="Não foi possível carregar as tarefas agendadas." aoTentar={carregar} />
                ) : tasks.length === 0 ? (
                    <ListaVazia titulo="Nenhuma tarefa pendente">
                        Alterações agendadas para uma data futura aparecem aqui.
                    </ListaVazia>
                ) : (
                <Table label="Tarefas agendadas">
                    <Table.Head>
                        <Table.Th>Data programada</Table.Th>
                        <Table.Th>Matrícula</Table.Th>
                        <Table.Th>Colaborador</Table.Th>
                        <Table.Th>Resumo alterações</Table.Th>
                        <Table.Th>Criado por</Table.Th>
                        <Table.Th className="text-right">Ações</Table.Th>
                    </Table.Head>
                    <tbody className="divide-y divide-hairline">
                        {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-canvas-soft">
                                <td className="p-4 text-brand-text dado">{formatDateString(task.scheduled_date)}</td>
                                <td className="p-4 font-mono text-xs">{task.matricula}</td>
                                <td className="p-4 font-medium text-ink">{collabNames[task.matricula] || '...'}</td>
                                <td className="p-4 text-xs text-ink-mute">
                                    {Object.keys(task.changes).length > 5 ? 'Alteração completa (cadastro)' : Object.keys(task.changes).join(', ')}
                                </td>
                                <td className="p-4 text-xs">{task.created_by}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" className="px-2 py-1 text-xs text-brand border-brand-wash bg-brand-wash hover:bg-brand-wash" onClick={() => handleEdit(task)}>
                                            <Edit2 size={14} className="mr-1"/> Editar
                                        </Button>
                                        <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleCancel(task.id)}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                )}
            </Table.Card>

            {isEditOpen && (
                <CollaboratorFormModal
                    initialData={initialData}
                    onClose={() => setIsEditOpen(false)}
                    onSave={() => {}}
                    onSchedule={handleUpdateTask}
                    initialScheduleDate={editingTask?.scheduled_date}
                />
            )}
        </div>
    );
};
