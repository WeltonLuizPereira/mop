import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, UserCog, Building2, Globe, MapPin, Briefcase, 
  LogOut, Menu, X, Plus, Edit2, ChevronLeft, ChevronRight, Search, Phone,
  ShieldCheck, Upload, FileSpreadsheet, Trash2, CheckCircle, AlertCircle,
  Bell, Info, AlertTriangle, Gift, ArrowUpRight, ArrowDownRight, Eye,
  FileDown, Filter, CalendarDays, Wallet, Sun, Calendar, Clock, History, FileText, Check, XCircle, Lightbulb, Save,
  User as UserIcon, Cake, Mail, Hash, BriefcaseBusiness, CalendarClock, UserPlus, Loader2
} from 'lucide-react';
import { 
  User, UserRole, Collaborator, Coordinator, Supervisor, 
  Client, Operation, Ilha, CollaboratorStatus, EntityStatus, HistoryLog 
} from './types';
import { db } from './services/mockDb';
import { getCollaboratorCalculations, generateId, formatTime, parseExcelTime, parseExcelDate, calculateDaysDiff, formatDate, formatDateString } from './utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm";
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost: "text-gray-500 hover:text-gray-900"
  };
  return (
    <button className={`${base} ${styles[variant as keyof typeof styles]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
    <input 
      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
      {...props} 
    />
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
    <select 
      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
      {...props}
    >
      {children}
    </select>
  </div>
);

const Badge = ({ status }: { status: string }) => {
  let color = 'bg-gray-100 text-gray-600';
  if (status === 'ATIVO' || status === 'SIM' || status === 'APROVADO') color = 'bg-green-100 text-green-700';
  if (status === 'DESLIGADO' || status === 'INATIVO' || status === 'REJEITADO') color = 'bg-red-100 text-red-700';
  if (status === 'FÉRIAS' || status === 'PENDENTE') color = 'bg-yellow-100 text-yellow-700';
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {status}
    </span>
  );
};

// --- Core Logic Components ---

const CrudPage = <T extends { id: string, nome: string, status: string | EntityStatus }>({ 
  title, 
  data, 
  onSave, 
  onDelete,
  schema,
  currentUser
}: { 
  title: string, 
  data: T[], 
  onSave: (item: any) => void,
  onDelete: (id: string) => void,
  schema: { key: string, label: string, type: 'text' | 'select', options?: any[] }[],
  currentUser: User
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [search, setSearch] = useState('');

  const handleEdit = (item: any) => {
    setCurrentItem(item);
    setIsOpen(true);
  };

  const handleDeleteRequest = (item: T) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
       onDelete(itemToDelete.id);
       db.addHistory({
          action: `Exclusão de ${title.slice(0, -1)}`,
          target: itemToDelete.nome,
          user: currentUser.nome,
          date: new Date().toLocaleString('pt-BR'),
          type: 'delete'
       });
       setIsDeleteOpen(false);
       setItemToDelete(null);
    }
  };

  const handleCreate = () => {
    setCurrentItem({ status: EntityStatus.ACTIVE });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !currentItem.id;
    const payload = { ...currentItem, id: currentItem.id || generateId() };
    
    onSave(payload);
    
    // Log to History
    db.addHistory({
      action: isNew ? `Criação de ${title.slice(0, -1)}` : `Edição de ${title.slice(0, -1)}`,
      target: payload.nome,
      user: currentUser.nome,
      date: new Date().toLocaleString('pt-BR'),
      type: isNew ? 'create' : 'update'
    });

    setIsOpen(false);
  };

  const filteredData = data.filter(d => d.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Button onClick={handleCreate}><Plus size={16} /> Novo</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              className="pl-9 w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
              placeholder={`Buscar ${title}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">Status</th>
                {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => (
                   <th key={s.key} className="p-4">{s.label}</th>
                ))}
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-900">{item.nome}</td>
                  <td className="p-4"><Badge status={item.status} /></td>
                  {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => {
                    const selectedOpt = s.options?.find(o => o.value === (item as any)[s.key]);
                    return <td key={s.key} className="p-4">{selectedOpt?.label || '-'}</td>
                  })}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="text-brand-600 hover:text-brand-800 p-1 bg-brand-50 rounded" title="Editar">
                        <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteRequest(item)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded" title="Excluir">
                        <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">Nenhum registro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{currentItem.id ? 'Editar' : 'Novo'} {title}</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {schema.map(field => (
                <div key={field.key}>
                  {field.type === 'text' && (
                    <Input 
                      label={field.label} 
                      value={currentItem[field.key] || ''} 
                      onChange={(e: any) => setCurrentItem({...currentItem, [field.key]: e.target.value})}
                      required
                    />
                  )}
                  {field.type === 'select' && (
                    <Select
                      label={field.label}
                      value={currentItem[field.key] || ''}
                      onChange={(e: any) => setCurrentItem({...currentItem, [field.key]: e.target.value})}
                      required
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>
                  )}
                </div>
              ))}
               <Select
                  label="Status"
                  value={currentItem.status || EntityStatus.ACTIVE}
                  onChange={(e: any) => setCurrentItem({...currentItem, status: e.target.value})}
                >
                  <option value={EntityStatus.ACTIVE}>Ativo</option>
                  <option value={EntityStatus.INACTIVE}>Inativo</option>
                </Select>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir {title.slice(0, -1)}?</h3>
               <p className="text-gray-500 text-sm mb-6">
                 Tem certeza que deseja remover <b>{itemToDelete.nome}</b>? Esta ação não pode ser desfeita.
               </p>
               <div className="flex gap-3 justify-center">
                 <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                 <Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GenericCrudWrapper = ({ 
  title, 
  fetchData, 
  saveData, 
  deleteData, 
  schema, 
  currentUser 
}: any) => {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);
  const data = useMemo(() => fetchData(), [version, fetchData]);

  const handleSave = (item: any) => {
    saveData(item);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteData(id);
    refresh();
  };

  return (
    <CrudPage 
      title={title}
      data={data}
      onSave={handleSave}
      onDelete={handleDelete}
      schema={schema}
      currentUser={currentUser}
    />
  );
}

// --- Page Components ---

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = db.getUsers();
    const user = users.find(u => u.matricula === matricula && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciais inválidas. Verifique matrícula e senha.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-emerald-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-brand-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-600">
            <Phone size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MOP</h1>
          <p className="text-gray-500 text-sm">Mapa Operacional</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Matrícula" 
            placeholder="Ex: 3924" 
            value={matricula} 
            onChange={(e: any) => setMatricula(e.target.value)} 
          />
          <Input 
            label="Senha" 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
          />
          
          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
          
          <Button type="submit" className="w-full justify-center">Entrar</Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
          <p className="font-semibold mb-2">Credenciais de Teste (Admin):</p>
          <div className="bg-gray-50 p-3 rounded font-mono select-all">
            Matrícula: 3924<br/>
            Senha: Wljp.102002
          </div>
        </div>
      </div>
    </div>
  );
};

