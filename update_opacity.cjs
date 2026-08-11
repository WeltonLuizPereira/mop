const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/backgroundColor: \`\$\{baseColorHex\}66\`/g, 'backgroundColor: \`${baseColorHex}80\`');
fs.writeFileSync('App.tsx', code);
console.log('Opacity updated');
