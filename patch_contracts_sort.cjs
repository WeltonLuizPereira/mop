const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `    .filter(c => c.calc.experiencia === "SIM")
    .sort((a, b) => {
        return a.daysRemaining90 - b.daysRemaining90;
    });`;

const replacement = `    .filter(c => c.calc.experiencia === "SIM")
    .sort((a, b) => {
        const nextA = a.daysRemaining45 >= 0 ? a.daysRemaining45 : a.daysRemaining90;
        const nextB = b.daysRemaining45 >= 0 ? b.daysRemaining45 : b.daysRemaining90;
        return nextA - nextB;
    });`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log('Patched sorting in ExpiringContractsPage');
} else {
    console.log('Target not found in ExpiringContractsPage');
}
