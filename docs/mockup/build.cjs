/* Injeta os paths reais de assets/brand/quality-logo.svg no template do mockup.
   Evita duplicar 25 KB de dado de path na mão. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const svg = fs.readFileSync(path.join(root, 'assets/brand/quality-logo.svg'), 'utf8');

const paths = {};
for (const m of svg.matchAll(/<path[^>]*fill="(#[0-9a-fA-F]+)"[^>]*d="([^"]+)"/g)) {
  paths[m[1].toLowerCase()] = m[2].trim();
}

const RING = paths['#ff8705']; // anel de pincel
const WORD = paths['#f7080d']; // wordmark QUALITY
const SUB  = paths['#ffffff']; // linha "Contact Center"

if (!RING || !WORD || !SUB) {
  throw new Error('Path faltando no SVG do logo: ' + Object.keys(paths).join(', '));
}

let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
html = html
  .replace('__RING__', () => RING)
  .replace('__WORD__', () => WORD)
  .replace('__SUB__',  () => SUB);

const out = path.join(__dirname, 'index.html');
fs.writeFileSync(out, html);
console.log('ok ->', out, (html.length / 1024).toFixed(0) + ' KB');
console.log('ring pts:', (RING.match(/L/g) || []).length);
