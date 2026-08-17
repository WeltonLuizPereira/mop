import React, { useState, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Collaborator, ScheduledTask } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Button } from '../components/ui';
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

    useEffect(() => { loadTasks(); }, []);

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Tarefas Agendadas</h2>
                    <span className="bg-brand-100 text-brand-700 text-sm font-bold px-3 py-1 rounded-full">
                        {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                </div>
                {tasks.length > 0 && (
                    <Button variant="solid-danger" onClick={handleCancelAll}>
                        <Trash2 size={16} className="mr-2" /> Excluir Todas
                    </Button>
                )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4">Data Programada</th>
                            <th className="p-4">Matrícula</th>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4">Resumo Alterações</th>
                            <th className="p-4">Criado Por</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-brand-700">{formatDateString(task.scheduled_date)}</td>
                                <td className="p-4 font-mono text-xs">{task.matricula}</td>
                                <td className="p-4 font-medium text-gray-900">{collabNames[task.matricula] || '...'}</td>
                                <td className="p-4 text-xs text-gray-500">
                                    {Object.keys(task.changes).length > 5 ? 'Alteração Completa (Cadastro)' : Object.keys(task.changes).join(', ')}
                                </td>
                                <td className="p-4 text-xs">{task.created_by}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" className="px-2 py-1 text-xs text-brand-600 border-brand-200 bg-brand-50 hover:bg-brand-100" onClick={() => handleEdit(task)}>
                                            <Edit2 size={14} className="mr-1"/> Editar
                                        </Button>
                                        <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleCancel(task.id)}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma tarefa pendente.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
