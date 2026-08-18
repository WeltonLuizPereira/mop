import React, { useCallback, useEffect, useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Collaborator, ScheduledTask } from '../types';
import { db } from '../services/mockDb';
import { formatDateString } from '../utils';
import { Button, EmptyState, InlineNotice, LoadingState, MetricStrip, PageToolbar, Table } from '../components/ui';
import { CollaboratorFormModal } from '../components/collaborators/CollaboratorFormModal';

export const ScheduledTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [collabNames, setCollabNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [falhouCarga, setFalhouCarga] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [initialData, setInitialData] = useState<Partial<Collaborator>>({});

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setFalhouCarga(false);
      const pending = await db.getPendingTasks();
      setTasks(pending);

      // Busca os nomes dos colaboradores referenciados pelas tarefas
      const collabs = await db.getCollaborators();
      const names: Record<string, string> = {};
      pending.forEach(t => {
        const c = collabs.find(col => col.matricula === t.matricula);
        if (c) names[t.matricula] = c.nome;
        // Fallback para tarefas de criação onde o colaborador ainda não existe
        else if (t.changes && t.changes.nome) names[t.matricula] = t.changes.nome + ' (Novo)';
      });
      setCollabNames(names);
    } catch {
      setFalhouCarga(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleCancel = async (id: string) => {
    if (confirm('Deseja cancelar esta tarefa agendada?')) {
      await db.cancelTask(id);
      loadTasks();
    }
  };

  const handleCancelAll = async () => {
    if (confirm('Atenção: Esta ação irá excluir TODAS as tarefas agendadas. Deseja continuar?')) {
      try {
        await db.cancelAllTasks();
        loadTasks();
      } catch (err: any) {
        alert('Erro ao excluir tarefas: ' + err.message);
        console.error(err);
      }
    }
  };

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
      user: 'Sistema',
      date: new Date().toLocaleString('pt-BR'),
      type: 'update',
      details: `Tarefa reagendada para ${formatDateString(date)}`
    });

    setIsEditOpen(false);
    setEditingTask(null);
    loadTasks();
  };

  return (
    <div className="flex flex-col gap-5">
      <PageToolbar
        description="Gerencie os cadastros e as alterações agendados para uma data futura."
        actions={tasks.length > 0 && (
          <Button variant="solid-danger" onClick={handleCancelAll}>
            <Trash2 aria-hidden="true" size={16} /> Excluir todas
          </Button>
        )}
      />

      {isLoading ? (
        <div className="rounded-lg border border-hairline bg-canvas-soft"><LoadingState label="Carregando tarefas agendadas" /></div>
      ) : falhouCarga ? (
        <InlineNotice
          tone="error"
          title="Falha ao carregar tarefas agendadas"
          action={<Button variant="secondary" size="sm" onClick={() => void loadTasks()}>Tentar de novo</Button>}
        >
          Não foi possível consultar as tarefas agendadas.
        </InlineNotice>
      ) : (
        <>
          <div className="rounded-lg border border-hairline">
            <div className="flex items-center gap-3 bg-canvas-soft p-3">
              <MetricStrip
                label="Resumo da lista"
                items={[{ label: tasks.length === 1 ? 'tarefa pendente' : 'tarefas pendentes', value: tasks.length }]}
              />
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas-soft">
              <EmptyState
                title="Nenhuma tarefa pendente"
                description="Os cadastros e alterações agendados aparecerão aqui."
              />
            </div>
          ) : (
            <Table label="Tarefas agendadas">
              <Table.Head>
                <Table.Th>Data programada</Table.Th>
                <Table.Th>Matrícula</Table.Th>
                <Table.Th>Colaborador</Table.Th>
                <Table.Th>Resumo alterações</Table.Th>
                <Table.Th>Criado por</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Head>
              <Table.Body>
                {tasks.map(task => {
                  const chaves = Object.keys(task.changes);
                  const resumo = chaves.length > 5 ? 'Alteração completa (cadastro)' : chaves.join(', ');
                  return (
                    <tr key={task.id}>
                      <Table.Td className="t-data font-medium text-brand-text">{formatDateString(task.scheduled_date)}</Table.Td>
                      <Table.Td className="t-data">{task.matricula}</Table.Td>
                      <Table.Td className="font-medium text-ink">{collabNames[task.matricula] || '...'}</Table.Td>
                      <Table.Td className="text-ink-mute">{resumo}</Table.Td>
                      <Table.Td>{task.created_by}</Table.Td>
                      <Table.Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleEdit(task)}>
                            <Edit2 aria-hidden="true" size={14} /> Editar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleCancel(task.id)}>
                            Cancelar
                          </Button>
                        </div>
                      </Table.Td>
                    </tr>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </>
      )}

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
