const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `                )}
           </div>
      </div>
    );`;

const replacement = `                )}
            {tooltipData.show && tooltipData.data && (
                <div 
                    className="fixed bg-gray-900 text-white text-xs rounded-xl shadow-2xl p-4 w-[250px] z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+15px)] transition-opacity duration-150"
                    style={{ left: \`\${Math.min(window.innerWidth - 130, Math.max(130, tooltipData.x))}px\`, top: \`\${tooltipData.y}px\` }}
                >
                    <div className="font-bold text-sm mb-1">{tooltipData.data.nome}</div>
                    <div className="text-gray-400 mb-2 border-b border-gray-700 pb-2">Entrada: {tooltipData.data.dtEntradaProduto}</div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vencimento 45d:</span>
                            <span className="font-bold text-brand-300">{tooltipData.data.calc.vence45}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Restante (45):</span>
                            <span className="font-bold">{tooltipData.data.daysRemaining45 < 0 ? 'Venceu' : \`\${tooltipData.data.daysRemaining45} dias\`}</span>
                        </div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-gray-700">
                            <span className="text-gray-400">Vencimento 90d:</span>
                            <span className="font-bold text-red-300">{tooltipData.data.calc.vence90}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Restante (90):</span>
                            <span className="font-bold">{tooltipData.data.daysRemaining90 < 0 ? 'Venceu' : \`\${tooltipData.data.daysRemaining90} dias\`}</span>
                        </div>
                    </div>
                </div>
            )}
           </div>
      </div>
    );`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log("Tooltip patched!");
} else {
    console.log("Target not found!");
}
