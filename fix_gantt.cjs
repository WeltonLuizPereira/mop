const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const startRegex = /<div className="border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-1 min-h-0">/;
const endRegex = /Nenhum contrato encontrado\.\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

const startMatch = code.match(startRegex);
const endMatch = code.match(endRegex);

if (startMatch && endMatch) {
    const startIdx = startMatch.index;
    const endIdx = endMatch.index + endMatch[0].length;
    
    const newGanttBlock = `<div className="border border-gray-200 rounded-xl bg-white overflow-hidden flex w-full" style={{ height: 'calc(100vh - 220px)', minHeight: '300px' }}>
                        {/* Left Column (Fixed Width, Vertical Scroll Synced) */}
                        <div className="w-[300px] shrink-0 border-r border-gray-200 flex flex-col bg-white z-20">
                            <div className="h-[80px] shrink-0 border-b border-gray-200 flex items-center px-4 bg-white">
                                <span className="font-bold text-gray-500 text-xs uppercase tracking-wider">Colaborador / Data de Entrada</span>
                            </div>
                            <div className="flex-1 overflow-hidden custom-scrollbar" ref={leftColRef} onScroll={(e) => {
                                // sync scroll back just in case, though mostly we scroll the right pane
                                if (scrollRef.current) scrollRef.current.scrollTop = e.currentTarget.scrollTop;
                            }}>
                                {filtered.map(c => (
                                    <div key={c.matricula} className="h-[60px] border-b border-gray-100 px-4 flex items-center gap-3 bg-white hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200">
                                            {getInitials(c.nome)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-gray-800 truncate text-[13px]" title={c.nome}>{c.nome}</div>
                                            <div className="text-[11px] text-gray-500">{formatDateString(c.dtEntradaProduto)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Timeline (Scrollable) */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                            {/* Header (Horizontal Scroll Synced) */}
                            <div className="h-[80px] shrink-0 border-b border-gray-200 bg-white overflow-hidden flex flex-col relative" ref={topHeaderRef}>
                                <div style={{ width: \`\${ganttDates.length * 40}px\` }} className="flex flex-col relative">
                                    <div className="h-[30px] flex items-center justify-center font-bold text-gray-800 text-sm border-b border-gray-100 sticky left-0 w-full" style={{ left: 0 }}>
                                        {ganttDates.length > 0 && ganttDates[Math.floor(ganttDates.length / 2)].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
                                    </div>
                                    <div className="h-[50px] flex relative">
                                        {ganttDates.map((date, i) => {
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            const dayNum = date.getDate();
                                            const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3);
                                            
                                            return (
                                                <div key={i} className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1" style={{ left: \`\${i * 40}px\`, width: '40px' }}>
                                                    <div className={\`flex flex-col items-center justify-center w-8 rounded \${isToday ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500'} pt-1 pb-1 z-20\`}>
                                                        <span className={\`text-[13px] font-bold leading-none \${isToday ? 'text-white' : 'text-gray-800'}\`}>{dayNum}</span>
                                                        <span className={\`text-[9px] font-medium uppercase mt-0.5 \${isToday ? 'text-blue-100' : 'text-gray-400'}\`}>{dayStr}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid & Bars */}
                            <div className="flex-1 overflow-auto custom-scrollbar relative" ref={scrollRef} onScroll={(e) => {
                                if (leftColRef.current) leftColRef.current.scrollTop = e.currentTarget.scrollTop;
                                if (topHeaderRef.current) topHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
                            }}>
                                <div style={{ width: \`\${ganttDates.length * 40}px\` }} className="relative flex-1 min-h-full">
                                    {/* Vertical Lines */}
                                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none flex z-0 h-full">
                                        {ganttDates.map((date, i) => {
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            return (
                                                <div key={i} className={\`h-full border-r border-gray-100 \${isWeekend ? 'bg-gray-50/50' : ''} \${isToday ? 'border-r-blue-400 border-dashed border-r-2 bg-blue-50/30 z-10 relative' : ''}\`} style={{ width: '40px', flexShrink: 0 }}></div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Bars */}
                                    <div className="relative z-10 flex flex-col">
                                        {filtered.map((c, index) => {
                                            let d1;
                                            if (c.dtEntradaProduto.includes('-')) {
                                                d1 = new Date(c.dtEntradaProduto + 'T00:00:00');
                                            } else {
                                                const parts = c.dtEntradaProduto.split('/');
                                                d1 = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                                            }
                                            d1.setHours(0,0,0,0);
                                            
                                            let d45;
                                            if (c.calc.vence45 !== '-') {
                                                const p = c.calc.vence45.split('/');
                                                d45 = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                                            } else {
                                                d45 = new Date(d1);
                                                d45.setDate(d45.getDate() + 45);
                                            }
                                            d45.setHours(0,0,0,0);

                                            let d90;
                                            if (c.calc.vence90 !== '-') {
                                                const p = c.calc.vence90.split('/');
                                                d90 = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                                            } else {
                                                d90 = new Date(d1);
                                                d90.setDate(d90.getDate() + 90);
                                            }
                                            d90.setHours(0,0,0,0);
                                            
                                            if (!ganttDates.length) return null;
                                            
                                            const startDiff = Math.floor((d1.getTime() - ganttDates[0].getTime()) / (1000 * 60 * 60 * 24));
                                            const end45Diff = Math.floor((d45.getTime() - ganttDates[0].getTime()) / (1000 * 60 * 60 * 24));
                                            const end90Diff = Math.floor((d90.getTime() - ganttDates[0].getTime()) / (1000 * 60 * 60 * 24));
                                            
                                            const leftPx = startDiff * 40;
                                            const widthPx = Math.max(40, (end90Diff - startDiff + 1) * 40);
                                            
                                            const elapsedDays = 90 - c.daysRemaining90;
                                            
                                            let baseColorHex = '#3DD598'; // green
                                            
                                            if (elapsedDays >= 75) {
                                                baseColorHex = '#FFC043'; // yellow
                                            } else if (elapsedDays >= 45) {
                                                baseColorHex = '#FFC043'; // yellow
                                            }
                                            
                                            const isLate = c.daysRemaining90 < 0;
                                            if (isLate) {
                                                baseColorHex = '#EF4444'; // red
                                            }
                                            
                                            const pct = Math.min(100, Math.max(0, (elapsedDays / 90) * 100));

                                            const left45Px = end45Diff * 40 + 20;
                                            const left90Px = end90Diff * 40 + 20;

                                            return (
                                                <div key={c.matricula} className="h-[60px] border-b border-gray-100/50 flex items-center relative shrink-0 w-full hover:bg-gray-50/50 transition-colors" onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setTooltipData({
                                                        show: true,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top,
                                                        data: c
                                                    });
                                                }} onMouseLeave={() => setTooltipData(prev => ({ ...prev, show: false }))}>
                                                    
                                                    {/* 45 Day Marker */}
                                                    {left45Px > 0 && left45Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-0 bottom-0 border-l border-brand-300 border-dashed z-0" style={{ left: \`\${left45Px}px\` }}>
                                                        </div>
                                                    )}

                                                    {/* 90 Day Marker */}
                                                    {left90Px > 0 && left90Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-0 bottom-0 border-l border-red-300 border-dashed z-0" style={{ left: \`\${left90Px}px\` }}>
                                                        </div>
                                                    )}

                                                    <div 
                                                        className="absolute top-1/2 -translate-y-1/2 flex items-center z-20 cursor-pointer rounded-full shadow-sm overflow-hidden" 
                                                        style={{ left: \`\${leftPx}px\`, width: \`\${widthPx}px\`, height: '24px', backgroundColor: \`\${baseColorHex}66\` }}
                                                    >
                                                        <div className="h-full transition-all" style={{ width: \`\${pct}%\`, backgroundColor: baseColorHex }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-end px-2 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-gray-800 bg-white/70 px-1 rounded shadow-sm">{Math.round(pct)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {filtered.length === 0 && (
                                            <div className="text-center text-gray-400 py-12 w-full absolute left-0">
                                                Nenhum contrato encontrado.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;

    code = code.substring(0, startIdx) + newGanttBlock + code.substring(endIdx);
    fs.writeFileSync('App.tsx', code);
    console.log("Rewrote Gantt block successfully");
} else {
    console.log("Could not find targets");
}
