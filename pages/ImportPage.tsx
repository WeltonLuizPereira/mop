import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Trash2, CheckCircle, CalendarClock, Loader2, X } from 'lucide-react';
import { User, Collaborator, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { generateId, parseExcelTime, parseExcelDate } from '../utils';
import * as XLSX from 'xlsx';
import { Button } from '../components/ui';

export const ImportPage: React.FC<{ currentUser: User, onRefresh: () => void }> = ({ currentUser, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'import' | 'update'>('import');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [rawRows, setRawRows] = useState<any[]>([]); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [stats, setStats] = useState({ found: 0 });

    const handleTabChange = (tab: 'import' | 'update') => {
        setActiveTab(tab);
        setFile(null);
        setRawRows([]);
        setPreview([]);
        setStats({ found: 0 });
        setIsScheduling(false);
        setScheduleDate('');
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (f: File) => {
        try {
            const data = await f.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet); 
            
            setRawRows(json);
            setStats({ found: json.length });
            
            if (activeTab === 'import') {
                const mappedPreview = json.slice(0, 5).map((row: any) => ({
                    matricula: row['MATRICULA'] || row['Matricula'] || row['Matrícula'],
                    nome: row['NOME'] || row['Nome'],
                    status: row['STATUS'] || row['Status'],
                    ilha: row['ILHA'] || row['Ilha']
                }));
                setPreview(mappedPreview);
            } else {
                const mappedPreview = json.slice(0, 5).map((row: any) => ({
                    matricula: row['MATRICULA'] || row['Matricula'] || row['Matrícula'],
                    supervisor: row['SUPERVISOR'] || row['Supervisor'],
                    ilha: row['ILHA'] || row['Ilha'],
                    referencia: row['REFERENCIA'] || row['Referencia'] || row['Referência']
                }));
                setPreview(mappedPreview);
            }
        } catch (error) {
            alert("Erro ao ler arquivo: " + error);
        }
    };

    const handleImport = async () => {
        if (rawRows.length === 0) return;
        setIsProcessing(true);
        try {
            const newCollaborators: Collaborator[] = [];
            for (const row of rawRows) {
                const clientName = row['CLIENTE'] || row['Cliente'] || 'N/A';
                const client = await db.findOrCreateClient(clientName);

                const opName = row['OPERAÇÃO'] || row['OPERACAO'] || row['Operação'] || 'N/A';
                const operation = await db.findOrCreateOperation(opName, client.id);

                const coordName = row['COORDENADOR'] || row['Coordenador'] || 'N/A';
                const coordinator = await db.findOrCreateCoordinator(coordName);

                const supName = row['SUPERVISOR'] || row['Supervisor'] || 'N/A';
                const supervisor = await db.findOrCreateSupervisor(supName, [coordinator.id]);

                const ilhaName = row['ILHA'] || row['Ilha'] || 'N/A';
                const ilha = await db.findOrCreateIlha(ilhaName, client.id, operation.id, [coordinator.id], [supervisor.id]);

                const dtEntrada = parseExcelDate(row['DT ENTRADA PRODUTO'] || row['ADMISSAO'] || row['Data Entrada'] || row['DATA ENTRADA']);
                const dtNasc = parseExcelDate(row['DT_NASC'] || row['NASCIMENTO'] || row['Data Nascimento'] || row['Nascimento']);
                
                let dtDesligamentoRaw = row['DATA FIM'] || row['Data Fim'] || row['DATA_FIM'] || row['DATA DESLIGAMENTO'] || row['Data Desligamento'] || row['DT DESLIGAMENTO'] || row['DEMISSAO'] || row['Demissao'] || row['DT_SAIDA'] || row['DT_FIM'];
                
                if (!dtDesligamentoRaw) {
                     const key = Object.keys(row).find(k => {
                         const u = k.toUpperCase().trim();
                         return u === 'DATA FIM' || u === 'DT FIM' || u.includes('DESLIGAMENTO');
                     });
                     if (key) dtDesligamentoRaw = row[key];
                }

                const dtDesligamento = parseExcelDate(dtDesligamentoRaw);

                let hrSaidaRaw = row['HORÁRIO DE SÁIDA'] || row['HORÁRIO DE SAÍDA'] || row['HORARIO DE SAIDA'] || row['Saída'] || row['SAIDA'];
                if (!hrSaidaRaw) {
                     const key = Object.keys(row).find(k => k.toUpperCase().includes('SA') && (k.toUpperCase().includes('HOR') || k.toUpperCase().includes('IDA')));
                     if(key) hrSaidaRaw = row[key];
                }

                let hrEntradaRaw = row['HORÁRIO DE ENTRADA'] || row['HORARIO DE ENTRADA'] || row['Entrada'] || row['ENTRADA'];
                if (!hrEntradaRaw) {
                    const key = Object.keys(row).find(k => k.toUpperCase().includes('ENTRADA') && k.toUpperCase().includes('HOR'));
                    if(key) hrEntradaRaw = row[key];
                }

                const hrEntrada = parseExcelTime(hrEntradaRaw);
                const hrSaida = parseExcelTime(hrSaidaRaw);

                const statusRaw = (row['STATUS'] || row['Status'] || 'ATIVO').toUpperCase();
                let status = CollaboratorStatus.ATIVO;
                if(statusRaw.includes('FERIAS') || statusRaw.includes('FÉRIAS')) status = CollaboratorStatus.FERIAS;
                else if(statusRaw.includes('DESLIGADO')) status = CollaboratorStatus.DESLIGADO;
                else if(statusRaw.includes('LICENÇA') || statusRaw.includes('MATERNIDADE')) status = CollaboratorStatus.LICENCA_MATERNIDADE;
                else if(statusRaw.includes('AVISO')) status = CollaboratorStatus.AVISO_PREVIO;

                const matricula = String(row['MATRICULA'] || row['Matricula'] || row['Matrícula'] || generateId());
                const nome = row['NOME'] || row['Nome'] || 'Sem Nome';

                // Parsing novos campos
                const emailVr = row['EMAIL VR'] || row['EMAIL_VR'] || row['Email VR'] || row['Email_VR'];
                const senha = row['SENHA'] || row['Senha'] || row['PASSWORD'] || row['Password'];

                const collab: Collaborator = {
                    matricula: matricula,
                    nome: nome,
                    email: row['EMAIL'] || row['Email'] || '',
                    status: status,
                    ilhaId: ilha.id,
                    supervisorId: supervisor.id,
                    coordinatorId: coordinator.id,
                    operationId: operation.id,
                    clientId: client.id,
                    dtEntradaProduto: dtEntrada,
                    horarioEntrada: hrEntrada,
                    horarioSaida: hrSaida,
                    dtNasc: dtNasc,
                    feriasInicio: '',
                    feriasFim: '',
                    dataFim: dtDesligamento,
                    email_vr: emailVr,
                    senha: senha
                };
                
                if (matricula && nome !== 'Sem Nome') {
                    if (isScheduling && scheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === scheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...collab }, scheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, collab, scheduleDate, currentUser.nome);
                        }
                        if (!globalThis.scheduledCount) globalThis.scheduledCount = 0;
                        globalThis.scheduledCount++;
                    } else {
                        newCollaborators.push(collab);
                    }
                }
            }
            
            if (newCollaborators.length > 0) {
                await db.bulkCreateCollaborators(newCollaborators);
                
                const now = new Date().toLocaleString('pt-BR');
                await db.addHistory({
                    action: 'Importação em Massa',
                    target: `${newCollaborators.length} registros`,
                    user: currentUser.nome,
                    date: now,
                    type: 'import',
                    details: `${newCollaborators.length} registros importados via Excel`
                });

                const logPromises = newCollaborators.map(c => db.addHistory({
                    action: 'Importação',
                    target: c.nome,
                    user: currentUser.nome,
                    date: now,
                    type: 'create',
                    details: `Cadastro realizado via importação de arquivo.`
                }));
                await Promise.all(logPromises);
            }

            let msg = '';
            if (newCollaborators.length > 0) msg += `${newCollaborators.length} colaboradores importados.\n`;
            if (globalThis.scheduledCount > 0) {
                msg += `${globalThis.scheduledCount} tarefas agendadas para o mês de referência.\n`;
                globalThis.scheduledCount = 0;
            }
            
            alert(msg ? `Operação concluída com sucesso!\n${msg}` : 'Nenhum registro válido encontrado.');
            handleTabChange('import');
            onRefresh();

        } catch (err: any) {
            console.error(err);
            alert("Erro ao processar importação: " + (err.message || err));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdate = async () => {
        if (rawRows.length === 0) return;
        setIsProcessing(true);
        try {
            const collabs = await db.getCollaborators();
            const updates = [];
            
            const existingClients = await db.getClients();
            const existingOperations = await db.getOperations();
            const existingCoordinators = await db.getCoordinators();
            const existingSupervisors = await db.getSupervisors();
            const existingIlhas = await db.getIlhas();
            const pendingTasks = await db.getPendingTasks();
            
            for (const row of rawRows) {
                const matricula = String(row['MATRICULA'] || row['Matricula'] || row['Matrícula']);
                if (!matricula || matricula === 'undefined') continue;
                
                const collab = collabs.find(c => c.matricula === matricula);
                if (!collab) continue;
                
                // Fields to update
                const clientName = row['CLIENTE'] || row['Cliente'];
                const opName = row['OPERAÇÃO'] || row['OPERACAO'] || row['Operação'];
                const coordName = row['COORDENADOR'] || row['Coordenador'];
                const supName = row['SUPERVISOR'] || row['Supervisor'];
                const ilhaName = row['ILHA'] || row['Ilha'];
                
                // Get or create relations
                let client = collab.clientId ? existingClients.find(c => c.id === collab.clientId) : null;
                if (clientName) {
                    client = existingClients.find(c => c.nome.toLowerCase() === clientName.toLowerCase()) || await db.findOrCreateClient(clientName);
                    if (!existingClients.find(c => c.id === client.id)) existingClients.push(client);
                }
                
                let operation = collab.operationId ? existingOperations.find(o => o.id === collab.operationId) : null;
                if (opName && client) {
                    operation = existingOperations.find(o => o.nome.toLowerCase() === opName.toLowerCase() && o.clientId === client.id) || await db.findOrCreateOperation(opName, client.id);
                    if (!existingOperations.find(o => o.id === operation.id)) existingOperations.push(operation);
                }
                
                let coordinator = collab.coordinatorId ? existingCoordinators.find(c => c.id === collab.coordinatorId) : null;
                if (coordName) {
                    coordinator = existingCoordinators.find(c => c.nome.toLowerCase() === coordName.toLowerCase()) || await db.findOrCreateCoordinator(coordName);
                    if (!existingCoordinators.find(c => c.id === coordinator.id)) existingCoordinators.push(coordinator);
                }
                
                let supervisor = collab.supervisorId ? existingSupervisors.find(s => s.id === collab.supervisorId) : null;
                if (supName && coordinator) {
                    supervisor = existingSupervisors.find(s => s.nome.toLowerCase() === supName.toLowerCase()) || await db.findOrCreateSupervisor(supName, [coordinator.id]);
                    if (!existingSupervisors.find(s => s.id === supervisor.id)) existingSupervisors.push(supervisor);
                }
                
                let ilha = collab.ilhaId ? existingIlhas.find(i => i.id === collab.ilhaId) : null;
                if (ilhaName && client && operation && coordinator && supervisor) {
                    ilha = existingIlhas.find(i => i.nome.toLowerCase() === ilhaName.toLowerCase() && i.clientId === client.id && i.operationId === operation.id) || await db.findOrCreateIlha(ilhaName, client.id, operation.id, [coordinator.id], [supervisor.id]);
                    if (!existingIlhas.find(i => i.id === ilha.id)) existingIlhas.push(ilha);
                }
                
                // Ensure IDs are valid
                const updatePayload: Partial<Collaborator> = {};
                if (client) updatePayload.clientId = client.id;
                if (operation) updatePayload.operationId = operation.id;
                if (coordinator) updatePayload.coordinatorId = coordinator.id;
                if (supervisor) updatePayload.supervisorId = supervisor.id;
                if (ilha) updatePayload.ilhaId = ilha.id;

                if (Object.keys(updatePayload).length > 0) {
                    if (isScheduling && scheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === scheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...updatePayload }, scheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, updatePayload, scheduleDate, currentUser.nome);
                        }
                        if (!globalThis.scheduledCountUpdate) globalThis.scheduledCountUpdate = 0;
                        globalThis.scheduledCountUpdate++;
                    } else {
                        await db.updateCollaborator(collab.matricula, updatePayload);
                    }
                    updates.push(collab.matricula);
                }
            }
            const now = new Date().toLocaleString('pt-BR');
            if (updates.length > 0) {
                await db.addHistory({
                    action: 'Atualização em Massa (Update Tab)',
                    target: `${updates.length} registros`,
                    user: currentUser.nome,
                    date: now,
                    type: 'update',
                    details: `Agendamento de atualização via planilha Excel`
                });
                
                let msg = '';
                const scheduledUpdates = globalThis.scheduledCountUpdate || 0;
                const immediateUpdates = updates.length - scheduledUpdates;
                if (immediateUpdates > 0) msg += `${immediateUpdates} colaboradores atualizados imediatamente.\n`;
                if (scheduledUpdates > 0) msg += `${scheduledUpdates} atualizações agendadas para o mês de referência.\n`;
                globalThis.scheduledCountUpdate = 0;
                alert(`Operação concluída!\n${msg}`);

            } else {
                alert("Nenhum colaborador atualizado. Verifique se as matrículas da planilha existem no sistema.");
            }
            handleTabChange('update');
            onRefresh();

        } catch (err: any) {
            console.error(err);
            alert("Erro ao processar atualização: " + (err.message || err));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Dados</h2>
            
            <div className="flex gap-4 border-b border-gray-200">
                <button 
                    onClick={() => handleTabChange('import')}
                    className={`pb-3 px-4 text-sm font-bold ${activeTab === 'import' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Importar Novos
                </button>
                <button 
                    onClick={() => handleTabChange('update')}
                    className={`pb-3 px-4 text-sm font-bold ${activeTab === 'update' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Update em Massa
                </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                 <div className="w-16 h-16 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileSpreadsheet size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Carregar Planilha Excel ({activeTab === 'import' ? 'Importar' : 'Atualizar'})</h3>
                 
                 <p className="text-gray-500 text-sm mb-6">
                    {activeTab === 'import' ? 
                        "A planilha deve conter as colunas: MATRICULA, NOME, EMAIL, STATUS, SUPERVISOR, COORDENADOR, CLIENTE, OPERAÇÃO, ILHA, DT ENTRADA PRODUTO, HORÁRIOS, DATA FIM, EMAIL VR, SENHA." :
                        "A planilha deve conter as colunas obrigatórias: MATRICULA, SUPERVISOR, ILHA, REFERENCIA, COORDENADOR, OPERAÇÃO, CLIENTE."
                    }
                 </p>
                 
                 <input type="file" id="file-upload" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
                 <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer font-medium transition-colors shadow-lg shadow-brand-500/20">
                     <Upload size={18} /> Selecionar Arquivo
                 </label>

                 {file && (
                     <div className="mt-8 p-6 bg-gray-50 rounded-xl text-left border border-gray-100 animate-in slide-in-from-bottom-2">
                         <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="font-bold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{stats.found} registros encontrados</p>
                            </div>
                            <Button variant="ghost" onClick={() => handleTabChange(activeTab)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 size={16}/>
                            </Button>
                         </div>
                         
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pré-visualização</p>
                         <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 mb-6">
                             <table className="w-full text-xs text-left">
                                 <thead className="bg-gray-50 text-gray-600 font-semibold">
                                     <tr>
                                         {activeTab === 'import' ? (
                                             <>
                                                 <th className="p-3">Matrícula</th>
                                                 <th className="p-3">Nome</th>
                                                 <th className="p-3">Status</th>
                                                 <th className="p-3">Ilha</th>
                                             </>
                                         ) : (
                                             <>
                                                 <th className="p-3">Matrícula</th>
                                                 <th className="p-3">Supervisor</th>
                                                 <th className="p-3">Ilha</th>
                                                 <th className="p-3">Referência</th>
                                             </>
                                         )}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                     {preview.map((row, i) => (
                                         <tr key={i}>
                                             {activeTab === 'import' ? (
                                                 <>
                                                     <td className="p-3">{row.matricula}</td>
                                                     <td className="p-3">{row.nome}</td>
                                                     <td className="p-3">{row.status}</td>
                                                     <td className="p-3">{row.ilha}</td>
                                                 </>
                                             ) : (
                                                 <>
                                                     <td className="p-3">{row.matricula}</td>
                                                     <td className="p-3">{row.supervisor}</td>
                                                     <td className="p-3">{row.ilha}</td>
                                                     <td className="p-3">{row.referencia}</td>
                                                 </>
                                             )}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>

                         <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 flex-wrap">
                             <Button variant="secondary" onClick={() => handleTabChange(activeTab)}>Cancelar</Button>
                             
                             {!isScheduling ? (
                                 <Button variant="secondary" onClick={() => setIsScheduling(true)} disabled={isProcessing}>
                                     <CalendarClock size={16}/> Agendar
                                 </Button>
                             ) : (
                                 <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-left-2">
                                     <span className="text-xs font-bold text-blue-700 uppercase">Agendar para:</span>
                                     <input 
                                         type="date" 
                                         className="px-2 py-1 text-sm rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                         value={scheduleDate}
                                         onChange={(e) => setScheduleDate(e.target.value)}
                                     />
                                     <button 
                                         onClick={() => { setIsScheduling(false); setScheduleDate(''); }} 
                                         className="p-1 rounded-full text-blue-400 hover:text-blue-600 outline-none"
                                     >
                                         <X size={14} />
                                     </button>
                                 </div>
                             )}

                             <Button onClick={activeTab === 'import' ? handleImport : handleUpdate} disabled={isProcessing}>
                                 {isProcessing ? (
                                    <><Loader2 size={16} className="animate-spin mr-2"/> Processando...</>
                                 ) : (
                                    <><CheckCircle size={16} className="mr-2"/> {activeTab === 'import' ? 'Confirmar Importação' : 'Confirmar Atualização'}</>
                                 )}
                             </Button>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};
