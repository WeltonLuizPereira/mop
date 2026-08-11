const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const importRegex = /const referenciaRaw = row\['REFERENCIA'\] \|\| row\['Referencia'\] \|\| row\['Referência'\];[\s\S]*?(?=if \(!globalThis\.scheduledCount\))/;

const importReplacement = `if (matricula && nome !== 'Sem Nome') {
                    if (isScheduling && scheduleDate) {
                        const pendingTasks = await db.getPendingTasks();
                        const existingTask = pendingTasks.find(t => t.matricula === collab.matricula && t.scheduled_date === scheduleDate);
                        
                        if (existingTask) {
                            await db.updateTask(existingTask.id, { ...existingTask.changes, ...collab }, scheduleDate);
                        } else {
                            await db.scheduleTask(collab.matricula, collab, scheduleDate, currentUser.nome);
                        }
                        `;
                        
code = code.replace(importRegex, importReplacement);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx import patched');
