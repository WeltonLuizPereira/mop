const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const updateTarget = `                const referenciaRaw = row['REFERENCIA'] || row['Referencia'] || row['Referência'];
                
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
                }`;

const updateReplacement = `                if (Object.keys(updatePayload).length > 0) {
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
                }`;

if (code.includes(updateTarget)) {
    code = code.replace(updateTarget, updateReplacement);
    fs.writeFileSync('App.tsx', code);
    console.log("Scheduling logic updated in Update!");
} else {
    console.log("Could not find Update target.");
}
