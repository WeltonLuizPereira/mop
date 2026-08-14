const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = '<div className="flex flex-col gap-6 animate-in fade-in duration-500 h-full">';
const replacement = '<div className="flex flex-col gap-6 animate-in fade-in duration-500">';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log('Fixed ExpiringContractsPage height issue!');
} else {
    console.log('Target not found!');
}
