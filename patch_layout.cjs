const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Use a regex to replace inside ExpiringContractsPage only
const expiringRegex = /(const ExpiringContractsPage[\s\S]*?return \(\s*)<div className="space-y-6 animate-in fade-in duration-500">/;
code = code.replace(expiringRegex, '$1<div className="flex flex-col gap-6 animate-in fade-in duration-500 h-full">');

fs.writeFileSync('App.tsx', code);
console.log('Layout patched');