const ImportPage = ({ currentUser }: { currentUser: User }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'finish'>('upload');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLog([]);
      setPreview([]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    setLog(prev => [...prev, "Iniciando leitura do arquivo..."]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        setLog(prev => [...prev, `Arquivo lido. ${data.length} linhas encontradas.`]);
        setPreview(data);
        setStep('preview');
      } catch (err) {
        setLog(prev => [...prev, "Erro ao ler arquivo."]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    if (preview.length === 0) return;
    setLoading(true);
    
    // Simulating async process
    setTimeout(() => {
        const newCollaborators: Collaborator[] = [];

        preview.forEach((row: any) => {
             // Find or Create dependencies
            let coordId = '';
            if (row['COORDENADOR']) {
               const c = db.findOrCreateCoordinator(row['COORDENADOR']);
               coordId = c.id;
            }

            let supId = '';
            if (row['SUPERVISOR'] && coordId) {
                const s = db.findOrCreateSupervisor(row['SUPERVISOR'], coordId);
                supId = s.id;
            }

            let clientId = '';
            if (row['CLIENTE']) {
                const c = db.findOrCreateClient(row['CLIENTE']);
                clientId = c.id;
            }

            let opId = '';
            if (row['OPERAÇÃO'] && clientId) {
                const o = db.findOrCreateOperation(row['OPERAÇÃO'], clientId);
                opId = o.id;
            }

            let ilhaId = '';
            if (row['ILHA'] && clientId && opId && coordId && supId) {
                const i = db.findOrCreateIlha(row['ILHA'], clientId, opId, coordId, supId);
                ilhaId = i.id;
            }

            const collab: Collaborator = {
                matricula: String(row['MATRICULA']),
                nome: row['NOME'],
                email: row['EMAIL'] || `${row['MATRICULA']}@company.com`,
                status: row['STATUS'] || 'ATIVO',
                ilhaId,
                supervisorId: supId,
                coordinatorId: coordId,
                operationId: opId,
                clientId: clientId,
                dtEntradaProduto: parseExcelDate(row['DT_ENTRADA'] || row['DT ENTRADA PRODUTO'] || row['ADMISSAO']),
                horarioEntrada: parseExcelTime(row['HORARIO_ENTRADA'] || row['HORÁRIO DE ENTRADA'] || row['ENTRADA']),
                horarioSaida: parseExcelTime(row['HORARIO_SAIDA'] || row['HORÁRIO DE SAÍDA'] || row['SAIDA']),
                dtNasc: parseExcelDate(row['DT_NASC'] || row['NASCIMENTO']),
                dataFim: parseExcelDate(row['DATA FIM'])
            };

            newCollaborators.push(collab);
        });

        db.bulkCreateCollaborators(newCollaborators);
        db.addHistory({
            action: 'Importação em Massa',
            target: `${newCollaborators.length} colaboradores`,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'import'
        });

        setLog(prev => [...prev, `Importação concluída. ${newCollaborators.length} registros processados.`]);
        setLoading(false);
        setStep('finish');
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Importação de Dados</h2>
       </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          {step === 'upload' && (
              <div className="flex flex-col gap-4 max-w-xl">
                 <label className="block text-sm font-medium text-gray-700">Selecione o arquivo Excel (.xlsx)</label>
                 <div className="flex gap-4">
                     <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFile}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                     />
                     <Button onClick={processFile} disabled={!file || loading}>
                        {loading ? 'Lendo...' : 'Ler Arquivo'}
                     </Button>
                 </div>
              </div>
          )}

          {step === 'preview' && (
              <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">Prévia ({preview.length} linhas)</h3>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setStep('upload'); setPreview([]); }}>Cancelar</Button>
                        <Button onClick={confirmImport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16} />} 
                            Confirmar Importação
                        </Button>
                      </div>
                  </div>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96">
                      <table className="w-full text-left text-xs text-gray-600 whitespace-nowrap">
                          <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                              <tr>
                                  {preview.length > 0 && Object.keys(preview[0]).map(k => <th key={k} className="p-2 border-b">{k}</th>)}
                              </tr>
                          </thead>
                          <tbody>
                              {preview.slice(0, 50).map((row, i) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                      {Object.values(row).map((v: any, j) => <td key={j} className="p-2 border-b">{String(v)}</td>)}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {preview.length > 50 && <div className="p-2 text-center text-gray-400 italic">...e mais {preview.length - 50} linhas</div>}
                  </div>
              </div>
          )}
          
          {step === 'finish' && (
             <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Importação Concluída!</h3>
                <p className="text-gray-500 mt-2">Os dados foram salvos no sistema.</p>
                <div className="mt-6">
                   <Button onClick={() => { setStep('upload'); setFile(null); setPreview([]); setLog([]); }}>Nova Importação</Button>
                </div>
             </div>
          )}

          {log.length > 0 && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-600 max-h-40 overflow-y-auto border border-gray-200">
                  {log.map((l, i) => <div key={i}>{l}</div>)}
              </div>
          )}
       </div>
    </div>
  );
};

const UsersPage = ({ currentUser }: { currentUser: User }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentUserEdit, setCurrentUserEdit] = useState<Partial<User>>({});
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useEffect(() => {
        setUsers(db.getUsers());
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUserEdit.matricula && currentUserEdit.nome && currentUserEdit.password && currentUserEdit.role) {
            try {
                if (users.find(u => u.matricula === currentUserEdit.matricula)) {
                    // Update
                    db.updateUser(currentUserEdit as User);
                    db.addHistory({
                        action: 'Edição de Usuário',
                        target: currentUserEdit.nome,
                        user: currentUser.nome,
                        date: new Date().toLocaleString('pt-BR'),
                        type: 'update'
                    });
                } else {
                    // Create
                    db.addUser(currentUserEdit as User);
                    db.addHistory({
                        action: 'Novo Usuário',
                        target: currentUserEdit.nome,
                        user: currentUser.nome,
                        date: new Date().toLocaleString('pt-BR'),
                        type: 'create'
                    });
                }
                setUsers(db.getUsers());
                setIsOpen(false);
            } catch (err) {
                alert("Erro ao salvar usuário: " + err);
            }
        }
    };

    const handleDelete = () => {
        if (userToDelete) {
            db.deleteUser(userToDelete.matricula);
            db.addHistory({
                action: 'Exclusão de Usuário',
                target: userToDelete.nome,
                user: currentUser.nome,
                date: new Date().toLocaleString('pt-BR'),
                type: 'delete'
            });
            setUsers(db.getUsers());
            setIsDeleteOpen(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                   <h2 className="text-2xl font-bold text-gray-800">Usuários do Sistema</h2>
                   <p className="text-gray-500 text-sm">Gerencie quem tem acesso ao MOP</p>
                </div>
                <Button onClick={() => { setCurrentUserEdit({ role: UserRole.VIEWER }); setIsOpen(true); }}>
                    <Plus size={16}/> Novo Usuário
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b border-gray-100">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Matrícula</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Função</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.matricula} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                                        {u.nome.charAt(0)}
                                    </div>
                                    {u.nome}
                                </td>
                                <td className="p-4 font-mono text-xs">{u.matricula}</td>
                                <td className="p-4 text-gray-500">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setCurrentUserEdit(u); setIsOpen(true); }} className="text-brand-600 hover:text-brand-800 p-1 bg-brand-50 rounded" title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => { setUserToDelete(u); setIsDeleteOpen(true); }} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Gerenciar Usuário</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <Input label="Nome" value={currentUserEdit.nome || ''} onChange={(e:any) => setCurrentUserEdit({...currentUserEdit, nome: e.target.value})} required />
                            <Input label="Matrícula" value={currentUserEdit.matricula || ''} onChange={(e:any) => setCurrentUserEdit({...currentUserEdit, matricula: e.target.value})} required disabled={!!users.find(u => u.matricula === currentUserEdit.matricula)} />
                            <Input label="Email" type="email" value={currentUserEdit.email || ''} onChange={(e:any) => setCurrentUserEdit({...currentUserEdit, email: e.target.value})} required />
                            <Input label="Senha" type="password" value={currentUserEdit.password || ''} onChange={(e:any) => setCurrentUserEdit({...currentUserEdit, password: e.target.value})} required />
                            <Select label="Função" value={currentUserEdit.role || UserRole.VIEWER} onChange={(e:any) => setCurrentUserEdit({...currentUserEdit, role: e.target.value})}>
                                <option value={UserRole.ADMIN}>Administrador</option>
                                <option value={UserRole.VIEWER}>Visualizador</option>
                            </Select>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button type="submit">Salvar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteOpen && userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                         <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                             <AlertTriangle size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Usuário?</h3>
                         <p className="text-gray-500 text-sm mb-6">Confirma a exclusão de <b>{userToDelete.nome}</b>?</p>
                         <div className="flex gap-3 justify-center">
                             <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                             <Button variant="danger" onClick={handleDelete}>Excluir</Button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const VacationsPage = () => {
    const [vacations, setVacations] = useState<Collaborator[]>([]);

    useEffect(() => {
        const all = db.getCollaborators();
        const onVacation = all.filter(c => c.status === CollaboratorStatus.FERIAS || (c.feriasInicio && c.feriasFim));
        setVacations(onVacation);
    }, []);

    const getVacationStatus = (startStr: string, endStr: string) => {
        if (!startStr || !endStr) return { label: 'Indefinido', color: 'bg-gray-100 text-gray-500' };
        
        const now = new Date();
        now.setHours(0,0,0,0);
        const start = new Date(startStr);
        start.setDate(start.getDate() + 1); // Adjust for timezone if needed, simple logic here
        const end = new Date(endStr);
        end.setDate(end.getDate() + 1);

        if (now < start) return { label: 'Agendado', color: 'bg-blue-100 text-blue-700' };
        if (now > end) return { label: 'Concluído', color: 'bg-gray-100 text-gray-600' };
        return { label: 'Em Gozo', color: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <div>
                   <h2 className="text-2xl font-bold text-gray-800">Gestão de Férias</h2>
                   <p className="text-gray-500 text-sm">Acompanhamento de férias e ausências programadas</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b border-gray-100">
                        <tr>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4">Período</th>
                            <th className="p-4">Dias</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {vacations.map(c => {
                            const status = getVacationStatus(c.feriasInicio!, c.feriasFim!);
                            const days = c.feriasInicio && c.feriasFim 
                                ? Math.ceil((new Date(c.feriasFim).getTime() - new Date(c.feriasInicio).getTime()) / (1000 * 3600 * 24)) 
                                : 0;
                            return (
                                <tr key={c.matricula} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">
                                        {c.nome}
                                        <div className="text-xs text-gray-500 font-mono">{c.matricula}</div>
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                        {formatDateString(c.feriasInicio)} - {formatDateString(c.feriasFim)}
                                    </td>
                                    <td className="p-4 font-bold">{days} dias</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                         {vacations.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma programação de férias encontrada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const HistoryPage = () => {
    const [history, setHistory] = useState<HistoryLog[]>([]);

    useEffect(() => {
        setHistory(db.getHistory());
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <div>
                   <h2 className="text-2xl font-bold text-gray-800">Histórico do Sistema</h2>
                   <p className="text-gray-500 text-sm">Log de auditoria de todas as ações</p>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b border-gray-100">
                        <tr>
                            <th className="p-4">Data/Hora</th>
                            <th className="p-4">Ação</th>
                            <th className="p-4">Alvo</th>
                            <th className="p-4">Usuário</th>
                            <th className="p-4">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.map(h => (
                            <tr key={h.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-xs text-gray-500">{h.date}</td>
                                <td className="p-4 font-bold text-gray-800">{h.action}</td>
                                <td className="p-4 text-brand-600 font-medium">{h.target}</td>
                                <td className="p-4 flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[10px]">
                                        {h.user.charAt(0)}
                                    </div>
                                    {h.user}
                                </td>
                                <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={h.details}>{h.details || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const Dashboard = ({ currentUser, onNavigate }: { currentUser: User, onNavigate: (page: string) => void }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  
  useEffect(() => {
    setCollabs(db.getCollaborators());
    setOperations(db.getOperations());
  }, []);

  const stats = {
    total: collabs.length,
    active: collabs.filter(c => c.status === CollaboratorStatus.ATIVO).length,
    vacation: collabs.filter(c => c.status === CollaboratorStatus.FERIAS).length,
    off: collabs.filter(c => c.status === CollaboratorStatus.DESLIGADO).length,
  };

  const topOperations = operations.map(op => {
    const count = collabs.filter(c => c.operationId === op.id).length;
    return { 
      name: op.nome, 
      count, 
      percent: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
    };
  }).sort((a,b) => b.count - a.count).slice(0, 5);

  const today = new Date();
  const todayMonth = today.getMonth();

  const birthdaysMonth = collabs.filter(c => {
    if (c.status !== CollaboratorStatus.ATIVO) return false;
    if (!c.dtNasc) return false;
    if (typeof c.dtNasc !== 'string') return false; // Prevent crash if invalid type
    const parts = c.dtNasc.split('-');
    if (parts.length !== 3) return false;
    const m = parseInt(parts[1], 10);
    return (m - 1) === todayMonth;
  });

  const expiringContracts = collabs.filter(c => {
    if (c.status !== CollaboratorStatus.ATIVO) return false;
    const calc = getCollaboratorCalculations(c.dtEntradaProduto);
    if (calc.vence === '-' || !calc.vence) return false;
    const [d, m, y] = calc.vence.split('/').map(Number);
    const expiryDate = new Date(y, m - 1, d);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL COLABORADORES', val: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+4%', trendUp: true },
          { label: 'EM OPERAÇÃO / ATIVOS', val: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: '87% do quadro', trendUp: true },
          { label: 'EM FÉRIAS', val: stats.vacation, icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50', trend: 'Próximo retorno: 26/02', trendUp: null },
          { label: 'DESLIGADOS / LICENÇA', val: stats.off, icon: LogOut, color: 'text-gray-600', bg: 'bg-gray-100', trend: '-1% turnover', trendUp: false },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-900">{stat.val}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium">
               {stat.trendUp === true && <ArrowUpRight size={16} className="text-green-500" />}
               {stat.trendUp === false && <ArrowDownRight size={16} className="text-red-500" />}
               <span className={`${stat.trendUp === true ? 'text-green-600' : stat.trendUp === false ? 'text-red-600' : 'text-gray-500'}`}>
                 {stat.trend}
               </span>
               {stat.trendUp !== null && <span className="text-gray-400 font-normal ml-1">vs mês anterior</span>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Distribuição por Operação</h3>
          </div>
          <div className="space-y-5">
            {topOperations.map((op, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span className="text-gray-700">{op.name}</span>
                  <span className="text-gray-500">{op.percent}% ({op.count})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${op.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {topOperations.length === 0 && <p className="text-gray-400 text-center py-4">Sem dados de operação</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
           <h3 className="text-lg font-bold text-gray-900 mb-6">Avisos Recentes</h3>
           <div className="space-y-4 flex-1">
              <div 
                onClick={() => onNavigate('expiring')}
                className="bg-yellow-50 p-4 rounded-xl flex gap-3 items-start cursor-pointer hover:bg-yellow-100 transition-colors border border-transparent hover:border-yellow-200"
                role="button"
                title="Ver lista de vencimentos"
              >
                 <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600 shrink-0"><AlertTriangle size={20}/></div>
                 <div>
                   <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-yellow-900">Fim de Contrato Próximo</h4>
                      <ArrowUpRight size={14} className="text-yellow-600" />
                   </div>
                   <p className="text-xs text-yellow-700 mt-1">
                     {expiringContracts.length > 0 
                       ? `${expiringContracts.length} colaboradores vencem contrato em 7 dias.` 
                       : 'Nenhum contrato vencendo nos próximos 7 dias.'}
                   </p>
                 </div>
              </div>

              <div 
                onClick={() => onNavigate('birthdays')}
                className="bg-green-50 p-4 rounded-xl flex gap-3 items-start cursor-pointer hover:bg-green-100 transition-colors border border-transparent hover:border-green-200"
                role="button"
                title="Ver lista de aniversariantes"
              >
                 <div className="bg-green-100 p-2 rounded-lg text-green-600 shrink-0"><Cake size={20}/></div>
                 <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-green-900">Aniversariantes do Mês</h4>
                        <ArrowUpRight size={14} className="text-green-600" />
                    </div>
                   <p className="text-xs text-green-700 mt-1">
                     {birthdaysMonth.length > 0 
                       ? `${birthdaysMonth.length} colaboradores fazem aniversário este mês.` 
                       : 'Nenhum aniversariante este mês.'}
                   </p>
                 </div>
              </div>

               <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0"><Info size={20}/></div>
                 <div>
                   <h4 className="text-sm font-bold text-blue-900">Sistema Atualizado</h4>
                   <p className="text-xs text-blue-700 mt-1">Todos os cálculos de DSR e escalas estão em dia.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Dedicated Pages ---

const BirthdaysPage = ({ onBack }: { onBack: () => void }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  
  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    const allCollabs = db.getCollaborators();
    const filtered = allCollabs.filter(c => {
        if (c.status !== CollaboratorStatus.ATIVO) return false;
        if (!c.dtNasc) return false;
        if (typeof c.dtNasc !== 'string') return false; // Prevent crash
        const parts = c.dtNasc.split('-');
        if (parts.length !== 3) return false;
        const m = parseInt(parts[1], 10);
        return (m - 1) === currentMonth;
    }).sort((a, b) => {
        const dateA = typeof a.dtNasc === 'string' ? a.dtNasc : '';
        const dateB = typeof b.dtNasc === 'string' ? b.dtNasc : '';
        const partsA = dateA.split('-');
        const partsB = dateB.split('-');
        if (partsA.length !== 3 || partsB.length !== 3) return 0;
        
        const da = parseInt(partsA[2]);
        const db = parseInt(partsB[2]);
        return da - db;
    });

    setCollabs(filtered);
    setIlhas(db.getIlhas());
  }, []);

  const monthName = new Date().toLocaleString('pt-BR', { month: 'long' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex items-center gap-4">
           <Button variant="secondary" onClick={onBack}><ChevronLeft size={16}/> Voltar</Button>
           <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Gift className="text-brand-500"/> Aniversariantes de {monthName}
              </h2>
           </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b border-gray-100">
                   <tr>
                       <th className="p-4">Dia</th>
                       <th className="p-4">Nome</th>
                       <th className="p-4">Matrícula</th>
                       <th className="p-4">Ilha</th>
                       <th className="p-4">Data Completa</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                   {collabs.map(c => {
                       const day = typeof c.dtNasc === 'string' ? c.dtNasc.split('-')[2] : '??';
                       const ilha = ilhas.find(i => i.id === c.ilhaId);
                       return (
                           <tr key={c.matricula} className="hover:bg-gray-50">
                               <td className="p-4 font-bold text-brand-600 text-lg">{day}</td>
                               <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                               <td className="p-4 font-mono text-xs">{c.matricula}</td>
                               <td className="p-4">{ilha?.nome || '-'}</td>
                               <td className="p-4 text-gray-500">{formatDateString(c.dtNasc)}</td>
                           </tr>
                       )
                   })}
                   {collabs.length === 0 && (
                       <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum aniversariante neste mês.</td></tr>
                   )}
               </tbody>
           </table>
       </div>
    </div>
  );
};

const ExpiringContractsPage = ({ onBack }: { onBack: () => void }) => {
    const [collabs, setCollabs] = useState<{c: Collaborator, calc: any}[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
  
    useEffect(() => {
      const allCollabs = db.getCollaborators();
      const filtered = allCollabs
        .filter(c => c.status === CollaboratorStatus.ATIVO)
        .map(c => ({ c, calc: getCollaboratorCalculations(c.dtEntradaProduto) }))
        .filter(item => {
            if (item.calc.vence === '-' || !item.calc.vence) return false;
            const [d, m, y] = item.calc.vence.split('/').map(Number);
            const expiryDate = new Date(y, m - 1, d);
            const now = new Date();
            now.setHours(0,0,0,0);
            expiryDate.setHours(0,0,0,0);
            const diffTime = expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 30; 
        })
        .sort((a, b) => {
             const [da, ma, ya] = a.calc.vence.split('/').map(Number);
             const [db, mb, yb] = b.calc.vence.split('/').map(Number);
             return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
        });
  
      setCollabs(filtered);
      setIlhas(db.getIlhas());
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="secondary" onClick={onBack}><ChevronLeft size={16}/> Voltar</Button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500"/> Fim de Contrato de Experiência
                    </h2>
                    <p className="text-sm text-gray-500">Colaboradores com vencimento nos próximos 30 dias</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b border-gray-100">
                        <tr>
                            <th className="p-4">Vencimento</th>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Matrícula</th>
                            <th className="p-4">Ilha</th>
                            <th className="p-4">Data Entrada</th>
                            <th className="p-4">Dias Restantes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {collabs.map(({c, calc}) => {
                            const ilha = ilhas.find(i => i.id === c.ilhaId);
                            const [d, m, y] = calc.vence.split('/').map(Number);
                            const expiryDate = new Date(y, m - 1, d);
                            const now = new Date();
                            now.setHours(0,0,0,0);
                            const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            
                            let rowClass = "";
                            if (diffDays <= 7) rowClass = "bg-red-50 hover:bg-red-100";
                            else if (diffDays <= 15) rowClass = "bg-yellow-50 hover:bg-yellow-100";
                            else rowClass = "hover:bg-gray-50";

                            return (
                                <tr key={c.matricula} className={rowClass}>
                                    <td className="p-4 font-bold text-gray-900">{calc.vence}</td>
                                    <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                                    <td className="p-4 font-mono text-xs">{c.matricula}</td>
                                    <td className="p-4">{ilha?.nome || '-'}</td>
                                    <td className="p-4 text-gray-500">{formatDateString(c.dtEntradaProduto)}</td>
                                    <td className="p-4 font-bold">
                                        {diffDays === 0 ? 'Hoje' : `${diffDays} dias`}
                                    </td>
                                </tr>
                            )
                        })}
                        {collabs.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum vencimento próximo encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CollaboratorDetailPage = ({ collaborator, onBack, onEdit, currentUser }: { collaborator: Collaborator, onBack: () => void, onEdit: () => void, currentUser: User }) => {
    const [history, setHistory] = useState<HistoryLog[]>([]);
    const [ilha, setIlha] = useState<Ilha | undefined>();
    const [sup, setSup] = useState<Supervisor | undefined>();
    const [coord, setCoord] = useState<Coordinator | undefined>();
    const [client, setClient] = useState<Client | undefined>();
    const [op, setOp] = useState<Operation | undefined>();

    useEffect(() => {
        const allHistory = db.getHistory();
        const userHistory = allHistory.filter(h => h.target === collaborator.nome);
        setHistory(userHistory);

        const ilhas = db.getIlhas();
        const foundIlha = ilhas.find(i => i.id === collaborator.ilhaId);
        setIlha(foundIlha);

        setSup(db.getSupervisors().find(s => s.id === collaborator.supervisorId));
        setCoord(db.getCoordinators().find(c => c.id === collaborator.coordinatorId));
        setClient(db.getClients().find(c => c.id === collaborator.clientId));
        setOp(db.getOperations().find(o => o.id === collaborator.operationId));

    }, [collaborator]);

    const calcs = getCollaboratorCalculations(collaborator.dtEntradaProduto);
    const role = currentUser.role;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={onBack}><ChevronLeft size={16}/> Voltar</Button>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{collaborator.nome}</h2>
                        <div className="flex items-center gap-3 mt-1 text-gray-500 text-sm">
                            <span className="flex items-center gap-1 font-mono"><Hash size={14}/> {collaborator.matricula}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><Mail size={14}/> {collaborator.email}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                         <Badge status={collaborator.status} />
                         {role === UserRole.ADMIN && (
                            <Button onClick={onEdit} className="bg-brand-600 hover:bg-brand-700 text-white shadow-md">
                                <Edit2 size={16} /> Editar
                            </Button>
                         )}
                    </div>
                    <span className="text-xs text-gray-400">Atualizado em: {formatDateString(new Date().toISOString().split('T')[0])}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 text-brand-600 font-bold uppercase text-xs tracking-wider border-b border-gray-100 pb-2">
                        <UserIcon size={16}/> Dados Pessoais
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Data de Nascimento</p>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                                <Cake size={14} className="text-pink-400"/>
                                {formatDateString(collaborator.dtNasc)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Idade Estimada</p>
                            <p className="font-semibold text-gray-900">
                                {new Date().getFullYear() - new Date(collaborator.dtNasc).getFullYear()} anos
                            </p>
                        </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold uppercase text-xs tracking-wider border-b border-gray-100 pb-2">
                        <MapPin size={16}/> Alocação & Estrutura
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ilha</span>
                            <span className="font-bold text-gray-900">{ilha?.nome || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Supervisor</span>
                            <span className="font-bold text-gray-900">{sup?.nome || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Coordenador</span>
                            <span className="font-bold text-gray-900">{coord?.nome || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Operação</span>
                            <span className="font-bold text-gray-900">{op?.nome || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Cliente</span>
                            <span className="font-bold text-gray-900">{client?.nome || '-'}</span>
                        </div>
                    </div>
                 </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold uppercase text-xs tracking-wider border-b border-gray-100 pb-2">
                        <BriefcaseBusiness size={16}/> Contrato & Jornada
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Admissão</p>
                            <p className="font-bold text-gray-900">{formatDateString(collaborator.dtEntradaProduto)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Tempo de Casa</p>
                            <p className="font-bold text-gray-900">{calcs.tempoDeCasa} dias</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Horário</p>
                            <p className="font-mono font-bold text-gray-900 text-xs">
                                {formatTime(collaborator.horarioEntrada)} - {formatTime(collaborator.horarioSaida)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Experiência?</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${calcs.experiencia === 'SIM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {calcs.experiencia}
                            </span>
                        </div>
                        <div className="col-span-2 bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><AlertCircle size={12}/> Vencimento Experiência</p>
                            <p className="font-bold text-gray-900">{calcs.vence}</p>
                        </div>
                    </div>
                 </div>
             </div>

             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-8 text-gray-800 font-bold text-lg">
                    <History size={20}/> Histórico Completo
                </div>
                
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                    {history.map((log, index) => {
                        let iconColor = "bg-gray-200";
                        let ringColor = "ring-gray-100";
                        if (log.type === 'create') { iconColor = "bg-green-500"; ringColor = "ring-green-100"; }
                        if (log.type === 'update') { iconColor = "bg-blue-500"; ringColor = "ring-blue-100"; }
                        if (log.type === 'delete') { iconColor = "bg-red-500"; ringColor = "ring-red-100"; }
                        
                        return (
                            <div key={log.id} className="relative pl-8">
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${iconColor} ring-4 ${ringColor}`}></div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{log.action}</p>
                                        <p className="text-gray-500 text-sm mt-1">Realizado por: <span className="font-medium text-gray-700">{log.user}</span></p>
                                        {log.details && (
                                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                                                {log.details}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 font-mono mt-1 sm:mt-0">
                                        <CalendarClock size={12}/> {log.date}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {history.length === 0 && (
                        <div className="pl-8 text-gray-400 italic text-sm">Nenhum registro histórico encontrado para este colaborador.</div>
                    )}
                </div>
             </div>
        </div>
    )
}

const CollaboratorsPage = ({ currentUser }: { currentUser: User }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [coords, setCoords] = useState<Coordinator[]>([]);
  const [sups, setSups] = useState<Supervisor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Collaborator>>({});
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [opFilter, setOpFilter] = useState('');
  const [coordFilter, setCoordFilter] = useState('');
  const [supFilter, setSupFilter] = useState('');
  const [ilhaFilter, setIlhaFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const refreshData = () => {
    setCollabs(db.getCollaborators());
    setOperations(db.getOperations());
    setIlhas(db.getIlhas());
    setCoords(db.getCoordinators());
    setSups(db.getSupervisors());
    setClients(db.getClients());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (current.matricula && current.nome) {
        if (!isEditing && collabs.find(c => c.matricula === current.matricula)) {
            alert("Matrícula já existe!");
            return;
        }

        if (current.status === CollaboratorStatus.FERIAS) {
            if (!current.feriasInicio || !current.feriasFim) {
                alert("Para o status FÉRIAS, é necessário informar a Data de Início e Fim.");
                return;
            }
        }

        if (current.status === CollaboratorStatus.DESLIGADO) {
            if (!current.dataFim) {
                alert("Para o status DESLIGADO, é necessário informar a Data de Desligamento.");
                return;
            }
        }

        let details = "";
        if (isEditing) {
            const oldData = collabs.find(c => c.matricula === current.matricula);
            if (oldData) {
                const changes: string[] = [];
                if (oldData.nome !== current.nome) changes.push(`Nome alterado`);
                if (oldData.email !== current.email) changes.push(`Email alterado`);
                if (oldData.status !== current.status) changes.push(`Status: ${oldData.status} > ${current.status}`);
                if (oldData.ilhaId !== current.ilhaId) {
                    const oldIlha = ilhas.find(i => i.id === oldData.ilhaId)?.nome || 'N/A';
                    const newIlha = ilhas.find(i => i.id === current.ilhaId)?.nome || 'N/A';
                    changes.push(`Ilha: ${oldIlha} > ${newIlha}`);
                }
                
                if (changes.length > 0) details = changes.join('; ');
                else details = "Edição sem alterações visíveis";
            }
        }

        // Auto-Fill Hierarchy from Ilha
        const ilha = ilhas.find(i => i.id === current.ilhaId);
        const finalData = {
            ...current,
            coordinatorId: ilha?.coordinatorId || '',
            supervisorId: ilha?.supervisorId || '',
            operationId: ilha?.operationId || '',
            clientId: ilha?.clientId || '',
        };

        db.saveCollaborator(finalData as Collaborator);
        
        db.addHistory({
             action: isEditing ? 'Atualização de Colaborador' : 'Novo Colaborador',
             target: current.nome,
             user: currentUser.nome,
             date: new Date().toLocaleString('pt-BR'),
             type: isEditing ? 'update' : 'create',
             details: details
        });

        if (selectedCollab && selectedCollab.matricula === current.matricula) {
            setSelectedCollab(finalData as Collaborator);
        }

        refreshData();
        setIsOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedCollab) {
        db.deleteCollaborator(selectedCollab.matricula);
        db.addHistory({
             action: 'Exclusão de Colaborador',
             target: selectedCollab.nome,
             user: currentUser.nome,
             date: new Date().toLocaleString('pt-BR'),
             type: 'delete'
        });
        refreshData();
        setIsDeleteOpen(false);
        if (viewMode === 'detail') setViewMode('list');
    }
  };

  const currentRefDate = useMemo(() => {
      const now = new Date();
      return `01/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }, []);

  const handleExportExcel = () => {
     const dataToExport = filteredCollabs.map(c => {
         const ilha = ilhas.find(i => i.id === c.ilhaId);
         const op = operations.find(o => o.id === c.operationId);
         const client = clients.find(cl => cl.id === c.clientId);
         const coord = coords.find(o => o.id === c.coordinatorId);
         const sup = sups.find(s => s.id === c.supervisorId);
         const calcs = getCollaboratorCalculations(c.dtEntradaProduto);

         return {
             MATRICULA: c.matricula,
             EMAIL: c.email,
             NOME: c.nome,
             SUPERVISOR: sup?.nome || '-',
             ILHA: ilha?.nome || '-',
             STATUS: c.status,
             'DT ENTRADA PRODUTO': formatDateString(c.dtEntradaProduto),
             'DATA FIM': formatDateString(c.dataFim),
             'HORÁRIO DE ENTRADA': c.horarioEntrada,
             'HORÁRIO DE SÁIDA': c.horarioSaida,
             EXPERIENCIA: calcs.experiencia,
             'TEMPO DE CASA': calcs.tempoDeCasa,
             VENCE: calcs.vence,
             DT_NASC: formatDateString(c.dtNasc),
             REFERENCIA: currentRefDate,
             COORDENADOR: coord?.nome || '-',
             OPERAÇÃO: op?.nome || '-',
             CLIENTE: client?.nome || '-'
         };
     });

     const lib = (XLSX as any).utils ? XLSX : (XLSX as any).default;
     if (lib && lib.utils) {
         const ws = lib.utils.json_to_sheet(dataToExport);
         const wb = lib.utils.book_new();
         lib.utils.book_append_sheet(wb, ws, "Colaboradores");
         lib.writeFile(wb, "Colaboradores_MOP.xlsx");
     } else {
         alert("Erro ao carregar biblioteca de exportação.");
     }
  };

  const handleExportPDF = () => {
     const doc = new jsPDF('l', 'mm', 'a4');
     doc.text("Relatório de Colaboradores - MOP", 14, 15);
     
     const tableData = filteredCollabs.map(c => {
         const ilha = ilhas.find(i => i.id === c.ilhaId);
         return [
            c.matricula,
            c.nome,
            c.status,
            ilha?.nome || '-',
            formatDateString(c.dtEntradaProduto),
            formatTime(c.horarioEntrada) + ' - ' + formatTime(c.horarioSaida)
         ]
     });

     autoTable(doc, {
         head: [['Matrícula', 'Nome', 'Status', 'Ilha', 'Entrada', 'Horário']],
         body: tableData,
         startY: 20,
     });

     doc.save("Colaboradores_MOP.pdf");
  };

  const openViewPage = (c: Collaborator) => {
    setSelectedCollab(c);
    setViewMode('detail');
  };

  const openEditModal = (c: Collaborator) => {
    setCurrent(c);
    setIsEditing(true);
    setIsOpen(true);
  };

  const openNewModal = () => {
    setCurrent({ 
        status: CollaboratorStatus.ATIVO,
        horarioEntrada: '09:00:00',
        horarioSaida: '18:00:00'
    });
    setIsEditing(false);
    setIsOpen(true);
  };

  const openDeleteModal = (c: Collaborator) => {
    setSelectedCollab(c);
    setIsDeleteOpen(true);
  };

  const filteredCollabs = collabs.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.matricula.includes(searchTerm);
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesOp = opFilter ? c.operationId === opFilter : true;
    const matchesCoord = coordFilter ? c.coordinatorId === coordFilter : true;
    const matchesSup = supFilter ? c.supervisorId === supFilter : true;
    const matchesIlha = ilhaFilter ? c.ilhaId === ilhaFilter : true;
    const matchesClient = clientFilter ? c.clientId === clientFilter : true;

    return matchesSearch && matchesStatus && matchesOp && matchesCoord && matchesSup && matchesIlha && matchesClient;
  });
  
  const role = currentUser.role;

  // Filter supervisors based on selected coordinator
  const filteredSups = current.coordinatorId 
     ? sups.filter(s => s.coordinatorId === current.coordinatorId)
     : sups;

  if (viewMode === 'detail' && selectedCollab) {
      return (
        <CollaboratorDetailPage 
            collaborator={selectedCollab} 
            onBack={() => { setViewMode('list'); setSelectedCollab(null); }} 
            onEdit={() => openEditModal(selectedCollab)}
            currentUser={currentUser}
        />
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Colaboradores</h2>
           <p className="text-gray-500 text-sm">Gerencie a base completa de operadores</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto">
             <Button variant="secondary" onClick={handleExportExcel} title="Exportar Excel">
                <FileSpreadsheet size={18}/> <span className="hidden md:inline">Excel</span>
             </Button>
             <Button variant="secondary" onClick={handleExportPDF} title="Exportar PDF">
                <FileText size={18}/> <span className="hidden md:inline">PDF</span>
             </Button>
             <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className={`${showFilters ? 'bg-gray-100' : ''}`}>
                <Filter size={18} />
             </Button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {role === UserRole.ADMIN && (
            <button onClick={openNewModal} className="w-full md:w-auto px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
                <Plus size={16}/> Novo
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Operação</label>
                <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" value={opFilter} onChange={(e) => setOpFilter(e.target.value)}>
                    <option value="">Todas</option>
                    {operations.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Coordenador</label>
                <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" value={coordFilter} onChange={(e) => setCoordFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {coords.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Supervisor</label>
                <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" value={supFilter} onChange={(e) => setSupFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {sups.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
            </div>
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Ilha</label>
                <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" value={ilhaFilter} onChange={(e) => setIlhaFilter(e.target.value)}>
                    <option value="">Todas</option>
                    {ilhas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
            </div>
             <div className="flex items-end lg:col-span-2">
                <button onClick={() => { 
                    setStatusFilter(''); 
                    setOpFilter(''); 
                    setSearchTerm(''); 
                    setCoordFilter('');
                    setSupFilter('');
                    setIlhaFilter('');
                    setClientFilter('');
                }} className="text-sm text-red-500 hover:text-red-700 font-medium">
                    Limpar Filtros
                </button>
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="overflow-auto relative">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="p-4">Matrícula</th>
                <th className="p-4">Email</th>
                <th className="p-4">Nome</th>
                <th className="p-4">Supervisor</th>
                <th className="p-4">Ilha</th>
                <th className="p-4">Status</th>
                <th className="p-4">Dt Entrada</th>
                <th className="p-4">Data Fim</th>
                <th className="p-4">Hr Entrada</th>
                <th className="p-4">Hr Saída</th>
                <th className="p-4">Exp?</th>
                <th className="p-4">Tempo Casa</th>
                <th className="p-4">Vence</th>
                <th className="p-4">Dt Nasc</th>
                <th className="p-4">Referência</th>
                <th className="p-4">Coordenador</th>
                <th className="p-4">Operação</th>
                <th className="p-4">Cliente</th>
                <th className="p-4 text-right sticky right-0 bg-gray-50 shadow-sm z-10">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCollabs.map(c => {
                 const ilha = ilhas.find(i => i.id === c.ilhaId);
                 const sup = sups.find(s => s.id === c.supervisorId);
                 const coord = coords.find(o => o.id === c.coordinatorId);
                 const op = operations.find(o => o.id === c.operationId);
                 const client = clients.find(cl => cl.id === c.clientId);
                 const calcs = getCollaboratorCalculations(c.dtEntradaProduto);
                 
                 const ilhaName = ilha?.nome || '-';
                 const supName = sup?.nome || '-';
                 const coordName = coord?.nome || '-';
                 const opName = op?.nome || '-';
                 const clientName = client?.nome || '-';

                 return (
                  <tr key={c.matricula} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold text-gray-500">{c.matricula}</td>
                    <td className="p-4 text-gray-500 text-xs truncate max-w-[150px]" title={c.email}>{c.email}</td>
                    <td className="p-4 font-medium text-gray-900">{c.nome}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={supName}>{supName}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={ilhaName}>{ilhaName}</td>
                    <td className="p-4"><Badge status={c.status} /></td>
                    <td className="p-4 text-gray-500 text-xs">{formatDateString(c.dtEntradaProduto)}</td>
                    <td className="p-4 text-gray-500 text-xs">{formatDateString(c.dataFim)}</td>
                    <td className="p-4 text-gray-500 text-xs font-mono">{formatTime(c.horarioEntrada)}</td>
                    <td className="p-4 text-gray-500 text-xs font-mono">{formatTime(c.horarioSaida)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${calcs.experiencia === 'SIM' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>
                        {calcs.experiencia}
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs">{calcs.tempoDeCasa}</td>
                    <td className="p-4 text-gray-500 text-xs">{calcs.vence}</td>
                    <td className="p-4 text-gray-500 text-xs">{formatDateString(c.dtNasc)}</td>
                    <td className="p-4 text-gray-500 text-xs">{currentRefDate}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={coordName}>{coordName}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={opName}>{opName}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={clientName}>{clientName}</td>
                    
                    <td className="p-4 text-right sticky right-0 bg-white group-hover:bg-blue-50/30 z-10 shadow-sm border-l border-gray-100">
                       <div className="flex justify-end gap-1">
                          <button onClick={() => openViewPage(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar">
                            <Eye size={16} />
                          </button>
                          
                          {role === UserRole.ADMIN && (
                            <>
                              <button onClick={() => openEditModal(c)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => openDeleteModal(c)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Deletar">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                )
              })}
              {filteredCollabs.length === 0 && (
                <tr>
                   <td colSpan={19} className="p-8 text-center text-gray-400">Nenhum colaborador encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <span className="text-xs text-gray-500 font-medium">Total: <b>{filteredCollabs.length}</b> colaboradores listados</span>
        </div>
      </div>

       {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">
                {current.matricula && isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setIsOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider border-b pb-2">Dados Pessoais</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Matrícula" value={current.matricula || ''} onChange={(e: any) => setCurrent({...current, matricula: e.target.value})} required disabled={isEditing} />
                    <Input label="Data Nascimento" type="date" value={current.dtNasc || ''} onChange={(e: any) => setCurrent({...current, dtNasc: e.target.value})} required />
                  </div>
                  <Input label="Nome Completo" value={current.nome || ''} onChange={(e: any) => setCurrent({...current, nome: e.target.value})} required />
                  <Input label="Email" type="email" value={current.email || ''} onChange={(e: any) => setCurrent({...current, email: e.target.value})} required />
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider border-b pb-2">Alocação</h4>
                  <Select 
                    label="Ilha (Preenche Auto: Coord/Sup/Cliente/Op)" 
                    value={current.ilhaId || ''} 
                    onChange={(e: any) => {
                      const iId = e.target.value;
                      const ilha = ilhas.find(i => i.id === iId);
                      setCurrent({
                        ...current, 
                        ilhaId: iId, 
                        supervisorId: ilha?.supervisorId || '',
                        coordinatorId: ilha?.coordinatorId || '',
                        clientId: ilha?.clientId || '',
                        operationId: ilha?.operationId || ''
                      });
                    }} 
                    required
                  >
                    <option value="">Selecione a Ilha...</option>
                    {ilhas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <Select 
                        label="Status" 
                        value={current.status || ''} 
                        onChange={(e: any) => {
                             const newStatus = e.target.value;
                             const updates: any = { status: newStatus };
                             if (newStatus === CollaboratorStatus.DESLIGADO && !current.dataFim) {
                                 updates.dataFim = new Date().toISOString().split('T')[0];
                             }
                             setCurrent({...current, ...updates});
                        }}
                    >
                      {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Input label="Data Entrada" type="date" value={current.dtEntradaProduto || ''} onChange={(e: any) => setCurrent({...current, dtEntradaProduto: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Horário Entrada" type="time" step="1" value={current.horarioEntrada || ''} onChange={(e: any) => setCurrent({...current, horarioEntrada: e.target.value})} required />
                    <Input label="Horário Saída" type="time" step="1" value={current.horarioSaida || ''} onChange={(e: any) => setCurrent({...current, horarioSaida: e.target.value})} required />
                  </div>

                  {current.status === CollaboratorStatus.FERIAS && (
                      <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-inner animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 mb-3 text-yellow-700 font-bold border-b border-yellow-200 pb-2">
                              <Sun size={20} />
                              <span>Programação de Férias</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Início das Férias" 
                                type="date" 
                                value={current.feriasInicio || ''} 
                                onChange={(e: any) => setCurrent({...current, feriasInicio: e.target.value})} 
                                required
                                className="w-full px-3 py-2 bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                              />
                              <Input 
                                label="Fim das Férias" 
                                type="date" 
                                value={current.feriasFim || ''} 
                                onChange={(e: any) => setCurrent({...current, feriasFim: e.target.value})} 
                                required
                                className="w-full px-3 py-2 bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                              />
                          </div>
                          <p className="text-xs text-yellow-600 mt-2">
                             <Info size={12} className="inline mr-1"/>
                             O colaborador ficará listado na página de "Gestão de Férias" durante este período.
                          </p>
                      </div>
                  )}

                  {current.status === CollaboratorStatus.DESLIGADO && (
                        <div className="md:col-span-2 bg-red-50 p-4 rounded-xl border border-red-200 shadow-inner animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-3 text-red-700 font-bold border-b border-red-200 pb-2">
                                <LogOut size={20} />
                                <span>Registro de Desligamento</span>
                            </div>
                            <Input
                                label="Data de Desligamento (Data Fim)"
                                type="date"
                                value={current.dataFim || ''}
                                onChange={(e: any) => setCurrent({...current, dataFim: e.target.value})}
                                required
                                className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                   )}

                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <div className="md:col-span-4 text-xs text-gray-400 font-semibold uppercase">Dados da Estrutura & Gestão</div>
                   <Select 
                      label="Coordenador" 
                      value={current.coordinatorId || ''} 
                      onChange={(e: any) => setCurrent({...current, coordinatorId: e.target.value})}
                   >
                      <option value="">Selecione...</option>
                      {coords.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </Select>
                   <Select 
                      label="Supervisor" 
                      value={current.supervisorId || ''} 
                      onChange={(e: any) => setCurrent({...current, supervisorId: e.target.value})}
                   >
                      <option value="">Selecione...</option>
                      {filteredSups.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                   </Select>
                   <Select label="Cliente" value={current.clientId || ''} disabled>
                      <option value="">-</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </Select>
                   <Select label="Operação" value={current.operationId || ''} disabled>
                      <option value="">-</option>
                      {operations.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                   </Select>
                </div>

              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                 <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                 <Button type="submit">Salvar Dados</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && selectedCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Colaborador?</h3>
               <p className="text-gray-500 text-sm mb-6">
                 Tem certeza que deseja remover <b>{selectedCollab.nome}</b>? Esta ação não pode ser desfeita.
               </p>
               <div className="flex gap-3 justify-center">
                 <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                 <Button variant="danger" onClick={handleDelete}>Sim, Excluir</Button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Simple session persistence
  useEffect(() => {
    const saved = localStorage.getItem('mop_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('mop_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mop_user');
    setCurrentPage('dashboard');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
       {/* Sidebar */}
       <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="p-6 flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                <Phone size={20} />
             </div>
             <div>
                <h1 className="font-bold text-xl text-gray-900">MOP</h1>
                <p className="text-xs text-gray-500">Quality Contact Center</p>
             </div>
          </div>
          
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
             
             <div className="mb-6">
                <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Principal</div>
                <div className="space-y-1">
                    <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={20}/> Visão Geral
                    </button>
                    <button onClick={() => setCurrentPage('collaborators')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'collaborators' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <Users size={20}/> Colaboradores
                    </button>
                    <button onClick={() => setCurrentPage('vacations')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'vacations' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <Sun size={20}/> Gestão de Férias
                    </button>
                </div>
             </div>

             {user.role === UserRole.ADMIN && (
               <>
                 <div className="mb-6">
                    <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cadastros</div>
                    <div className="space-y-1">
                        <button onClick={() => setCurrentPage('clients')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'clients' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Building2 size={20}/> Clientes
                        </button>
                        <button onClick={() => setCurrentPage('operations')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'operations' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Briefcase size={20}/> Operações
                        </button>
                        <button onClick={() => setCurrentPage('ilhas')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'ilhas' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <MapPin size={20}/> Ilhas
                        </button>
                        <button onClick={() => setCurrentPage('coordinators')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'coordinators' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <UserCog size={20}/> Coordenadores
                        </button>
                        <button onClick={() => setCurrentPage('supervisors')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'supervisors' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <UserCog size={20}/> Supervisores
                        </button>
                    </div>
                 </div>

                 <div className="mb-6">
                    <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Administração</div>
                    <div className="space-y-1">
                        <button onClick={() => setCurrentPage('users')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'users' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <UserPlus size={20}/> Usuários
                        </button>
                        <button onClick={() => setCurrentPage('import')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'import' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Upload size={20}/> Importar Dados
                        </button>
                        <button onClick={() => setCurrentPage('history')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${currentPage === 'history' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <History size={20}/> Histórico
                        </button>
                    </div>
                 </div>
               </>
             )}
          </nav>

          <div className="p-4 border-t border-gray-100">
             <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                   {user.nome.charAt(0)}
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-medium text-gray-900 truncate">{user.nome.split(' ')[0]}</p>
                   <p className="text-xs text-gray-500">{user.role}</p>
                </div>
             </div>
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <LogOut size={16}/> Sair
             </button>
          </div>
       </aside>

       {/* Main Area */}
       <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Phone className="text-brand-600" size={24}/>
                <span className="font-bold text-gray-900">MOP</span>
             </div>
             <button className="text-gray-500" onClick={() => {
                // Mobile Menu Toggle would go here
                alert('Menu Mobile - Not Implemented in this specific view fix'); 
             }}>
                <Menu size={24}/>
             </button>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8">
             {currentPage === 'dashboard' && <Dashboard currentUser={user} onNavigate={setCurrentPage} />}
             {currentPage === 'birthdays' && <BirthdaysPage onBack={() => setCurrentPage('dashboard')} />}
             {currentPage === 'expiring' && <ExpiringContractsPage onBack={() => setCurrentPage('dashboard')} />}
             
             {currentPage === 'collaborators' && <CollaboratorsPage currentUser={user} />}
             
             {currentPage === 'vacations' && <VacationsPage />}
             {currentPage === 'users' && <UsersPage currentUser={user} />}
             {currentPage === 'history' && <HistoryPage />}

             {currentPage === 'coordinators' && (
                <GenericCrudWrapper 
                   title="Coordenadores" 
                   fetchData={() => db.getCoordinators()} 
                   saveData={(d: any) => db.saveCoordinator(d)} 
                   deleteData={(id: string) => db.deleteCoordinator(id)}
                   schema={[{key: 'nome', label: 'Nome', type: 'text'}]}
                   currentUser={user}
                />
             )}
             {currentPage === 'supervisors' && (
                <GenericCrudWrapper 
                   title="Supervisores" 
                   fetchData={() => db.getSupervisors()} 
                   saveData={(d: any) => db.saveSupervisor(d)} 
                   deleteData={(id: string) => db.deleteSupervisor(id)}
                   schema={[
                      {key: 'nome', label: 'Nome', type: 'text'},
                      {key: 'coordinatorId', label: 'Coordenador', type: 'select', options: db.getCoordinators().map(c => ({value: c.id, label: c.nome}))}
                   ]}
                   currentUser={user}
                />
             )}
             {currentPage === 'clients' && (
                <GenericCrudWrapper 
                   title="Clientes" 
                   fetchData={() => db.getClients()} 
                   saveData={(d: any) => db.saveClient(d)} 
                   deleteData={(id: string) => db.deleteClient(id)}
                   schema={[{key: 'nome', label: 'Nome', type: 'text'}]}
                   currentUser={user}
                />
             )}
             {currentPage === 'operations' && (
                <GenericCrudWrapper 
                   title="Operações" 
                   fetchData={() => db.getOperations()} 
                   saveData={(d: any) => db.saveOperation(d)} 
                   deleteData={(id: string) => db.deleteOperation(id)}
                   schema={[
                      {key: 'nome', label: 'Nome', type: 'text'},
                      {key: 'clientId', label: 'Cliente', type: 'select', options: db.getClients().map(c => ({value: c.id, label: c.nome}))}
                   ]}
                   currentUser={user}
                />
             )}
             {currentPage === 'ilhas' && (
                <GenericCrudWrapper 
                   title="Ilhas" 
                   fetchData={() => db.getIlhas()} 
                   saveData={(d: any) => db.saveIlha(d)} 
                   deleteData={(id: string) => db.deleteIlha(id)}
                   schema={[
                      {key: 'nome', label: 'Nome', type: 'text'},
                      {key: 'coordinatorId', label: 'Coordenador', type: 'select', options: db.getCoordinators().map(c => ({value: c.id, label: c.nome}))},
                      {key: 'supervisorId', label: 'Supervisor', type: 'select', options: db.getSupervisors().map(c => ({value: c.id, label: c.nome}))},
                      {key: 'clientId', label: 'Cliente', type: 'select', options: db.getClients().map(c => ({value: c.id, label: c.nome}))},
                      {key: 'operationId', label: 'Operação', type: 'select', options: db.getOperations().map(c => ({value: c.id, label: c.nome}))}
                   ]}
                   currentUser={user}
                />
             )}
             {currentPage === 'import' && <ImportPage currentUser={user} />}
          </div>
       </main>
    </div>
  );
};

export default App;