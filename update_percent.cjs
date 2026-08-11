const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `<div className="absolute inset-0 flex items-center justify-end px-2 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-gray-800 bg-white/70 px-1 rounded shadow-sm">{Math.round(pct)}%</span>
                                                        </div>`;

const replacement = `<div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none">
                                                            <span className="text-[10px] font-bold text-gray-800">{Math.round(pct)}%</span>
                                                        </div>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log("Percentage label updated");
} else {
    console.log("Target not found");
}
