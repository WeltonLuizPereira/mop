const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `                                                    <div 
                                                        className="absolute top-1/2 -translate-y-1/2 flex items-center z-20 cursor-pointer rounded-full shadow-sm overflow-hidden" 
                                                        style={{ left: \`\${leftPx}px\`, width: \`\${widthPx}px\`, height: '24px', backgroundColor: \`\${baseColorHex}66\` }}
                                                    >
                                                        <div className="h-full transition-all" style={{ width: \`\${pct}%\`, backgroundColor: baseColorHex }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-end px-2 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-gray-800 bg-white/70 px-1 rounded shadow-sm">{Math.round(pct)}%</span>
                                                        </div>
                                                    </div>`;

const replacement = `                                                    <div 
                                                        className="absolute top-1/2 -translate-y-1/2 flex items-center z-20 cursor-pointer rounded-full shadow-sm overflow-hidden" 
                                                        style={{ left: \`\${leftPx}px\`, width: \`\${widthPx}px\`, height: '24px', backgroundColor: \`\${baseColorHex}66\` }}
                                                    >
                                                        <div className="h-full transition-all" style={{ width: \`\${pct}%\`, backgroundColor: baseColorHex }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-end px-2 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-gray-800 bg-white/70 px-1 rounded shadow-sm">{Math.round(pct)}%</span>
                                                        </div>
                                                    </div>

                                                    {/* 45 Day Icon */}
                                                    {left45Px > 0 && left45Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ left: \`\${left45Px - 8}px\` }} title="Vencimento 45 dias">
                                                            <div className="w-[16px] h-[16px] bg-[#FFC043] text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm">!</div>
                                                        </div>
                                                    )}

                                                    {/* 90 Day Icon */}
                                                    {left90Px > 0 && left90Px < ganttDates.length * 40 && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ left: \`\${left90Px - 8}px\` }} title="Vencimento 90 dias">
                                                            <div className="w-[16px] h-[16px] bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm">!</div>
                                                        </div>
                                                    )}`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log("Icons patched!");
} else {
    console.log("Target not found");
}
