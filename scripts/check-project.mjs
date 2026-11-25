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
if (failed) process.exit(1);
process.stdout.write(`\nVerificação concluída: ${files.length} ficheiros JavaScript validados.\n`);
