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
            <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden flex flex-col min-h-0 flex-1">
                {/* Uma barra só: buscar, contar, criar — o mesmo desenho da lista
                    de colaboradores, para as seis telas de cadastro. */}
                <div className="px-4 py-3.5 border-b border-hairline flex items-center flex-wrap gap-2.5">
                  <div className="relative w-full max-w-[340px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={15} />
                    <input
                      className="pl-9 w-full px-3 py-[7px] bg-canvas border border-hairline-2 rounded-sm text-[13px] text-ink placeholder:text-ink-faint"
                      placeholder={`Buscar em ${title.toLowerCase()}`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <span className="ml-auto text-[13px] text-ink-mute whitespace-nowrap">
                    <span className="t-data text-ink-2">{filteredData.length}</span> {filteredData.length === 1 ? 'registro' : 'registros'}
                  </span>
                  {isAdmin && <Button onClick={handleCreate}><Plus size={15} /> Novo</Button>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-ink-mute bg-canvas">
                    <thead>
                      <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Status</th>
                        {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => (<th key={s.key} className="p-4">{s.label}</th>))}
                        {isAdmin && <th className="p-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-canvas-soft transition-colors">
                          <td className="p-4 font-medium text-ink">{item.nome}</td>
                          <td className="p-4"><Badge status={item.status} /></td>
                          {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => {
    const opts = typeof s.options === 'function' ? s.options(item) : s.options;
    const selectedOpt = opts?.find(o => o.value === (item as any)[s.key]);
    return <td key={s.key} className="p-4">{selectedOpt?.label || '-'}</td>;
})}
                          {isAdmin && (<td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="text-brand-text hover:text-brand-press p-1.5 bg-brand-wash rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDeleteRequest(item)} className="text-danger hover:opacity-80 p-1.5 bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr><td colSpan={10} className="p-10">
                          <p className="text-center text-[13px] text-ink-mute">
                            {search
                              ? 'Nada com esse texto. Ajuste a busca.'
                              : `Nenhum registro em ${title.toLowerCase()}. Use Novo para criar o primeiro.`}
                          </p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
            {/* Modal ... */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="mop-pop-in bg-canvas rounded-xl shadow-3 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="bg-canvas-soft p-4 border-b border-hairline flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg text-ink">{currentItem.id ? 'Editar' : 'Novo'} {title}</h3>
                      <button type="button" onClick={() => setIsOpen(false)} className="text-ink-faint hover:text-ink"><X size={20}/></button>
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
                                  <label className="t-eyebrow text-ink-faint block mb-1">{field.label}</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-hairline rounded-lg bg-canvas-soft">
                                      {opts?.map((opt: any) => {
                                          const isSelected = (currentItem[field.key] || []).includes(opt.value);
                                          return (
                                              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-canvas p-1 rounded text-ink">
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
                                                      className="rounded text-brand-text focus:ring-brand border-hairline-2"
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
                      <div className="mt-2 pt-4 border-t border-hairline">
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
                    <div className="mop-pop-in bg-canvas rounded-xl shadow-3 w-full max-w-sm overflow-hidden">
                    <div className="p-6 text-center">
                       <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                       <h3 className="t-display-md text-ink mb-2">Excluir {title.slice(0, -1)}?</h3>
                       <p className="text-ink-mute text-sm mb-6">Tem certeza que deseja remover <b>{itemToDelete.nome}</b>?</p>
                       <div className="flex gap-3 justify-center"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button><Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button></div>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};
