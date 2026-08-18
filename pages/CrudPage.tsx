import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { User, UserRole, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { generateId } from '../utils';
import {
    Button, EmptyState, IconButton, Input, InlineNotice, LoadingState,
    Modal, MultiSelect, PageToolbar, Select, Table, Tag,
} from '../components/ui';

const ROTULO_STATUS: Record<string, string> = {
    [EntityStatus.ACTIVE]: 'Ativo',
    [EntityStatus.INACTIVE]: 'Inativo',
};

export const CrudPage = <T extends { id: string, nome: string, status: string | EntityStatus }>({
  title, data, onSave, onDelete, schema, currentUser, onRefresh
}: {
  key?: any, title: string, data: Promise<T[]> | T[], onSave: (item: any) => Promise<void> | void, onDelete: (id: string) => Promise<void> | void, schema: { key: string, label: string, type: 'text' | 'select' | 'multiselect', options?: any[] | ((currentItem: any) => any[]) }[], currentUser: User, onRefresh: () => void
}) => {
    // ... same as original ...
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [currentItem, setCurrentItem] = useState<any>({});
    const [search, setSearch] = useState('');
    const [listData, setListData] = useState<T[]>([]);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const singular = title.slice(0, -1);

    useEffect(() => {
        let cancelado = false;
        const load = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                const resolved = data instanceof Promise ? await data : data;
                if (!cancelado) setListData(resolved);
            } catch {
                if (!cancelado) setLoadError(true);
            } finally {
                if (!cancelado) setIsLoading(false);
            }
        }
        load();
        return () => { cancelado = true; };
    }, [data]);

    const handleEdit = (item: any) => { setCurrentItem(item); setIsOpen(true); };
    const handleDeleteRequest = (item: T) => { setItemToDelete(item); setIsDeleteOpen(true); };
    const confirmDelete = async () => {
        if (itemToDelete) {
           await onDelete(itemToDelete.id);
           await db.addHistory({ action: `Exclusão de ${title.slice(0, -1)}`, target: itemToDelete.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: 'delete', details: `Registro removido permanentemente` });
           setIsDeleteOpen(false); setItemToDelete(null); onRefresh();
        }
    };
    const handleCreate = () => { setCurrentItem({ status: EntityStatus.ACTIVE }); setIsOpen(true); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const isNew = !currentItem.id;
        const payload = { ...currentItem, id: currentItem.id || generateId() };
        await onSave(payload);
        await db.addHistory({ action: isNew ? `Criação de ${title.slice(0, -1)}` : `Edição de ${title.slice(0, -1)}`, target: payload.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: isNew ? 'create' : 'update', details: isNew ? 'Novo registro criado' : 'Atualização de dados cadastrais' });
        setSaving(false); setIsOpen(false); onRefresh();
    };

    const filteredData = listData.filter(d => (d.nome || '').toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const selectColumns = schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select');

    return (
        <div className="flex flex-col gap-5">
            <PageToolbar
                filters={(
                    <div className="relative w-full max-w-sm">
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-faint" size={15} />
                        <Input aria-label={`Buscar ${title}`} className="pl-9" placeholder={`Buscar ${title}`} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                )}
                actions={isAdmin && <Button onClick={handleCreate}><Plus aria-hidden="true" size={16} /> Novo</Button>}
            />

            {isLoading ? (
                <div className="rounded-lg border border-hairline bg-canvas-soft"><LoadingState label="Carregando cadastros" /></div>
            ) : loadError ? (
                <InlineNotice
                    tone="error"
                    title={`Falha ao carregar ${title.toLowerCase()}`}
                    action={<Button variant="secondary" size="sm" onClick={onRefresh}>Tentar novamente</Button>}
                >
                    Não foi possível consultar os dados cadastrados.
                </InlineNotice>
            ) : filteredData.length === 0 ? (
                <div className="rounded-lg border border-hairline bg-canvas-soft">
                    <EmptyState
                        title="Nenhum registro encontrado"
                        description={search ? 'Ajuste a busca para encontrar o registro desejado.' : `Nenhum registro cadastrado em ${title.toLowerCase()}.`}
                        action={isAdmin ? <Button onClick={handleCreate}>Novo</Button> : undefined}
                    />
                </div>
            ) : (
                <Table label={title}>
                    <Table.Head>
                        <Table.Th>Nome</Table.Th>
                        <Table.Th>Status</Table.Th>
                        {selectColumns.map(s => (<Table.Th key={s.key}>{s.label}</Table.Th>))}
                        {isAdmin && <Table.Th className="text-right">Ações</Table.Th>}
                    </Table.Head>
                    <Table.Body>
                        {filteredData.map((item) => (
                            <Table.Row key={item.id}>
                                <Table.Td className="font-medium text-ink">{item.nome}</Table.Td>
                                <Table.Td><Tag>{ROTULO_STATUS[item.status] ?? item.status}</Tag></Table.Td>
                                {selectColumns.map(s => {
                                    const opts = typeof s.options === 'function' ? s.options(item) : s.options;
                                    const selectedOpt = opts?.find((o: any) => o.value === (item as any)[s.key]);
                                    return <Table.Td key={s.key}>{selectedOpt?.label || '—'}</Table.Td>;
                                })}
                                {isAdmin && (
                                    <Table.Td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <IconButton label={`Editar ${item.nome}`} icon={<Edit2 size={16} />} variant="ghost" size="sm" onClick={() => handleEdit(item)} />
                                            <IconButton label={`Excluir ${item.nome}`} icon={<Trash2 size={16} />} variant="danger" size="sm" onClick={() => handleDeleteRequest(item)} />
                                        </div>
                                    </Table.Td>
                                )}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}

            <Modal
                open={isOpen}
                onClose={() => setIsOpen(false)}
                title={`${currentItem.id ? 'Editar' : 'Novo'} ${singular.toLowerCase()}`}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {schema.map(field => {
                            const opts = typeof field.options === 'function' ? field.options(currentItem) : field.options;
                            return (
                                <div key={field.key} className={field.type === 'multiselect' ? 'col-span-1 md:col-span-2' : ''}>
                                    {field.type === 'text' && (
                                        <Input label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => setCurrentItem({ ...currentItem, [field.key]: e.target.value })} required={field.key !== 'logo'} />
                                    )}
                                    {field.type === 'select' && (
                                        <Select label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => {
                                            const newVal = e.target.value;
                                            // se mudar cliente, limpa operacao.
                                            if (field.key === 'clientId') {
                                                setCurrentItem({ ...currentItem, clientId: newVal, operationId: '' });
                                            } else {
                                                setCurrentItem({ ...currentItem, [field.key]: newVal });
                                            }
                                        }} required>
                                            <option value="">Selecione...</option>
                                            {opts?.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                        </Select>
                                    )}
                                    {field.type === 'multiselect' && (
                                        <MultiSelect
                                            label={field.label}
                                            options={opts ?? []}
                                            value={currentItem[field.key] || []}
                                            onChange={(vals) => setCurrentItem({ ...currentItem, [field.key]: vals })}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-hairline pt-4">
                        <Select label="Status" value={currentItem.status || EntityStatus.ACTIVE} onChange={(e: any) => setCurrentItem({ ...currentItem, status: e.target.value })}>
                            <option value={EntityStatus.ACTIVE}>Ativo</option>
                            <option value={EntityStatus.INACTIVE}>Inativo</option>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-hairline pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title={`Excluir ${singular.toLowerCase()}?`}
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="solid-danger" onClick={confirmDelete}>Excluir</Button>
                    </>
                )}
            >
                <p className="text-sm text-ink-2">
                    Tem certeza que deseja remover <strong className="text-ink">{itemToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
                </p>
            </Modal>
        </div>
    );
};
