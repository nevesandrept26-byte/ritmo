import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['server', 'assets/js'];
const files = [];
for (const root of roots) {
  if (!fs.existsSync(root)) throw new Error(`Pasta em falta: ${root}`);
  walk(root);
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js') || entry.isFile() && full.endsWith('.mjs')) files.push(full);
  }
}
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`\n[ERRO] ${file}\n${result.stderr || result.stdout}`);
  } else {
    process.stdout.write(`[OK] ${file}\n`);
  }
}
for (const file of ['package.json', 'manifest.webmanifest']) {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
    process.stdout.write(`[OK] JSON ${file}\n`);
  } catch (error) {
    failed = true;
    process.stderr.write(`[ERRO] JSON ${file}: ${error.message}\n`);
  }
}

// Verificações estáticas da estrutura HTML principal.
const html = fs.readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  failed = true;
  process.stderr.write(`[ERRO] IDs HTML duplicados: ${[...new Set(duplicates)].join(', ')}\n`);
} else {
  process.stdout.write(`[OK] HTML: ${ids.length} IDs sem duplicações\n`);
}
const pages = [...html.matchAll(/<section\b[^>]*class=["'][^"']*\bpage\b[^"']*["'][^>]*id=["']page-([^"']+)["']/g)].map(match => match[1]);
if (pages.length !== 13) {
  failed = true;
  process.stderr.write(`[ERRO] Esperadas 13 áreas principais; encontradas ${pages.length}.\n`);
} else {
  process.stdout.write(`[OK] HTML: 13 áreas principais\n`);
}
const contributions = fs.readFileSync('assets/js/contributions.js', 'utf8');
for (const page of pages) {
  if (!new RegExp(`^\\s*${page}:\\s*\\{`, 'm').test(contributions)) {
    failed = true;
    process.stderr.write(`[ERRO] Falta a grelha de atividade da área "${page}".\n`);
  }
}
if (!failed) process.stdout.write('[OK] Grelhas de atividade: configuração presente para todas as áreas\n');

if (failed) process.exit(1);
process.stdout.write(`\nVerificação concluída: ${files.length} ficheiros JavaScript validados.\n`);
