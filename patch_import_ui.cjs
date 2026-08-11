const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `<div className="mb-4 flex flex-col md:flex-row md:items-center gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
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
                         <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                             <Button variant="secondary" onClick={() => handleTabChange(activeTab)}>Cancelar</Button>
                             <Button onClick={activeTab === 'import' ? handleImport : handleUpdate} disabled={isProcessing}>
                                 {isProcessing ? (
                                    <><Loader2 size={16} className="animate-spin mr-2"/> Processando...</>
                                 ) : (
                                    <><CheckCircle size={16} className="mr-2"/> {activeTab === 'import' ? 'Confirmar Importação' : 'Confirmar Atualização'}</>
                                 )}
                             </Button>
                         </div>`;

const replacement = `<div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 flex-wrap">
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
                         </div>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log('UI Patched!');
} else {
    console.log('Target not found!');
}
