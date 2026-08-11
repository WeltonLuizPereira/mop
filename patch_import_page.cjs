const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Add states to ImportPage
code = code.replace(
    /const \[isProcessing, setIsProcessing\] = useState\(false\);/,
    `const [isProcessing, setIsProcessing] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');`
);

// 2. Clear states on handleTabChange
code = code.replace(
    /setStats\(\{ found: 0 \}\);/,
    `setStats({ found: 0 });
        setIsScheduling(false);
        setScheduleDate('');`
);

// 3. Add UI before buttons
const uiTarget = `<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">`;
const uiReplacement = `<div className="mb-4 flex flex-col md:flex-row md:items-center gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input 
                                     type="checkbox" 
                                     checked={isScheduling}
                                     onChange={(e) => setIsScheduling(e.target.checked)}
                                     className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                                 />
                                 <span className="text-sm font-bold text-gray-700">Definir Mês de Referência</span>
                             </label>
                             {isScheduling && (
                                 <Input 
                                     type="date" 
                                     value={scheduleDate} 
                                     onChange={(e) => setScheduleDate(e.target.value)}
                                     className="w-[200px]"
                                 />
                             )}
                         </div>
                         <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">`;
code = code.replace(uiTarget, uiReplacement);

// 4. Update handleImport logic
const handleImportRegex = /const referenciaRaw = row\['REFERENCIA'\] \|\| row\['Referencia'\] \|\| row\['Referência'\];[\s\S]*?(?=if \(newCollaborators.length > 0\) {)/;

const newHandleImportLogic = `const referenciaRaw = row['REFERENCIA'] || row['Referencia'] || row['Referência'];
                
                let shouldSchedule = false;
                let finalScheduleDate = '';
                
                if (isScheduling && scheduleDate) {
                    shouldSchedule = true;
                    finalScheduleDate = scheduleDate;
                } else if (referenciaRaw) {
                    shouldSchedule = true;
                    finalScheduleDate = parseExcelDate(referenciaRaw);
                }
                
                if (shouldSchedule && finalScheduleDate) {
                    const sDate = new Date(finalScheduleDate + 'T00:00:00');
                    const today = new Date();
                    if (sDate.getMonth() === today.getMonth() && sDate.getFullYear() === today.getFullYear()) {
                        shouldSchedule = false;
                    }
                }

                if (matricula && nome !== 'Sem Nome') {
                    if (shouldSchedule && finalScheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === finalScheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...collab }, finalScheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, collab, finalScheduleDate, currentUser.nome);
                        }
                        if (!globalThis.scheduledCount) globalThis.scheduledCount = 0;
                        globalThis.scheduledCount++;
                    } else {
                        newCollaborators.push(collab);
                    }
                }
            }
            
            `;

code = code.replace(handleImportRegex, newHandleImportLogic);

// 5. Update handleUpdate logic
const handleUpdateRegex = /const updatePayload: Partial<Collaborator> = \{\};[\s\S]*?(?=if \(updates\.length > 0\) \{)/;
const newHandleUpdateLogic = `const updatePayload: Partial<Collaborator> = {};
                if (client) updatePayload.clientId = client.id;
                if (operation) updatePayload.operationId = operation.id;
                if (coordinator) updatePayload.coordinatorId = coordinator.id;
                if (supervisor) updatePayload.supervisorId = supervisor.id;
                if (ilha) updatePayload.ilhaId = ilha.id;

                const referenciaRaw = row['REFERENCIA'] || row['Referencia'] || row['Referência'];
                
                let shouldSchedule = false;
                let finalScheduleDate = '';
                
                if (isScheduling && scheduleDate) {
                    shouldSchedule = true;
                    finalScheduleDate = scheduleDate;
                } else if (referenciaRaw) {
                    shouldSchedule = true;
                    finalScheduleDate = parseExcelDate(referenciaRaw);
                }
                
                if (!shouldSchedule || !finalScheduleDate) {
                    // Se não tiver agendamento, aplica direto
                    if (Object.keys(updatePayload).length > 0) {
                        await db.updateCollaborator(collab.matricula, updatePayload);
                        updates.push(collab.matricula);
                    }
                    continue;
                }

                if (shouldSchedule && finalScheduleDate) {
                    const sDate = new Date(finalScheduleDate + 'T00:00:00');
                    const today = new Date();
                    if (sDate.getMonth() === today.getMonth() && sDate.getFullYear() === today.getFullYear()) {
                        shouldSchedule = false;
                    }
                }

                if (Object.keys(updatePayload).length > 0) {
                    if (shouldSchedule && finalScheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === finalScheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...updatePayload }, finalScheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, updatePayload, finalScheduleDate, currentUser.nome);
                        }
                        if (!globalThis.scheduledCountUpdate) globalThis.scheduledCountUpdate = 0;
                        globalThis.scheduledCountUpdate++;
                    } else {
                        // Apply immediately if it's current month
                        await db.updateCollaborator(collab.matricula, updatePayload);
                    }
                    updates.push(collab.matricula);
                }
            }
            const now = new Date().toLocaleString('pt-BR');
            `;
code = code.replace(handleUpdateRegex, newHandleUpdateLogic);

// Finally, update the message for handleUpdate
const updateMsgRegex = /alert\(\`Atualização agendada com sucesso! \$\{updates.length\} tarefas criadas para o mês de referência\.\`\);/;
const newUpdateMsg = `
                let msg = '';
                const scheduledUpdates = globalThis.scheduledCountUpdate || 0;
                const immediateUpdates = updates.length - scheduledUpdates;
                if (immediateUpdates > 0) msg += \`\${immediateUpdates} colaboradores atualizados imediatamente.\\n\`;
                if (scheduledUpdates > 0) msg += \`\${scheduledUpdates} atualizações agendadas para o mês de referência.\\n\`;
                globalThis.scheduledCountUpdate = 0;
                alert(\`Operação concluída!\\n\${msg}\`);
`;
code = code.replace(updateMsgRegex, newUpdateMsg);


fs.writeFileSync('App.tsx', code);
console.log('App.tsx patched!');
