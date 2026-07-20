import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let raw = '';
try {
  raw = execSync('npx supabase status -o env', { cwd: root, encoding: 'utf8' });
} catch {
  console.error('[env] Nao consegui ler o status do Supabase. Ele esta rodando?');
  process.exit(1);
}

const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
  if (m) env[m[1]] = m[2];
}

const apiUrl = env.API_URL || 'http://127.0.0.1:54321';
const anon = env.ANON_KEY;
if (!anon) {
  console.error('[env] ANON_KEY nao encontrada no status do Supabase.');
  process.exit(1);
}

const content = [
  'VITE_APP_ENV=development',
  `VITE_SUPABASE_URL=${apiUrl}`,
  `VITE_SUPABASE_ANON_KEY=${anon}`,
  '',
].join('\n');

writeFileSync(join(root, 'apps', 'web', '.env.local'), content);
console.log(`[env] apps/web/.env.local configurado para ${apiUrl}`);
