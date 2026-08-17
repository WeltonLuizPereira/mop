/* Gera components/brand/logoPaths.ts a partir de assets/brand/quality-logo.svg */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'assets/brand/quality-logo.svg'), 'utf8');

const paths = {};
for (const m of svg.matchAll(/<path[^>]*fill="(#[0-9a-fA-F]+)"[^>]*d="([^"]+)"/g)) {
  paths[m[1].toLowerCase()] = m[2].trim();
}
const need = { RING_PATH: '#ff8705', WORD_PATH: '#f7080d', SUB_PATH: '#ffffff' };
const out = ['// GERADO por scripts/extract-logo-paths.cjs — não edite à mão.',
             '// Fonte: assets/brand/quality-logo.svg', ''];
for (const [nome, cor] of Object.entries(need)) {
  if (!paths[cor]) throw new Error(`path ${cor} não encontrado no SVG`);
  out.push(`export const ${nome} = ${JSON.stringify(paths[cor])};`);
}
out.push('', '/** Caixa do anel no viewBox 1024×1024. */',
         "export const RING_VIEWBOX = '327 177 353 360';",
         'export const RING_CENTER = { x: 503.5, y: 357 } as const;');
fs.writeFileSync(path.join(root, 'components/brand/logoPaths.ts'), out.join('\n') + '\n');
console.log('logoPaths.ts gerado');
