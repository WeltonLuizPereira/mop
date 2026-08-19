import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { User, UserRole, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { generateId } from '../utils';
import {
  Button, Input, Select, Badge, Modal, Table, Carregando, FalhaAoCarregar,
} from '../components/ui';

export const CrudPage = <T extends { id: string, nome: string, status: string | EntityStatus }>({
  title, singular, data, onSave, onDelete, schema, currentUser, onRefresh
}: {
  key?: any, title: string, singular: string, data: Promise<T[]> | T[], onSave: (item: any) => Promise<void> | void, onDelete: (id: string) => Promise<void> | void, schema: { key: string, label: string, type: 'text' | 'select' | 'multiselect', options?: any[] | ((currentItem: any) => any[]) }[], currentUser: User, onRefresh: () => void
}) => {
    // ... same as original ...
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [currentItem, setCurrentItem] = useState<any>({});
    const [search, setSearch] = useState('');
    const [listData, setListData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [carregando, setCarregando] = useState(data instanceof Promise);
    const [falhou, setFalhou] = useState(false);

    const isAdmin = currentUser.role === UserRole.ADMIN;

    useEffect(() => {
        let valido = true;
        const load = async () => {
            if (!(data instanceof Promise)) { setListData(data); setCarregando(false); return; }
            setCarregando(true); setFalhou(false);
            try {
                const lista = await data;
                if (valido) setListData(lista);
            } catch {
                // lista vazia por falha e lista vazia por cadastro novo são
                // coisas diferentes, e só o aviso separa as duas
                if (valido) setFalhou(true);
            } finally {
                if (valido) setCarregando(false);
            }
        };
        load();
        return () => { valido = false; };
    }, [data]);

    const handleEdit = (item: any) => { setCurrentItem(item); setIsOpen(true); };
    const handleDeleteRequest = (item: T) => { setItemToDelete(item); setIsDeleteOpen(true); };
    const confirmDelete = async () => {
        if (itemToDelete) {
           await onDelete(itemToDelete.id);
           await db.addHistory({ action: `Exclusão de ${singular}`, target: itemToDelete.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: 'delete', details: `Registro removido permanentemente` });
           setIsDeleteOpen(false); setItemToDelete(null); onRefresh();
        }
    };
    const handleCreate = () => { setCurrentItem({ status: EntityStatus.ACTIVE }); setIsOpen(true); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        const isNew = !currentItem.id;
        const payload = { ...currentItem, id: currentItem.id || generateId() };
        await onSave(payload);
        await db.addHistory({ action: isNew ? `Criação de ${singular}` : `Edição de ${singular}`, target: payload.nome, user: currentUser.nome, date: new Date().toLocaleString('pt-BR'), type: isNew ? 'create' : 'update', details: isNew ? 'Novo registro criado' : 'Atualização de dados cadastrais' });
        setLoading(false); setIsOpen(false); onRefresh();
    };

    const filteredData = listData.filter(d => (d.nome || '').toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    return (
        <div className="space-y-4 mop-fade-up">
            <Table.Card className="flex flex-col min-h-0 flex-1">
                <Table.Toolbar
                  busca={{ valor: search, aoMudar: setSearch, rotulo: `Buscar ${title}`, placeholder: `Buscar em ${title.toLowerCase()}` }}
                  contagem={{ n: filteredData.length, um: 'registro', varios: 'registros' }}
                  acoes={isAdmin && <Button onClick={handleCreate}><Plus size={15} /> Novo {singular}</Button>}
                />
                {carregando ? (
                  <Carregando o_que="cadastros" />
                ) : falhou ? (
                  <FalhaAoCarregar
                    mensagem={`Não foi possível carregar ${title.toLowerCase()}.`}
                    aoTentar={onRefresh}
                    rotuloAcao="Tentar novamente"
                  />
                ) : (
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
                          {isAdmin && (<td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(item)} aria-label={`Editar ${item.nome}`} className="text-brand-text hover:text-brand-press p-1.5 bg-brand-wash rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDeleteRequest(item)} aria-label={`Excluir ${item.nome}`} className="text-danger hover:opacity-80 p-1.5 bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr><td colSpan={10} className="p-10">
                          <p className="text-center text-[13px] text-ink-mute">
                            {search
                              ? 'Nada com esse texto. Ajuste a busca.'
                              : `Nenhum ${singular} cadastrado. Use Novo ${singular} para criar o primeiro.`}
                          </p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                )}
            </Table.Card>
            <Modal
              open={isOpen}
              onClose={() => setIsOpen(false)}
              title={`${currentItem.id ? 'Editar' : 'Novo'} ${singular}`}
              rodape={
                <>
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit" form="form-cadastro" disabled={loading}>
                    {loading ? 'Salvando…' : 'Salvar'}
                  </Button>
                </>
              }
            >
                    <form id="form-cadastro" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    </form>
            </Modal>
            <Modal
              open={isDeleteOpen && Boolean(itemToDelete)}
              onClose={() => setIsDeleteOpen(false)}
              title={`Excluir ${singular}?`}
              tamanho="sm"
              semCabecalho
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="t-display-md text-ink mb-2">Excluir {singular}?</h3>
                <p className="text-ink-mute text-sm mb-6">
                  <b className="text-ink">{itemToDelete?.nome}</b> sai do cadastro. Quem já está ligado a
                  este registro continua no histórico.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                  <Button variant="solid-danger" onClick={confirmDelete}>Excluir</Button>
                </div>
              </div>
            </Modal>
        </div>
    );
};
