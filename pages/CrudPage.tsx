import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, X } from 'lucide-react';
import { User, UserRole, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { generateId } from '../utils';
import { Button, Input, Select, Badge } from '../components/ui';

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
    const [loading, setLoading] = useState(false);

    const isAdmin = currentUser.role === UserRole.ADMIN;

    useEffect(() => {
        const load = async () => {
            if (data instanceof Promise) setListData(await data);
            else setListData(data);
        }
        load();
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
        e.preventDefault(); setLoading(true);
        const isNew = !currentItem.id;
        const payload = { ...currentItem, id: currentItem.id || generateId() };
        await onSave(payload);
        await db.addHistory({ action: isNew ? `Criação de ${title.slice(0, -1)}` : `Edição de ${title.slice(0, -1)}`, target: payload.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: isNew ? 'create' : 'update', details: isNew ? 'Novo registro criado' : 'Atualização de dados cadastrais' });
        setLoading(false); setIsOpen(false); onRefresh();
    };

    const filteredData = listData.filter(d => (d.nome || '').toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    return (
        <div className="space-y-4 mop-fade-up">
            {/* ... CRUD UI ... */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-fg">{title}</h2>
                {isAdmin && <Button onClick={handleCreate}><Plus size={16} /> Novo</Button>}
            </div>
            {/* Table ... */}
            <div className="bg-surface rounded-2xl shadow-1 border border-border overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="p-4 border-b border-border flex gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" size={16} />
                    <input className="pl-9 w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-sm text-fg focus:ring-2 focus:ring-primary outline-none transition-colors" placeholder={`Buscar ${title}...`} value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-fg-muted">
                    <thead className="bg-surface-alt text-fg-muted font-bold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Status</th>
                        {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => (<th key={s.key} className="p-4">{s.label}</th>))}
                        {isAdmin && <th className="p-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-alt transition-colors">
                          <td className="p-4 font-medium text-fg">{item.nome}</td>
                          <td className="p-4"><Badge status={item.status} /></td>
                          {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => {
    const opts = typeof s.options === 'function' ? s.options(item) : s.options;
    const selectedOpt = opts?.find(o => o.value === (item as any)[s.key]);
    return <td key={s.key} className="p-4">{selectedOpt?.label || '-'}</td>;
})}
                          {isAdmin && (<td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="text-primary hover:text-primary-dark p-1.5 bg-primary-tonal rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDeleteRequest(item)} className="text-error hover:opacity-80 p-1.5 bg-error/10 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr><td colSpan={10} className="p-10">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-fg-subtle text-sm">Nenhum registro encontrado</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
            {/* Modal ... */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="mop-pop-in bg-surface rounded-2xl shadow-3 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="bg-surface-alt p-4 border-b border-border flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg text-fg">{currentItem.id ? 'Editar' : 'Novo'} {title}</h3>
                      <button type="button" onClick={() => setIsOpen(false)} className="text-fg-subtle hover:text-fg"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {schema.map(field => {
                        const opts = typeof field.options === 'function' ? field.options(currentItem) : field.options;
                        return (
                        <div key={field.key} className={field.type === 'multiselect' ? 'col-span-1 md:col-span-2' : ''}>
                          {field.type === 'text' && <Input label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => setCurrentItem({...currentItem, [field.key]: e.target.value})} required={field.key !== 'logo'} />}
                          {field.type === 'select' && <Select label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => {
                                const newVal = e.target.value;
                                // se mudar cliente, limpa operacao.
                                if (field.key === 'clientId') {
                                    setCurrentItem({...currentItem, clientId: newVal, operationId: ''});
                                } else {
                                    setCurrentItem({...currentItem, [field.key]: newVal});
                                }
                          }} required><option value="">Selecione...</option>{opts?.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</Select>}
                          {field.type === 'multiselect' && (
                              <div className="mb-4">
                                  <label className="text-xs font-bold text-fg-muted uppercase block mb-1">{field.label}</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-surface-alt">
                                      {opts?.map((opt: any) => {
                                          const isSelected = (currentItem[field.key] || []).includes(opt.value);
                                          return (
                                              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface p-1 rounded text-fg">
                                                  <input
                                                      type="checkbox"
                                                      checked={isSelected}
                                                      onChange={(e) => {
                                                          const curr = currentItem[field.key] || [];
                                                          if (e.target.checked) {
                                                              setCurrentItem({...currentItem, [field.key]: [...curr, opt.value]});
                                                          } else {
                                                              setCurrentItem({...currentItem, [field.key]: curr.filter(v => v !== opt.value)});
                                                          }
                                                      }}
                                                      className="rounded text-primary focus:ring-primary border-border-strong"
                                                  />
                                                  {opt.label}
                                              </label>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                        </div>
                      );
                      })}
                       </div>
                      <div className="mt-2 pt-4 border-t border-border">
                        <Select label="Status" value={currentItem.status || EntityStatus.ACTIVE} onChange={(e: any) => setCurrentItem({...currentItem, status: e.target.value})}><option value={EntityStatus.ACTIVE}>Ativo</option><option value={EntityStatus.INACTIVE}>Inativo</option></Select>
                      </div>
                      <div className="mt-4 flex justify-end gap-3 shrink-0">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                      </div>
                    </form>
                  </div>
                </div>
            )}
            {/* Delete Modal ... */}
            {isDeleteOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="mop-pop-in bg-surface rounded-2xl shadow-3 w-full max-w-sm overflow-hidden">
                    <div className="p-6 text-center">
                       <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                       <h3 className="text-xl font-bold text-fg mb-2">Excluir {title.slice(0, -1)}?</h3>
                       <p className="text-fg-muted text-sm mb-6">Tem certeza que deseja remover <b>{itemToDelete.nome}</b>?</p>
                       <div className="flex gap-3 justify-center"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button><Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button></div>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};
