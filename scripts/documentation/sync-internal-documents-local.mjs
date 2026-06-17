import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

export function parseSupabaseStatusEnv(output) {
  const parsed = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="(.*)"$/);
    if (!match) {
      continue;
    }

    const [, key, value] = match;
    if (key === 'API_URL' || key === 'SERVICE_ROLE_KEY') {
      parsed[key] = value;
    }
  }

  return parsed;
}

function isLoopbackUrl(value) {
  try {
    const url = new URL(value);
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function buildInternalDocsSyncApplyEnv(statusEnv) {
  const apiUrl = statusEnv.API_URL;
  const serviceRoleKey = statusEnv.SERVICE_ROLE_KEY;

  if (!apiUrl || !serviceRoleKey) {
    throw new Error('Supabase local env incompleto para sincronizar documentos internos.');
  }

  if (!isLoopbackUrl(apiUrl)) {
    throw new Error('Sync local de documentos exige uma URL local Supabase.');
  }

  return {
    INTERNAL_DOCS_SYNC_APPLY: '1',
    SUPABASE_URL: apiUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.stdio ?? 'pipe',
    env: options.env ?? process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function main() {
  const status = run('npx', ['supabase', 'status', '-o', 'env']);
  if (status.status !== 0) {
    process.stderr.write(status.stderr || status.stdout);
    return status.status ?? 1;
  }

  const applyEnv = buildInternalDocsSyncApplyEnv(parseSupabaseStatusEnv(status.stdout));
  const sync = run('node', ['scripts/documentation/sync-internal-documents.mjs', '--apply'], {
    env: {
      ...process.env,
      ...applyEnv,
    },
    stdio: 'inherit',
  });

  return sync.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
